// ============================================================
// 【檔案說明】routes/carousel.js — 輪播圖管理 API
//
// 端點：
//   GET    /api/carousel      → 前台：取得啟用中輪播圖（公開）
//   GET    /api/carousel/all  → 後台：取得所有輪播圖（需登入）
//   POST   /api/carousel      → 後台：新增輪播圖（需登入）
//   PUT    /api/carousel/:id  → 後台：修改輪播圖（需登入）
//   DELETE /api/carousel/:id  → 後台：刪除輪播圖（需登入）
// ============================================================

const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const auth = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM carousel WHERE active = 1 ORDER BY sort_order ASC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

router.get('/all', auth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM carousel ORDER BY sort_order ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, description, image_url, sort_order } = req.body;
    if (!image_url) return res.status(400).json({ message: '請提供圖片網址' });

    const { rows } = await pool.query(
      'INSERT INTO carousel (title, description, image_url, sort_order) VALUES ($1, $2, $3, $4) RETURNING id',
      [title || '', description || '', image_url, sort_order || 0]
    );
    res.status(201).json({ id: rows[0].id, message: '新增成功' });
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, image_url, sort_order, active } = req.body;
    await pool.query(
      'UPDATE carousel SET title=$1, description=$2, image_url=$3, sort_order=$4, active=$5 WHERE id=$6',
      [title, description, image_url, sort_order, active ? 1 : 0, req.params.id]
    );
    res.json({ message: '更新成功' });
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM carousel WHERE id = $1', [req.params.id]);
    res.json({ message: '刪除成功' });
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

module.exports = router;
