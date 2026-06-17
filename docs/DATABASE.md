# DATABASE.md

## 資料庫類型

SQLite（開發環境） / PostgreSQL（正式環境）

## 命名規則

| 項目 | 規則 | 範例 |
|------|------|------|
| 資料表名稱 | 小寫 snake_case、複數 | `products`、`carousel` |
| 欄位名稱 | 小寫 snake_case | `created_at`、`image_url` |
| 主鍵 | `id` | INTEGER PRIMARY KEY |
| 時間欄位 | `created_at`、`updated_at` | 統一命名 |

## 連線設定

```env
DATABASE_URL=（SQLite 填本機路徑，PostgreSQL 填連線字串）
```

## 資料表說明

### admins（後台帳號）

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | INTEGER PK | 主鍵 |
| username | TEXT | 帳號（唯一） |
| created_at | DATETIME | 建立時間 |

> password 欄位存在但禁止出現在 API 回應中（bcrypt 雜湊值）

### products（商品）

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | INTEGER PK | 主鍵 |
| name | TEXT | 商品名稱（必填） |
| description | TEXT | 商品描述 |
| price | INTEGER | 售價（單位：元） |
| image_url | TEXT | Cloudinary 圖片網址 |
| active | INTEGER | 1=上架、0=下架（預設 1） |
| sort_order | INTEGER | 排序（數字越小越前面，預設 0） |
| created_at | DATETIME | 建立時間 |
| updated_at | DATETIME | 更新時間 |

### carousel（輪播圖）

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | INTEGER PK | 主鍵 |
| title | TEXT | 標題（可空） |
| description | TEXT | 說明文字（可空） |
| image_url | TEXT | Cloudinary 圖片網址（必填） |
| sort_order | INTEGER | 排序（預設 0） |
| active | INTEGER | 1=啟用、0=停用（預設 1） |
| created_at | DATETIME | 建立時間 |

### settings（網站設定）

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | INTEGER PK | 主鍵 |
| key | TEXT | 設定鍵值（唯一），例如 `announcement`、`seo_keywords` |
| value | TEXT | 設定內容 |
| updated_at | DATETIME | 更新時間 |

> 公告和 SEO 關鍵字統一存在 settings 表，用 key 區分。

### orders（訂單主表）

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | SERIAL PK | 主鍵 |
| order_number | TEXT UNIQUE | 訂單編號，格式：TS + YYYYMMDD + 4碼序號 |
| customer_name | TEXT | 顧客姓名（必填） |
| customer_email | TEXT | 顧客 Email（必填） |
| customer_phone | TEXT | 顧客電話（可空） |
| total_amount | INTEGER | 訂單總金額（元） |
| status | TEXT | pending/paid/cancelled/refunded，預設 pending |
| payment_method | TEXT | ECPay 付款方式（Credit/ATM/CVS） |
| ecpay_trade_no | TEXT | 綠界交易編號 |
| notes | TEXT | 管理員備註 |
| created_at | TIMESTAMP | 建立時間 |
| updated_at | TIMESTAMP | 更新時間 |

### order_items（訂單商品明細）

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | SERIAL PK | 主鍵 |
| order_id | INTEGER FK | 關聯 orders.id |
| product_id | INTEGER | 商品 ID（可空，商品刪除後 FK 斷掉） |
| product_name | TEXT | 商品名稱快照（下單時存入） |
| product_image | TEXT | 商品圖片快照 |
| price | INTEGER | 單價快照（下單時售價） |
| quantity | INTEGER | 購買數量 |
| subtotal | INTEGER | 小計（price × quantity） |

> product_name、price 使用快照設計，避免商品修改或刪除後訂單資料遺失。

### transactions（金流交易記錄）

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | SERIAL PK | 主鍵 |
| order_id | INTEGER FK | 關聯 orders.id |
| ecpay_trade_no | TEXT | 綠界交易編號 |
| payment_type | TEXT | 付款方式 |
| amount | INTEGER | 交易金額 |
| rtn_code | TEXT | 1=成功，其他=失敗 |
| rtn_msg | TEXT | 交易訊息 |
| raw_data | TEXT | ECPay Webhook 完整原始資料（JSON 字串） |
| created_at | TIMESTAMP | 建立時間 |

> 每次 ECPay Webhook 回呼都新增一筆，不修改舊記錄，保留完整金流歷史。

## 資料表關聯

```
admins 無外鍵關聯
products 獨立
carousel 獨立
settings 獨立
orders ← order_items（一對多）
orders ← transactions（一對多）
```

## 索引說明

| 資料表 | 欄位 | 原因 |
|--------|------|------|
| products | active | 前台查詢只取上架商品，頻繁使用 |
| carousel | active | 同上 |
| settings | key | 用 key 查詢設定值，需要唯一索引 |

## 敏感欄位說明

以下欄位禁止出現在 API 回應中：

| 欄位 | 說明 |
|------|------|
| password | admins 表的密碼雜湊值 |

## 軟刪除策略

本專案**不使用**軟刪除，商品刪除為實際刪除。
若未來需要保留刪除紀錄，再加入 `deleted_at` 欄位。

## Migration 策略

使用手動 SQL 管理資料庫初始化（參考 temple-website 的 db.js 模式）。

```js
// db.js 初始化時建立所有資料表（CREATE TABLE IF NOT EXISTS）
// 新增欄位用 ALTER TABLE（需確認 SQLite 語法限制）
```

注意事項：
- 有破壞性異動需提前通知協作者
- 正式環境部署前必須先備份資料庫

## 備註

> 其他資料庫相關說明
