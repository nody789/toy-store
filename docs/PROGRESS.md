# PROGRESS.md — 玩具店專案進度

> 每次開新對話請先閱讀此文件，確認目前狀態後再繼續開發。
> 最後更新：2026-06-17

---

## 專案基本資訊

| 項目 | 值 |
|------|-----|
| GitHub | https://github.com/nody789/toy-store |
| 後端 URL（Render） | https://toy-store-xb0m.onrender.com |
| 前端 URL（Render） | （Static Site deploy 後填入） |
| 資料庫 | Neon PostgreSQL（與 temple-website 分開，獨立專案） |
| 圖片儲存 | Cloudinary，資料夾：`toy-store/` |
| 後台登入 | 帳號：admin　密碼：admin123（上線前需修改） |

---

## 技術棧（實際使用）

| 層級 | 技術 |
|------|------|
| 前端 | React 18 + Vite 6 + Tailwind CSS 3（純 JS，不用 TypeScript） |
| 後端 | Node.js + Express |
| 資料庫 | PostgreSQL（pg 套件，Pool 模式），hosted on Neon |
| 圖片 | Cloudinary（multer memoryStorage + Magic Bytes 驗證） |
| 認證 | JWT（jsonwebtoken + bcryptjs） |
| 部署 | Render（後端 Web Service + 前端 Static Site） |

---

## 已完成項目

### 後端 ✅

- [x] Express 伺服器（CORS、JSON、Rate Limiting）
- [x] PostgreSQL 連線（Neon），`db.js` 初始化所有資料表
- [x] JWT 登入認證（`routes/auth.js`、`middleware/auth.js`）
- [x] 商品 CRUD API（`routes/products.js`）
- [x] 輪播圖 CRUD API（`routes/carousel.js`）
- [x] 網站設定 API（`routes/settings.js`）— announcement、seo_keywords、seo_description
- [x] Cloudinary 圖片上傳（`routes/upload.js`）— Magic Bytes 驗證、10MB 限制
- [x] 訂單 API（`routes/orders.js`）— 列表、詳情、建立、更新狀態
- [x] 資料庫：orders、order_items、transactions 三張表
- [x] 部署至 Render Web Service

### 前端後台 ✅

- [x] 登入頁（`pages/admin/Login.jsx`）
- [x] 後台 Layout + 側邊欄導航（`AdminLayout.jsx`）
- [x] ProtectedRoute（未登入自動導向 login）
- [x] 總覽頁（`Dashboard.jsx`）
- [x] 商品管理（`ProductsManager.jsx`）— 新增、編輯、刪除、圖片上傳
- [x] 輪播圖管理（`CarouselManager.jsx`）
- [x] 網站設定（`SiteSettings.jsx`）— 公告、SEO 關鍵字、SEO 描述
- [x] 訂單管理（`OrdersManager.jsx`）— 列表、Tab 篩選、詳情 Modal、手動更新狀態
- [x] Render Static Site SPA refresh 修正（`public/_redirects`）
- [x] 部署至 Render Static Site

---

## 待完成項目

### 優先：前台（等設計師確認版面後開始）

> 目前尚未與設計師、客戶討論前台版面，確認後再開始。

- [ ] 首頁（輪播圖、公告、商品列表）
- [ ] 商品詳情頁
- [ ] 購物車（React Context + localStorage）
- [ ] 結帳頁（填寫顧客資料：姓名、Email、電話）
- [ ] 付款完成頁（成功 / 失敗）

### 優先：ECPay 金流串接（前台購物車完成後接）

> 詳細規格請見 `docs/PAYMENT.md`

- [ ] 後端：產生 ECPay 付款表單（`routes/payment.js`）
  - CheckMacValue 計算
  - 組 FormData 送至 ECPay
- [ ] 後端：接收 ECPay Webhook 回呼（更新訂單狀態、寫入 transactions）
- [ ] 後端：`.env` 補上 ECPay 環境變數（需客戶提供帳號）
- [ ] Render 後端環境變數補上 ECPay 值
- [ ] 測試用信用卡：4311-9522-2222-2222（到期任意，CVV 任意）

### 其他待辦

- [ ] 確認並更新前端 Static Site 網址 → 填入 `docs/PROJECT.md`、`docs/API.md`
- [ ] 更新後端 `CORS_ORIGIN` 為實際前端網址（目前正式環境為 `*`）
- [ ] 更改後台預設密碼 admin/admin123 → 上線前務必修改
- [ ] Figma MCP 設定（`TODO.md` 有記錄，等設計師出稿時設置）

