// ============================================================
// 【檔案說明】server.js — Express 後端應用程式入口點
//
// 流程：
//   1. 載入環境變數
//   2. 驗證必要環境變數
//   3. 設定 middleware（CORS、JSON 解析、Rate Limiting）
//   4. 掛載各功能路由
//   5. 正式環境同時服務前端靜態檔案
//   6. 初始化資料庫後啟動伺服器
// ============================================================

require('dotenv').config();

// 啟動時驗證必要環境變數，缺少就直接結束程序
['JWT_SECRET', 'DATABASE_URL'].forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ 缺少必要環境變數：${key}`);
    process.exit(1);
  }
});

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const { initDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

// ── CORS 設定 ──────────────────────────────────────────────
const corsOrigin = process.env.NODE_ENV === 'production'
  ? (process.env.CORS_ORIGIN || false)
  : 'http://localhost:5173';

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

// ── Rate Limiting ──────────────────────────────────────────
// 登入端點：15 分鐘最多 10 次，防暴力破解
app.use('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: '嘗試次數過多，請 15 分鐘後再試' },
}));

// 上傳端點：每小時最多 30 次，防止耗盡 Cloudinary 配額
app.use('/api/upload', rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: '上傳次數超過限制，請稍後再試' },
}));

// ── 掛載路由 ───────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/carousel', require('./routes/carousel'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/orders', require('./routes/orders'));

// ── 正式環境：服務前端靜態檔案 ────────────────────────────
const frontendDist = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// ── 啟動伺服器 ─────────────────────────────────────────────
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 後端伺服器啟動於 http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ 資料庫初始化失敗：', err.message);
    process.exit(1);
  });
