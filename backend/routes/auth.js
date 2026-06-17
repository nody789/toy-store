// ============================================================
// 【檔案說明】routes/auth.js — 後台身份驗證
//
// 端點：
//   POST /api/auth/login           → 登入，回傳 JWT Token
//   POST /api/auth/change-password → 修改密碼（需登入）
// ============================================================

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const authMiddleware = require('../middleware/auth');

// ── 登入 ───────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: '請輸入帳號和密碼' });
    }

    const { rows } = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);
    const user = rows[0];

    // 帳號不存在或密碼錯誤回傳同一訊息，避免攻擊者判斷帳號是否存在
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: '帳號或密碼錯誤' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, username: user.username });

  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// ── 修改密碼 ───────────────────────────────────────────────
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: '新密碼至少需要 6 個字元' });
    }

    const { rows } = await pool.query('SELECT * FROM admins WHERE id = $1', [req.user.id]);
    const user = rows[0];

    if (!bcrypt.compareSync(oldPassword, user.password)) {
      return res.status(400).json({ message: '舊密碼錯誤' });
    }

    const hashed = bcrypt.hashSync(newPassword, 10);
    await pool.query('UPDATE admins SET password = $1 WHERE id = $2', [hashed, req.user.id]);

    res.json({ message: '密碼更新成功' });

  } catch (err) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

module.exports = router;