---

## 目錄結構（目前實際狀態）

```
toy-store/
├── backend/
│   ├── middleware/
│   │   └── auth.js           JWT 驗證 middleware
│   ├── routes/
│   │   ├── auth.js           登入、登出
│   │   ├── products.js       商品 CRUD
│   │   ├── carousel.js       輪播圖 CRUD
│   │   ├── settings.js       網站設定
│   │   ├── upload.js         Cloudinary 圖片上傳
│   │   └── orders.js         訂單管理（新）
│   ├── db.js                 PostgreSQL 連線 + 初始化
│   ├── server.js             Express 入口
│   ├── .env                  實際環境變數（不 commit）
│   └── .env.example          環境變數範本
├── frontend/
│   ├── public/
│   │   └── _redirects        SPA routing 修正（Render 用）
│   └── src/
│       ├── api/
│       │   └── index.js      Axios 設定（自動帶 Token、401 登出）
│       ├── components/admin/
│       │   ├── AdminLayout.jsx
│       │   ├── AdminToast.jsx
│       │   └── ProtectedRoute.jsx
│       ├── context/
│       │   └── AuthContext.jsx
│       └── pages/admin/
│           ├── Login.jsx
│           ├── Dashboard.jsx
│           ├── ProductsManager.jsx
│           ├── CarouselManager.jsx
│           ├── SiteSettings.jsx
│           └── OrdersManager.jsx（新）
└── docs/
    ├── PROGRESS.md           本文件（進度追蹤）
    ├── PROJECT.md            專案目標與技術棧
    ├── API.md                API 端點規格
    ├── DATABASE.md           資料庫設計
    ├── UI_RULES.md           UI 設計規範（等設計師確認後補充）
    ├── PAYMENT.md            ECPay 金流串接規範
    └── CHANGELOG.md          版本變更記錄
```

---

## API 端點總覽（目前已實作）

| Method | 路徑 | 說明 | 權限 |
|--------|------|------|------|
| POST | /api/auth/login | 後台登入 | 公開 |
| POST | /api/auth/logout | 登出 | 登入 |
| GET | /api/products | 前台商品列表（上架） | 公開 |
| GET | /api/products/all | 後台商品列表（含下架） | 登入 |
| GET | /api/products/:id | 單筆商品 | 公開 |
| POST | /api/products | 新增商品 | 登入 |
| PUT | /api/products/:id | 修改商品 | 登入 |
| DELETE | /api/products/:id | 刪除商品 | 登入 |
| GET | /api/carousel | 前台輪播圖（啟用） | 公開 |
| GET | /api/carousel/all | 後台輪播圖（全部） | 登入 |
| POST | /api/carousel | 新增輪播圖 | 登入 |
| PUT | /api/carousel/:id | 修改輪播圖 | 登入 |
| DELETE | /api/carousel/:id | 刪除輪播圖 | 登入 |
| GET | /api/settings | 所有設定 | 公開 |
| PUT | /api/settings/:key | 修改設定 | 登入 |
| POST | /api/upload | 上傳圖片至 Cloudinary | 登入 |
| GET | /api/orders | 訂單列表（?status= 篩選） | 登入 |
| GET | /api/orders/:id | 訂單詳情（含明細、金流記錄） | 登入 |
| PUT | /api/orders/:id | 更新訂單狀態/備註 | 登入 |
| POST | /api/orders | 前台建立訂單 | 公開 |

---

## 資料庫資料表（目前已建立）

admins、products、carousel、settings、orders、order_items、transactions

詳細欄位定義請見 `docs/DATABASE.md`。

---

## 注意事項

- 前端 `api/index.js` 的 `baseURL` 在 Render 讀 `VITE_API_BASE_URL` 環境變數，本地開發走 Vite proxy（`/api` → `localhost:3001`）
- `backend/.env` 不 commit，Render 環境變數需手動設定
- 本專案資料庫（Neon）與 temple-website **完全獨立**，不共用
- Cloudinary 與 temple-website 共用帳號，但圖片分資料夾（`toy-store/`）
- 訂單編號格式：`TS` + 日期（YYYYMMDD） + 4 碼流水號，例如 `TS202606170001`
