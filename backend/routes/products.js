// ============================================================
// 【檔案說明】routes/products.js — 商品管理 API
//
// 端點：
//   GET    /api/products      → 前台：取得上架商品（公開）
//   GET    /api/products/all  → 後台：取得所有商品（需登入）
//   GET    /api/products/:id  → 前台：取得單筆商品（公開）
//   POST   /api/products      → 後台：新增商品（需登入）
//   PUT    /api/products/:id  → 後台：修改商品（需登入）
//   DELETE /api/products/:id  → 後台：刪除商品（需登入）
// ============================================================

const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const auth = require('../middleware/auth');

// ── 前台：取得上架商品 ─────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM products WHERE active = 1 ORDER BY sort_order ASC, created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// ── 後台：取得所有商品（含下架）──────────────────────────
// 注意：'/all' 要放在 '/:id' 前面，否則 Express 會把 'all' 當成 id
router.get('/all', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM products ORDER BY sort_order ASC, created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// ── 前台：取得單筆商品 ─────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: '商品不存在' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// ── 後台：新增商品 ─────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, price, image_url, active, sort_order } = req.body;

    if (!name) return res.status(400).json({ message: '商品名稱為必填' });
    if (price === undefined || price < 0) return res.status(400).json({ message: '請填入有效的價格' });

    const { rows } = await pool.query(
      `INSERT INTO products (name, description, price, image_url, active, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [name, description || '', price, image_url || '', active ?? 1, sort_order ?? 0]
    );

    res.status(201).json({ id: rows[0].id, message: '新增成功' });
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// ── 後台：修改商品 ─────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, price, image_url, active, sort_order } = req.body;

    if (!name) return res.status(400).json({ message: '商品名稱為必填' });

    await pool.query(
      `UPDATE products
       SET name=$1, description=$2, price=$3, image_url=$4, active=$5, sort_order=$6, updated_at=NOW()
       WHERE id=$7`,
      [name, description, price, image_url, active ? 1 : 0, sort_order, req.params.id]
    );

    res.json({ message: '更新成功' });
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// ── 後台：刪除商品 ─────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    res.json({ message: '刪除成功' });
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

module.exports = router;
