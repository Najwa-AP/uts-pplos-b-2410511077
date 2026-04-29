import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import mysql from 'mysql2';
import config from './config.js';
import jwt from 'jsonwebtoken';

const app = express();
const port = config.port;

// inisialisasi koneksi ke database
const db = mysql.createConnection(config.db);

const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
    );
    const refreshToken = jwt.sign(
        { id: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );
    return { accessToken, refreshToken };
};

db.connect((err) => {
    if (err) {
        console.error("Gagal terhubung ke database, ", err.message);
    }
    console.log("Berhasil terhubung ke db_auth");
});

// middleware jwt
const authenticateToken = (req, res, next) => {
    // ambil header authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: "Token tidak ditemukan" });
    }

    // verifikasi token pakai secret key
    jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: "Token tidak valid" });
        }

        req.user = user;
        next();
    });
}

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

// respons buat test API/logout
app.get('/', (req, res) => {
    res.json({ message: 'Response dari Service Auth atau anda sudah logout' });
});

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
            status: "Success",
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
            { id: user.id, username: decoded.username },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: '15m' }
        );
        res.json({ access_token: accessToken });
    });
});

// route buat lihat hasil login
app.get('/profile', authenticateToken, (req, res) => {
    res.json({
            message: "Anda berhasil login dengan JWT",
            user: req.user
    });
});

// serialize & deserialize user
passport.serializeUser((user, done) => done(null, user.id)); 
passport.deserializeUser((id, done) => {
    db.query('SELECT * FROM users WHERE id = ?', [id], (err, results) => {
        done(err, results[0]);
    });
});

// route logout dan (hapus session user) <= pengennya ini juga bisa
app.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        res.redirect('/');
    });
});

app.listen(process.env.PORT, () => {
    console.log(`Service Auth sedang berjalan dari port ${port}`);
});