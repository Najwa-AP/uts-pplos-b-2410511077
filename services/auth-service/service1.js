import express from 'express';

const app = express();
const port = 4001;

// buat baca data di json
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'Response dari Service Auth' });
});

app.listen(port, () => {
    console.log(`Service Auth sedang berjalan dari port ${port}`);
});