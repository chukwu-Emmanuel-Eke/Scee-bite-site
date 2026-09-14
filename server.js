const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');
const multer = require('multer');

const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});


app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});


const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

pool.connect((err, client, release) => {
    if (err) {
        console.error('Database connection error:', err.stack);
    } else {
        console.log('Connected to PostgreSQL successfully');
        release();
    }
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

app.get('/api/products', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Database read failed' });
    }
});

app.post('/api/products', upload.single('image'), async (req, res) => {
    const { name, category, description, price } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : req.body.image_url || '';

    try {
        const result = await pool.query(
            'INSERT INTO products (name, category, description, price, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, category, description || '', price, image_url]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to add product' });
    }
});

app.put('/api/products/:id', upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const { name, category, price, existing_image_url } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : existing_image_url;

    try {
        const result = await pool.query(
            'UPDATE products SET name = $1, category = $2, price = $3, image_url = $4 WHERE id = $5 RETURNING *',
            [name, category, price, image_url, id]
        );
        res.json({ message: 'Product updated successfully', product: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: 'Database update failed' });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM products WHERE id = $1', [id]);
        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Database delete failed' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
