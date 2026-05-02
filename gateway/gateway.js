import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import jwt from 'jsonwebtoken';
import { createProxyMiddleware } from 'http-proxy-middleware';
import rateLimit from 'express-rate-limit';
import config from './config.js'
import mysql from 'mysql2';

const app = express();
const port = 4000;

app.use(express.urlencoded({ extended: true }));

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
        status: "error",
        message: "Terlalu banyak request, silakan coba lagi nanti"
    }
});

app.use(limiter);

// --- PUBLIC ROUTE (Tanpa JWT) ---
app.use('/auth', (req, res, next) => {
    // daftar path yang lewat tanpa token
    const publicPaths = ['/github', '/github/callback', '/refresh-token', '/register', '/login'];
    
    // cek apakah request path ada di daftar 
    const pathWithoutAuth = req.path; 
    if (publicPaths.includes(pathWithoutAuth)) {
        return createProxyMiddleware({
            target: 'http://localhost:4001',
            changeOrigin: true,
            pathRewrite: { '^/auth': '' },
            onProxyReq: (proxyReq, req, res) => {
                if (req.body) {
                    const bodyData = JSON.stringify(req.body);
                    proxyReq.setHeader('Content-Type', 'application/json');
                    proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                    proxyReq.write(bodyData);
                }
            }
        })(req, res, next);
    }
    next();
});

// buat cek JWT
const authenticateToken = (req, res, next) => {
    // ambil header authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            status: "error",
            message: "Token JWT tidak ditemukan" 
        });
    }

    const checkBlacklist = "SELECT * FROM token_blacklist WHERE token = ?";
    db.query(checkBlacklist, [token], (err, results) => {
        if  (err) return res.status(500).json({ 
            status: "error",
            message: "Terjadi gangguan pada server, silakan coba lagi nanti"
        });
    
        if (results.length > 0) {
            return res.status(403).json({ 
                status: "error",
                message: "Token JWT yang anda masukkan sudah tidak berlaku lagi" 
            });
        }

        // verifikasi token pakai secret key
        jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, user) => {
            if (err) {
                console.log("JWT Verify Error:", err.message);
                return res.status(403).json({ 
                    status: "error",
                    message: "Token JWT yang anda beri tidak valid"
                });
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

// --- PROTECTED ROUTE (ada JWT) ---
// API gateway arahin request ke /auth/profile
app.get('/auth/profile', authenticateToken, createProxyMiddleware({
    target: 'http://localhost:4001',
    changeOrigin: true,
    pathRewrite: { '^/auth': '' },
    onProxyReq: (proxyReq, req) => {
        if (req.headers['x-user-data']) {
            proxyReq.setHeader('x-user-data', req.headers['x-user-data']);
        }
    }
}));

// API gateway arahin request ke /auth/logout
app.post('/auth/logout', authenticateToken, createProxyMiddleware({
    target: 'http://localhost:4001',
    changeOrigin: true,
    pathRewrite: { 
        '^/auth': '' 
    }
}));

// API gateway arahin request ke service complaints 
app.use('/complaints', authenticateToken, createProxyMiddleware({
    target: 'http://localhost:4002', 
    changeOrigin: true,
    pathRewrite: {
        '^/complaints': '',
    },
}));

// API gateway arahin request service logs
app.use('/logs', authenticateToken, createProxyMiddleware ({
    target: 'http://localhost:4003',
    changeOrigin: true,
    //pathRewrite: {
        //'^/logs': '/logs', // Ini artinya: "Tetap tulis /logs di depan, jangan dihapus"
    //},
}));

// port
app.listen(port, () => {
    console.log(`API Gateway berjalan di port ${port}`);
});