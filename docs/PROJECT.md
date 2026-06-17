# PROJECT.md

## 專案名稱

玩具店

## 專案描述

玩具店官網，提供商品展示與後台管理功能。

## 專案目標

讓店家透過後台自行管理商品（新增、修改、刪除），商品資訊包含名稱、描述、價格、圖片。前台展示商品供顧客瀏覽。

## 技術棧

| 層級 | 技術 |
|------|------|
| 前端 | React + Tailwind CSS |
| 後端 | Node.js + Express |
| 資料庫 | PostgreSQL（Neon，與 temple-website 獨立） |
| 圖片儲存 | Cloudinary（資料夾：toy-store/） |
| 部署 | Render（後端 Web Service + 前端 Static Site） |

## 目錄結構

```
toy-store/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── admin/
│   │   ├── pages/
│   │   │   └── admin/
│   │   ├── api/
│   │   ├── context/
│   │   └── hooks/
│   └── ...
├── backend/
│   ├── routes/
│   ├── middleware/
│   ├── db.js
│   └── server.js
└── docs/
```

## 後台功能

| 功能 | 說明 |
|------|------|
| 商品管理 | 新增、修改、刪除商品 |
| 商品圖片 | 上傳商品圖片至 Cloudinary |
| 輪播圖管理 | 首頁輪播圖新增、修改、排序 |
| 公告管理 | 修改網站公告內容 |
| 關鍵字管理 | 管理 SEO 關鍵字 |

## 開發環境設置

```bash
# 安裝前端依賴
cd frontend && npm install

# 安裝後端依賴
cd backend && npm install

# 啟動後端（port 3001）
cd backend && npm run dev

# 啟動前端（port 5173）
cd frontend && npm run dev
```

## 環境變數

`.env.example` 需 commit 進 git（內容只列欄位名稱，不填入實際值），作為協作者的設定參考。
`.env` 禁止 commit，已加入 `.gitignore`。

```env
# 範例，實際值請查看 backend/.env.example
JWT_SECRET=
DATABASE_URL=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

新成員設置步驟：
1. 複製 `backend/.env.example` 為 `backend/.env`
2. 填入實際環境變數值
3. 執行 `npm install` 後即可啟動

## CORS 政策

> 詳細規則請見 `docs/API.md`

| 環境 | 允許 Origin |
|------|------|
| 開發 | http://localhost:5173 |
| 正式 | https://（前端 Static Site 網址，deploy 後填入） |

## 注意事項

- 商品圖片透過 Cloudinary 儲存，不存在本機或資料庫
- 後台路由統一以 `/admin` 為前綴，需登入才能存取
