import 'dotenv/config';
import express from 'express';
import mysql from 'mysql2';
import config from './config.js';

const port = 4003;
const app = express();
const router = express.Router();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// inisialisasi koneksi ke database
const db = mysql.createConnection(config.db);

router.post('/', (req, res) => {
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

// buat ambil log berdasarkan id
router.get('/:id', (req, res) => {
    const complaint_id = req.params.id; 

    if (!complaint_id) {
        return res.status(400).json({
            status: "error",
            message: "Parameter complaint_id gak boleh kosong, silakan isi"
        });
    }

    const query = "SELECT * FROM complaint_logs WHERE complaint_id = ? ORDER BY created_at DESC";
    
    db.query(query, [complaint_id], (err, results) => {
        if (err) return res.status(500).json({ 
            status: "error", 
            message: err.message 
        });

        if (results.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "Belum ada log untuk pengaduan ini"
            });
        }

        res.json({ 
            status: "success", 
            data: results 
        });
    });
});

app.use('/', router);

app.listen(port, () => {
    console.log(`Logs Service di port ${port}`);
});