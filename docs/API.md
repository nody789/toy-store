# API.md

## Base URL

```
開發環境：http://localhost:3001/api
正式環境：https://toy-store-xb0m.onrender.com/api
```

> API 版本：目前為 v1，路徑統一加上 `/v1/`（例如 `/api/v1/products`）
> 若未來有破壞性變更，升版為 `/v2/` 而不修改舊路徑。

## CORS 政策

```
開發環境：允許 http://localhost:5173
正式環境：僅允許 https://（填入正式前端網域）
```

禁止設定 `Access-Control-Allow-Origin: *`。

## 認證方式

> 使用 JWT Bearer Token

```
Authorization: Bearer <token>
```

Token 過期處理：
1. Access Token 有效期：（填入，例如 7 天）
2. Token 過期需重新登入

## Rate Limiting

| 端點 | 限制 | 說明 |
|------|------|------|
| POST /auth/login | 每 IP 每 15 分鐘 10 次 | 防暴力破解 |
| POST /upload | 每 IP 每小時 30 次 | 防止耗盡 Cloudinary 配額 |
| 其他端點 | 每 IP 每分鐘 100 次 | 一般限制 |

## 統一回應格式

成功（單筆）：

```json
{
  "success": true,
  "data": {}
}
```

成功（列表）：

```json
{
  "success": true,
  "data": {
    "items": [],
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

失敗（一般錯誤）：

```json
{
  "success": false,
  "message": "錯誤描述"
}
```

失敗（422 驗證錯誤）：

```json
{
  "success": false,
  "message": "驗證失敗",
  "errors": {
    "name": "商品名稱為必填",
    "price": "價格必須大於 0"
  }
}
```

## API 端點列表

權限標示：`公開` 不需 token、`登入` 需要 JWT

### 認證

| Method | 路徑 | 說明 | 權限 |
|--------|------|------|------|
| POST | /auth/login | 後台登入 | 公開 |
| POST | /auth/logout | 登出 | 登入 |

### 商品

| Method | 路徑 | 說明 | 權限 |
|--------|------|------|------|
| GET | /products | 前台：取得上架商品列表 | 公開 |
| GET | /products/:id | 前台：取得單筆商品詳情 | 公開 |
| GET | /products/all | 後台：取得所有商品（含下架） | 登入 |
| POST | /products | 後台：新增商品 | 登入 |
| PUT | /products/:id | 後台：修改商品 | 登入 |
| DELETE | /products/:id | 後台：刪除商品 | 登入 |

### 輪播圖

| Method | 路徑 | 說明 | 權限 |
|--------|------|------|------|
| GET | /carousel | 前台：取得啟用中的輪播圖 | 公開 |
| GET | /carousel/all | 後台：取得所有輪播圖 | 登入 |
| POST | /carousel | 後台：新增輪播圖 | 登入 |
| PUT | /carousel/:id | 後台：修改輪播圖 | 登入 |
| DELETE | /carousel/:id | 後台：刪除輪播圖 | 登入 |

### 公告

| Method | 路徑 | 說明 | 權限 |
|--------|------|------|------|
| GET | /settings/announcement | 前台：取得公告內容 | 公開 |
| PUT | /settings/announcement | 後台：修改公告內容 | 登入 |

### SEO 關鍵字

| Method | 路徑 | 說明 | 權限 |
|--------|------|------|------|
| GET | /settings/seo | 取得 SEO 設定 | 公開 |
| PUT | /settings/seo | 後台：修改 SEO 關鍵字 | 登入 |

### 圖片上傳

| Method | 路徑 | 說明 | 權限 |
|--------|------|------|------|
| POST | /upload | 上傳圖片至 Cloudinary，回傳圖片 URL | 登入 |

### 訂單

| Method | 路徑 | 說明 | 權限 |
|--------|------|------|------|
| GET | /orders | 後台：取得訂單列表（?status= 篩選） | 登入 |
| GET | /orders/:id | 後台：取得訂單詳情（含商品明細、金流記錄） | 登入 |
| PUT | /orders/:id | 後台：更新訂單狀態或備註 | 登入 |
| POST | /orders | 前台：建立訂單（購物車結帳） | 公開 |

訂單狀態值：`pending`（待付款）、`paid`（已付款）、`cancelled`（已取消）、`refunded`（已退款）

## 回應狀態碼

### 成功

| Code | 說明 | 使用情境 |
|------|------|------|
| 200 | 成功 | 一般 GET、PUT |
| 201 | 建立成功 | POST 新增資源 |
| 204 | 無內容 | DELETE 成功 |

### 錯誤

| Code | 說明 | 使用情境 |
|------|------|------|
| 400 | 請求格式錯誤 | 缺少必要欄位 |
| 401 | 未認證 | 未提供 token 或 token 已過期 |
| 403 | 無權限 | 已登入但無此操作的權限 |
| 404 | 資源不存在 | 找不到指定商品 |
| 422 | 驗證失敗 | 欄位格式不合法 |
| 429 | 請求過於頻繁 | 超過 Rate Limit |
| 500 | 伺服器錯誤 | 非預期的伺服器端錯誤 |

## 備註

> 其他需要說明的 API 規則或慣例
