// ============================================================
// 【檔案說明】middleware/auth.js — JWT 身份驗證 Middleware
//
// 流程：
//   1. 從 Authorization Header 取出 Bearer Token
//   2. 用 JWT_SECRET 驗證 Token 合法性
//   3. 合法 → 將使用者資訊存入 req.user，放行請求
//   4. 不合法 → 回傳 401，拒絕請求
// ============================================================

const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: '未授權，請先登入' });
  }

  const token = authHeader.split(' ')[1];

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Token 無效或已過期，請重新登入' });
  }
};
