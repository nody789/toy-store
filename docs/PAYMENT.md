# PAYMENT.md

## 使用金流

綠界科技 ECPay

> 帳號需由**客戶以公司名義申請**，不使用開發者個人帳號。
> 申請連結：https://www.ecpay.com.tw/

---

## 環境說明

| 環境 | Merchant ID | 說明 |
|------|-------------|------|
| 測試 | 2000132 | 綠界提供的共用測試帳號，不會真實扣款 |
| 正式 | （客戶申請後填入） | 上線前由客戶提供 |

測試環境 API：`https://payment-stage.ecpay.com.tw`
正式環境 API：`https://payment.ecpay.com.tw`

> 切換環境只需要換 `.env` 的設定值，程式碼不需要改動。

---

## 環境變數

在 `.env.example` 補上以下欄位：

```env
# =====================
# 綠界金流
# =====================
ECPAY_MERCHANT_ID=
ECPAY_HASH_KEY=
ECPAY_HASH_IV=
ECPAY_API_URL=https://payment-stage.ecpay.com.tw/Purchasing/aio/Cashier/AioCheckOut/V5
ECPAY_RETURN_URL=https://（填入後端網域）/api/v1/payment/webhook
ECPAY_ORDER_RESULT_URL=https://（填入前端網域）/payment/result
```

---

## 支援的付款方式

| 方式 | ChoosePayment 值 | 說明 |
|------|-----------------|------|
| 信用卡 | `Credit` | 一次付清或分期 |
| ATM 轉帳 | `ATM` | 給付款代碼，3 天內轉帳 |
| 超商代碼 | `CVS` | 7-11、全家、萊爾富、OK |
| 超商條碼 | `BARCODE` | 列印條碼至超商繳費 |
| 全部顯示 | `ALL` | 讓使用者自選方式 |

---

## 資料表設計

### orders（訂單）

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | INT PK | 主鍵 |
| user_id | INT FK | 所屬使用者 |
| merchant_trade_no | VARCHAR(20) | 自訂訂單編號，送給綠界用（唯一） |
| total_amount | INT | 金額（單位：元，不含小數） |
| status | ENUM | `pending` / `paid` / `failed` / `expired` |
| created_at | TIMESTAMP | 建立時間 |
| updated_at | TIMESTAMP | 更新時間 |

### transactions（金流紀錄）

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | INT PK | 主鍵 |
| order_id | INT FK | 對應訂單 |
| trade_no | VARCHAR | 綠界回傳的交易編號 |
| payment_type | VARCHAR | 付款方式（Credit / ATM / CVS 等） |
| amount | INT | 實際付款金額 |
| rtn_code | VARCHAR | 綠界回傳代碼（`1` 代表成功） |
| rtn_msg | VARCHAR | 綠界回傳訊息 |
| raw_data | TEXT | 綠界原始回傳內容（完整保存供查帳） |
| created_at | TIMESTAMP | 建立時間 |

> `orders` 記錄業務層的訂單狀態，`transactions` 記錄每一次與綠界的金流互動。
> 一筆訂單可能有多筆 transaction（例如付款失敗後重試）。

---

## 付款流程

```
使用者點「結帳」
     │
     ▼
POST /api/v1/payment/create
  後端建立 order（status: pending）
  產生 merchant_trade_no（格式：專案前綴 + 時間戳，例如 SHOP20240617001）
  組出綠界需要的參數 + CheckMacValue
     │
     ▼
回傳表單參數給前端
     │
     ▼
前端自動 submit 表單 → 導向綠界付款頁面
     │
     ▼
使用者完成付款
     │
     ├──► 綠界 POST 到 ECPAY_RETURN_URL（Webhook）
     │        後端驗證 CheckMacValue
     │        更新 order status
     │        寫入 transactions 紀錄
     │        回傳字串 "1|OK"（綠界要求）
     │
     └──► 綠界將使用者 redirect 到 ECPAY_ORDER_RESULT_URL
              前端顯示付款結果頁
              （不可在此更新訂單狀態，只做 UI 呈現）
```

---

## API 端點

在 `docs/API.md` 補上以下端點：

| Method | 路徑 | 說明 | 權限 |
|--------|------|------|------|
| POST | /payment/create | 建立訂單，取得送往綠界的表單參數 | 登入 |
| POST | /payment/webhook | 接收綠界付款結果通知（Webhook） | 公開（綠界呼叫） |
| GET | /payment/orders | 查詢使用者的訂單列表 | 登入 |
| GET | /payment/orders/:id | 查詢單筆訂單詳情 | 登入 |

---

## Webhook 安全驗證

綠界每次通知都會附上 `CheckMacValue`，**後端必須驗證**，否則任何人偽造請求就能讓訂單狀態變成已付款。

驗證邏輯：

```ts
// 1. 從 Webhook 收到的參數中，移除 CheckMacValue
// 2. 將其餘參數按照「參數名稱 A-Z 排序」
// 3. 組成字串：HashKey=值&參數1=值1&參數2=值2...&HashIV=值
// 4. URL encode 後轉小寫
// 5. SHA256 雜湊後轉大寫
// 6. 比對與收到的 CheckMacValue 是否相同
```

驗證失敗時：
- 不更新訂單狀態
- 回傳 `0|Error`（綠界規定的格式）
- 記錄 log 供事後查帳

---

## 安全注意事項

* `ECPAY_HASH_KEY` 和 `ECPAY_HASH_IV` 一律存環境變數，禁止寫在程式碼裡
* **訂單狀態只能由 Webhook 更新**，前端 redirect 回來的參數不可信任
* `merchant_trade_no` 收到 Webhook 時需確認訂單存在且狀態為 `pending`，避免重複處理
* Webhook 端點不需要 JWT 驗證（綠界無法帶 token），但必須驗證 `CheckMacValue`
* `raw_data` 欄位儲存完整的綠界回傳內容，發生爭議時作為查帳依據

---

## 測試用信用卡號

| 卡號 | 有效月年 | CVV | 說明 |
|------|---------|-----|------|
| 4311-9522-2222-2222 | 任意未來日期 | 222 | 一次付清成功 |
| 4311-9500-0000-0008 | 任意未來日期 | 222 | 模擬付款失敗 |

> 以上僅在測試環境有效，正式環境無法使用。

---

## 備註

> 其他金流相關說明，例如：退款流程、分期設定、發票串接等
