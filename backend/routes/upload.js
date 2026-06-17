// ============================================================
// 【檔案說明】routes/upload.js — 圖片上傳至 Cloudinary
//
// 端點：
//   POST /api/upload → 後台：上傳圖片，回傳 Cloudinary URL（需登入）
//
// 流程：
//   1. multer 接收圖片，暫存在記憶體（不寫磁碟）
//   2. 驗證 Magic Bytes，確認是真正的圖片格式
//   3. 串流上傳到 Cloudinary
//   4. 回傳公開 URL
// ============================================================

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const auth = require('../middleware/auth');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

// 用 Magic Bytes（檔案二進位開頭）驗證真實格式，防止偽裝攻擊
function detectMimeFromBuffer(buffer) {
  if (!buffer || buffer.length < 12) return null;
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return 'image/jpeg';
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return 'image/png';
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) return 'image/gif';
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) return 'image/webp';
  return null;
}

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (IMAGE_EXTS.includes(ext)) cb(null, true);
  else cb(new Error('只接受圖片格式（JPG/PNG/GIF/WebP）'));
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 商品圖片限制 10MB
});

router.post('/', auth, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: '請選擇要上傳的圖片' });

  const realMime = detectMimeFromBuffer(req.file.buffer);
  if (!realMime || !ALLOWED_MIMES.includes(realMime)) {
    return res.status(400).json({ message: '檔案格式驗證失敗，僅接受圖片格式' });
  }

  try {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'toy-store' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    res.json({ url: result.secure_url, filename: result.public_id });
  } catch (err) {
    res.status(500).json({ message: '上傳失敗：' + err.message });
  }
});

router.use((err, req, res, next) => {
  res.status(400).json({ message: err.message });
});

module.exports = router;
