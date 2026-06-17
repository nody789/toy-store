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

## 資料表關聯

```
admins 無外鍵關聯
products 獨立
carousel 獨立
settings 獨立
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
