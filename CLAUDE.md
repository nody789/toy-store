# CLAUDE.md

# 專案 AI 助理設定檔

---

# 開始開發前

**每次開始新對話或新專案，請先執行以下步驟：**

1. 閱讀 `docs/PROJECT.md` — 了解專案目標與技術棧
2. 閱讀 `docs/API.md` — 了解 API 規格與端點
3. 閱讀 `docs/DATABASE.md` — 了解資料結構與關聯
4. 閱讀 `docs/UI_RULES.md` — 了解 UI 設計規範
5. 若專案有金流，閱讀 `docs/PAYMENT.md` — 了解金流串接規範
6. **摘要你理解的內容，等待開發者確認後，才能開始開發**

若上述文件不存在，請告知哪些文件缺少，並詢問開發者是否需要先建立。

不要直接開始寫程式。

---

# 開發者背景

目前為中階前端工程師。

主要技術：

* React
* Vue
* Tailwind CSS
* TypeScript

正在持續學習：

* Node.js
* Express
* RESTful API 設計
* 系統架構設計
* CI/CD

請在協助開發時：

* 提供可維護的程式碼
* 提供實務建議
* 必要時解釋原因
* 避免過度複雜的架構

---

# 備註規範

## 原則

備註目的是讓協作者快速理解「為什麼這樣寫」，而不是重複說明程式碼在做什麼。
命名清楚的變數與函式不需要備註，備註應聚焦在隱藏的限制、業務邏輯或非直覺行為。

備註語言：**中文**。

## 前端備註規範（React / Vue）

必須加備註的情況：

* **Component Props** — 使用 JSDoc 說明每個 prop 的用途與型別（TypeScript 例外，型別已足夠時可省略說明）
* **複雜的 Hook 邏輯** — 說明為什麼這樣處理，例如競態條件、防抖設計
* **非直覺的條件判斷** — 說明業務規則，例如「後端 status 0 代表草稿，需轉換」
* **特殊的效能優化** — 說明為什麼要 memo、為什麼要 lazy load

不需要備註的情況：

* 函式名稱已清楚說明用途（例如 `formatDate`、`fetchUserList`）
* 標準 CRUD 操作

範例（React）：

```tsx
/**
 * 訂單狀態標籤
 * @param status - 後端回傳的數字狀態碼（0=草稿, 1=待付款, 2=完成）
 */
interface OrderBadgeProps {
  status: number
}

// 後端 status 0 在 UI 上顯示為「草稿」，需與 PM 確認是否會增加新狀態
const STATUS_MAP: Record<number, string> = {
  0: '草稿',
  1: '待付款',
  2: '完成',
}
```

範例（Vue）：

```vue
<script setup lang="ts">
// 延遲 300ms 是為了避免使用者快速切換時觸發過多 API 請求
const debouncedSearch = useDebounceFn(handleSearch, 300)
</script>
```

## 後端備註規範（Node.js / Express）

必須加備註的情況：

* **每個 API 路由** — 說明用途、需要的權限、請求與回應格式
* **Service 方法** — 說明業務邏輯，特別是有副作用的操作
* **資料庫查詢** — 複雜的 join 或篩選條件需說明原因
* **錯誤處理** — 說明預期的錯誤情境與處理方式
* **環境相依邏輯** — 說明為什麼在特定環境有不同行為

範例（Express route）：

```ts
/**
 * 取得使用者訂單列表
 * 權限：需登入（JWT）
 * 分頁：預設每頁 20 筆，最多 100 筆
 */
router.get('/orders', authenticate, async (req, res) => {
  // 限制每頁最多 100 筆，防止一次撈取過多資料拖垮資料庫
  const limit = Math.min(Number(req.query.limit) || 20, 100)
  ...
})
```

範例（Service）：

```ts
// 刪除使用者前需先軟刪除其訂單，避免外鍵約束錯誤
async deleteUser(userId: string) {
  await this.orderService.softDeleteByUser(userId)
  await this.userRepo.softDelete(userId)
}
```

---

# 程式碼規範

## TypeScript

規則：

* 避免使用 any
* 優先使用 interface
* 型別需明確定義

備註：

如果有更好的型別設計方式，
請說明原因並提供範例。

---

## React

規則：

* 使用 Functional Component
* 使用 Hooks
* Component 需可重用
* 避免過度拆分元件

備註：

若有更好的結構，
請說明為什麼要這樣調整。

---

## Vue

規則：

* 使用 Composition API
* 使用 script setup

備註：

如果有 Vue 最佳實務，
請一併說明。

---

## Tailwind CSS

規則：

* 優先使用 Tailwind
* 避免大量 inline style
* 優先考慮 RWD

