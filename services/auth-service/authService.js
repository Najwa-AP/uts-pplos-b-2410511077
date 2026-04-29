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

db.connect((err) => {
    if (err) {
        console.error("Gagal terhubung ke database, ", err.message);
    }
    console.log("Berhasil terhubung ke db_auth");
});

// middleware
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
        failureRedirect: '/' }),
    (req, res) => {
        res.redirect('/auth/profile');
    }
);

// serialize & deserialize user
passport.serializeUser((user, done) => done(null, user.id)); 
passport.deserializeUser((id, done) => {
    db.query('SELECT * FROM users WHERE id = ?', [id], (err, results) => {
        done(err, results[0]);
    });
});

// route buat lihat hasil login
app.get('/profile', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({
            message: "Anda berhasil login",
            user: req.user
        });
    } else {
        res.status(401).json({ message: "Silahkan login terlebih dahulu" });
    }
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