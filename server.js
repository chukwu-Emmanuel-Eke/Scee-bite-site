require('dotenv').config();

const express = require('express');
const app = express();
const path = require('path');
const { Pool } = require('pg');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');

// 1. Safe Supabase Client Initialization (Prevents startup crash on Render)
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseKey);

const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the root directory
app.use(express.static(__dirname));

// Route Handlers
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// 2. Safe PostgreSQL Connection Pool
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

// Supabase Storage Helper Function
async function uploadToSupabase(file) {
  if (!file) return null;
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    throw new Error('Supabase credentials missing in Environment Variables');
  }

  const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;

  const { data: storageData, error: storageError } = await supabase.storage
    .from('product-images')
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
    });

  if (storageError) throw storageError;

  const { data: publicUrlData } = supabase.storage
    .from('product-images')
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
}

// API Endpoints
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('GET Error:', err);
    res.status(500).json({ error: 'Database read failed' });
  }
});

app.post('/api/products', upload.single('image'), async (req, res) => {
  const { name, category, description, price } = req.body;

  try {
    let image_url = req.body.image_url || '';

    if (req.file) {
      image_url = await uploadToSupabase(req.file);
    }

    const result = await pool.query(
      'INSERT INTO products (name, category, description, price, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, category, description || '', price, image_url]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST Error:', err);
    res.status(500).json({ error: 'Failed to add product' });
  }
});

app.put('/api/products/:id', upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const { name, category, price, existing_image_url } = req.body;

  try {
    let image_url = existing_image_url || '';

    if (req.file) {
      image_url = await uploadToSupabase(req.file);
    }

    const result = await pool.query(
      'UPDATE products SET name = $1, category = $2, price = $3, image_url = $4 WHERE id = $5 RETURNING *',
      [name, category, price, image_url, id]
    );

    res.json({ message: 'Product updated successfully', product: result.rows[0] });
  } catch (err) {
    console.error('PUT Error:', err);
    res.status(500).json({ error: 'Database update failed' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('DELETE Error:', err);
    res.status(500).json({ error: 'Database delete failed' });
  }
});

// 3. Render Dynamic Port Handling
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
