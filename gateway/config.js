import 'dotenv/config';

// config 
export default {
    port: process.env.PORT || 4000,
    db: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME 
    },
    github: {
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackUrl: process.env.GITHUB_REDIRECT_URI
    },
    sessionSecret: process.env.SESSION_SECRET 
};