import express from 'express';
import jwt from 'jsonwebtoken';
import { createProxyMiddleware } from 'http-proxy-middleware';
import rateLimit from 'express-rate-limit';
import 'dotenv/config';
import config from './config.js'
import mysql from 'mysql2';

const app = express();
const port = 4000;

// inisialisasi koneksi ke database
const db = mysql.createConnection(config.db);

app.set('trust proxy', 1);

// set rate limit request
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,  // 1 menit
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 429,
        message: "Terlalu banyak request, silakan coba lagi nanti"}
});

app.use(limiter);

// rute ke auth service
app.use('/auth', (req, res, next) => {
    // Daftar path yang BOLEH lewat tanpa token
    const publicPaths = ['/github', '/github/callback', '/refresh-token', '/register', '/login', '/logout'];
    
    // Jika request mengarah ke salah satu path di atas, langsung proxy tanpa authenticateToken
    if (publicPaths.some(path => req.path.startsWith(path))) {
        return createProxyMiddleware({
            target: 'http://localhost:4001',
            changeOrigin: true,
            pathRewrite: { '^/auth': '' },
        })(req, res, next);
    }
    // Jika tidak ada di daftar (misal /profile), biarkan lanjut ke route di bawahnya
    next();
});

// buat cek JWT
const authenticateToken = (req, res, next) => {
    // ambil header authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: "Token tidak ditemukan" });
    }

    const checkBlacklist = "SELECT * FROM token_blacklist WHERE token = ?";
    db.query(checkBlacklist, [token], (err, results) => {
        if  (err) return res.status(500).json({ message: "Database error" });
    
        if (results.length > 0) {
            return res.status(403).json({ message: "Token sudah tidak berlaku lagi (sudah logout)" });
        }

        // verifikasi token pakai secret key
        jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({ message: "Token tidak valid" });
            }

            // kirim data ke service lewat header tambahan
            req.headers['x-user-id'] = user.id;
            req.headers['x-user-username'] = user.username;
            req.headers['x-user-data'] = JSON.stringify(user);

            req.user = user;
            next();
        });
    });
}

// --- PROTECTED ROUTE (Wajib JWT) ---
// API gateway arahin request ke auth-service
app.use('/auth/profile', authenticateToken , createProxyMiddleware ({
    target: 'http://localhost:4001',
    changeOrigin: true,
    pathRewrite: {
        '^/auth': '',
    },
    onProxyReq: (proxyReq, req, res) => {
        // paksa proxy bawa header yg dibuat di authenticateToken
        if (req.user) {
            proxyReq.setHeader('x-user-data', JSON.stringify(req.user));
            proxyReq.setHeader('x-user-id', req.user.id);
        }
    }
}));

// API gateway arahin request ke service2 
app.use('/complaints', authenticateToken, createProxyMiddleware ({
    target: 'http://localhost:4002',
    changeOrigin: true
}));

// API gateway arahin request service3
app.use('/logs', authenticateToken, createProxyMiddleware ({
    target: 'http://localhost:4003',
    changeOrigin: true,
    pathRewrite: {
        '^/logs': '',
    },
}));

// port
app.listen(port, () => {
    console.log(`API Gateway berjalan di port ${port}`);
});