備註：

若有更好的排版方式，
請提供建議。

---

# Node.js

目前為學習階段。

請在產生 Node.js 程式碼時：

* 加入適當備註（參考上方備註規範）
* 說明目錄結構
* 說明每個檔案用途
* 說明 API 流程

備註：

不要只給程式碼。

請額外說明：

1. 為什麼這樣寫
2. 流程如何運作
3. 未來如何擴充

---

# API 規範

成功格式：

```json
{
  "success": true,
  "data": {}
}
```

失敗格式：

```json
{
  "success": false,
  "message": ""
}
```

備註：

如果專案已有既有格式，
請優先沿用。

---

# 安全性規則

開發時必須遵守，不需等到 Code Review 才檢查。

* 密碼、API Key、Secret 一律寫在環境變數，禁止寫在程式碼裡
* 所有使用者輸入必須驗證，使用 Zod 處理
* 資料庫操作禁止字串拼接 SQL，一律使用 ORM 或參數化查詢
* API 端點必須驗證身份（JWT），公開端點需明確標註
* 回應資料禁止包含密碼、token 等敏感欄位
* 前端禁止儲存敏感資料於 localStorage，改用 httpOnly Cookie

---

# 慣用套件

每個專案優先使用以下套件，保持一致性。
若專案已使用其他套件，請優先沿用既有選擇。

| 用途 | 套件 |
|------|------|
| 資料庫 ORM | Prisma |
| 資料驗證 | Zod |
| JWT 處理 | jose |
| 密碼雜湊 | bcrypt |
| 日期處理 | day.js |
| 前端 HTTP 請求 | axios |
| 測試 | Vitest |

---

# 測試規範

使用 Vitest 作為測試工具。

## 什麼需要測試

| 類型 | 需要測試 | 說明 |
|------|------|------|
| 工具函式（utils） | 必須 | 純函式最容易測，優先補齊 |
| API Service 層 | 必須 | 商業邏輯的核心，需驗證輸入輸出 |
| Zod Schema | 必須 | 驗證合法與不合法的輸入都需要測試 |
| React/Vue Component | 選擇性 | 複雜互動邏輯才需要，簡單展示型不用 |
| API 路由（Integration） | 選擇性 | 有時間再補，但關鍵流程（登入、付款）建議要有 |

## 測試命名規則

```ts
// 格式：描述「什麼情況下」應該「發生什麼」
it('當 email 格式不正確時，應該回傳驗證錯誤', () => { ... })
it('當使用者未登入時，應該回傳 401', () => { ... })
```

## 不需要測試的情況

* 只是組合其他函式、沒有自己邏輯的函式
* 純 UI 樣式（顏色、間距）
* 第三方套件本身的行為

---

# Git 規則

## Branch 命名

```
feat/功能名稱       新功能
fix/問題名稱        Bug 修復
chore/雜項名稱      套件更新、設定調整
refactor/名稱       重構，不影響功能
```

## Commit 格式

```
feat: 新增使用者登入功能
fix: 修復購物車數量計算錯誤
chore: 更新 Prisma 至 5.x
refactor: 拆分 AuthService 邏輯
```

---

# 協作規範

## PR 描述格式

每個 Pull Request 需包含：

1. **改動摘要** — 這個 PR 做了什麼
2. **改動原因** — 為什麼需要這個改動
3. **測試方式** — 如何驗證改動正確

## 多人協作原則

* 不要直接 push 到 main，一律走 PR 流程
* PR 合併前至少需要一人 Review
* Review 發現問題請用留言說明，不要直接修改他人的分支
* 有破壞性變更（DB migration、API 格式調整）需提前告知協作者

---

# Code Review

每次 Review 時請檢查：

* Bug
* TypeScript
* React/Vue Best Practice
* 效能
* 安全性
* 可維護性
* **備註是否足夠讓協作者理解**

輸出格式：

1. 問題
2. 原因
3. 建議修正方式

---

# 新功能開發流程

請遵守以下順序：

1. 分析需求
2. 設計資料結構
3. 設計 API
4. 設計 UI
5. 實作功能
6. 撰寫測試

不要直接開始寫程式。

---

# 教學模式

當需求涉及以下技術時：

* Node.js
* Express
* 系統架構
* Docker
* CI/CD

請額外提供：

【學習重點】

【實務做法】

【常見錯誤】

【未來進階方向】

協助開發者持續成長。

---

# 備註

專案特殊規則請寫於：

* `docs/PROJECT.md`
* `docs/API.md`
* `docs/DATABASE.md`
* `docs/UI_RULES.md`
* `docs/PAYMENT.md`（有金流時使用）
* `docs/CHANGELOG.md`
