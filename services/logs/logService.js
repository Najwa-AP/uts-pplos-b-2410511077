import 'dotenv/config';
import express from 'express';
import mysql from 'mysql2';
import config from './config';

const port = 4003;
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// inisialisasi koneksi ke database
const db = mysql.createConnection(config.db);

app.post('/logs', (req, res) => {
    const { complaint_id, action, description } = req.body;
    const query = "INSERT INTO complaint_logs (complaint_id, action, description) VALUES (?, ?, ?)";
    
    db.query(query, [complaint_id, action, description], (err) => {
        if (err) return res.status(500).json({ 
            status: "error", 
            message: err.message 
        });
        res.json({ 
            status: "success", 
            message: "Log tersimpan" 
        });
    });
});

app.listen(port, () => {
    console.log(`Logs Service di port ${port}`);
});