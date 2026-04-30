import express from 'express';
import jwt from 'jsonwebtoken';
import { createProxyMiddleware } from 'http-proxy-middleware';
import rateLimit from 'express-rate-limit';
import 'dotenv/config';
import config from './config.js';

const app = express();
const port = 4000;

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

// --- PUBLIC ROUTE ---
const publicAuthPaths = [
    '/auth/github', // buat login github oauth
    '/auth/github/callback', // callback setelah login github berhasil
    '/auth/refresh-token', // buat refresh token
    '/auth/login' // buat login manual (username+password)
];

publicAuthPaths.forEach(path => {
    app.use('/auth/github', createProxyMiddleware ({
        target: 'http://localhost:4001',
        changeOrigin: true,
        pathRewrite: {
            '^/auth': '',
        },
    }));
});

// buat cek JWT
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

// --- PROTECTED ROUTE (Wajib JWT) ---
// API gateway arahin request ke auth-service
app.use('/auth/profile', authenticateToken , createProxyMiddleware ({
    target: 'http://localhost:4001',
    changeOrigin: true,
    pathRewrite: {
        '^/auth': '',
    },
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