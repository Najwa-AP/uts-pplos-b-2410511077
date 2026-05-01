import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import mysql from 'mysql2';
import config from './config.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { body, validationResult } from 'express-validator';

const app = express();
const port = config.port;

app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// inisialisasi koneksi ke database
const db = mysql.createConnection(config.db);

const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { id: user.id, username: user.username, email: user.email, photo: user.profile_pic },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
    );
    const refreshToken = jwt.sign(
        { id: user.id, username: user.username, email: user.email },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );
    return { accessToken, refreshToken };
};

db.connect((err) => {
    if (err) {
        console.error(
            "Gagal terhubung ke database, ", err.message);
            process.exit(1);
    }
    console.log("Berhasil terhubung ke db_auth");
});

app.use(session ({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

// config passport github
passport.use(new GitHubStrategy({
    clientID: config.github.clientId,
    clientSecret: config.github.clientSecret,
    callbackURL: config.github.callbackUrl
},
(accessToken, refreshToken, profile, done) => {
    // data yg diambil dari profile github
    const email = (profile.emails && profile.emails.length > 0) 
        ? profile.emails[0].value
        : `${profile.username}@github.com`; // github kadang gk send email jika di-private
    const foto = (profile._json && profile._json.avatar_url)
        ? profile._json.avatar_url 
        : null;
    const { id, username, displayName } = profile;
    
    // cek apakah user udah ada di dalam tabel users
    db.query('SELECT * FROM users WHERE github_id = ?', [id], (err, results) => {
        if (err) return done(err);

        if (results.length > 0) {
            return done(null, results[0]);
        } else {
            // buat user baru jika belum ada
            db.query('INSERT INTO users (nama, username, email, github_id, profile_pic, oauth_provider) VALUES (?, ?, ?, ?, ?, ?)',
                [displayName || username, username, email, id, foto, 'github'],
                (err, result) => {
                    if (err) return done(err);
                    db.query('SELECT * FROM users WHERE id = ?', [result.insertId], (err, user) => {
                        return done(null, user[0]);
                    });
                }
            );
        }
    });        
}));

// buat validasi input
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: "error",
            message: "Validasi gagal",
            errors: errors.array().map(err => ({ 
                field: err.path, 
                message: err.msg 
            }))
        });
    }
    next();
}

// route untuk login pake github
app.get('/github', 
    passport.authenticate('github', { 
        scope: ['user:email']
}));

// callback route setelah login github berhasil
app.get('/github/callback', 
    passport.authenticate('github', { 
        failureRedirect: '/auth'}),
    (req, res) => {
        const { accessToken, refreshToken } = generateTokens(req.user);
        
        res.json({
            status: "success",
            access_token: accessToken,
            refresh_token: refreshToken
        });
    }
);

// route buat refresh token
app.post('/refresh-token', (req, res) => { 
    const { token } = req.body;
    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_REFRESH_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);

        // buat access token baru
        const accessToken = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: '15m' }
        );
        res.json({ access_token: accessToken });
    });
});

// route buat register 
app.post('/register', [
    body('username').isLength({ min: 5 }).withMessage('Username minimal 5 karakter'),
    body('email').isEmail().withMessage('Format email tidak valid'),
    body('password').isLength({ min: 8 }).withMessage('Password minimal 8 karakter'),
    validate 
], (req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);

    const query = "INSERT INTO users (username, email, password, oauth_provider) VALUES (?, ?, ?, 'local')";    
    db.query(query, [username, email, hashedPassword], (err, result) => {
        if (err) return res.status(500).json({ 
            status: "error",
            message: "Gagal mendaftar. Email atau username mungkin sudah digunakan" 
        });
       
        res.status(201).json({ 
            status: "success",
            message: "Berhasil mendaftarkan akun" 
        });
    });
});

// route buat login
app.post('/login', [
    body('email').isEmail().withMessage('Format email tidak valid'),
    body('password').notEmpty().withMessage('Password tidak boleh kosong'),
    validate 
], (req, res) => {
    const { email, password } = req.body;

    const query = "SELECT * FROM users WHERE email = ?";
    db.query(query, [email], (err, results) => {
        if (err || results.length === 0) return res.status(400).json({ 
            status: "error",
            message: "User tidak ditemukan di dalam database" 
        });

        const user = results[0];
        
        // Cek apaka user oauth atau lokal
        if (user.oauth_provider !== 'local') {
            return res.status(400).json({ 
                status: "error",
                message: "Silahkan login menggunakan OAuth GitHub" 
            });
        }

        // banding password input dengan hash di db
        if (bcrypt.compareSync(password, user.password)) {
            const tokens = generateTokens(user);
            res.json({
                message: "Login Berhasil",
                ...tokens
            });
        } else {
            res.status(401).json({ 
                status: "error",
                message: "Passwordnya salah, silakan coba lagi" 
            });
        }
    });
});

// route buat logout
app.post('/logout', (req, res, next) => {
    // ambil header authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            status: "error",
            message: "Token tidak ditemukan, silakan masukkan token yang sudah diberikan" 
        });
    }

    const query = "INSERT INTO token_blacklist (token) VALUES (?)";
    db.query(query, [token], (err, result) => {
        if (err) return res.status(500).json({ 
            status: "error",
            message: "Gagal logout karena server terganggu, silakan coba lagi" 
        });

        res.json({ 
            status: "success",
            message: "Logout berhasil, dan token telah di blacklist" 
        });
    });
});

// route buat lihat hasil login
app.get('/profile', (req, res) => {
    // Ambil data user dari header yang dikirim gateway
    const userData = req.headers['x-user-data'];

    if (!userData) {
        return res.status(401).json({ 
            status: "error",
            message: "Data user tidak diteruskan oleh Gateway" 
        });
    }

    res.json({
        status: "success",
        message: "Anda berhasil login dengan JWT",
        user: JSON.parse(userData)
    });
});

// serialize & deserialize user
passport.serializeUser((user, done) => done(null, user.id)); 
passport.deserializeUser((id, done) => {
    db.query('SELECT * FROM users WHERE id = ?', [id], (err, results) => {
        done(err, results[0]);
    });
});

// respons buat test API
app.get('/', (req, res) => {
    res.json({ 
        status: "success",
        message: 'Response dari Service Auth (test API)' 
    });
});

app.listen(port, () => {
    console.log(`Service Auth sedang berjalan dari port ${port}`);
});