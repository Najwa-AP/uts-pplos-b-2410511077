import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const port = 4000;

// API gateway arahin request ke auth-service
app.use('/auth', createProxyMiddleware ({
    target: 'http://localhost:4001',
    changeOrigin: true,
    pathRewrite: {
        '^/auth-service': '',
    },
}));

// API gateway arahin request ke service2
app.use('/complaints', createProxyMiddleware ({
    target: 'http://localhost:4002',
    changeOrigin: true
}));

// API gateway arahin request service3
app.use('/logs', createProxyMiddleware ({
    target: 'http://localhost:4003',
    changeOrigin: true,
    pathRewrite: {
        '^/service3': '',
    },
}));

app.listen(port, () => {
    console.log(`API Gateway berjalan di port ${port}`);
});