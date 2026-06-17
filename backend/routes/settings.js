// ============================================================
// 【檔案說明】routes/settings.js — 網站設定 API
//
// 端點：
//   GET /api/settings          → 取得所有設定（公開）
//   PUT /api/settings/:key     → 更新單一設定（需登入）
// ============================================================

const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const auth = require('../middleware/auth');

// 取得所有設定，前端依 key 取值（例如 announcement、seo_keywords）
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT key, value FROM settings');
    // 把陣列轉成 { key: value } 物件，方便前端直接取用
    const settings = Object.fromEntries(rows.map(r => [r.key, r.value]));
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// 更新單一設定，key 由 URL 參數指定
router.put('/:key', auth, async (req, res) => {
  try {
    const { value } = req.body;
    if (value === undefined) return res.status(400).json({ message: '請提供設定值' });

    await pool.query(
      'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
      [req.params.key, value]
    );
    res.json({ message: '更新成功' });
  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

module.exports = router;
