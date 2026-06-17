# UI_RULES.md

## 設計系統

> 使用哪套 UI Library？例如：shadcn/ui、Ant Design、純 Tailwind

## 色彩規範

```css
/* 主色 */
primary: （填入）

/* 輔色 */
secondary: （填入）

/* 狀態色 */
success: green-500
warning: yellow-500
error: red-500
info: blue-500
```

## 字體規範

```
標題：font-bold text-2xl
副標題：font-semibold text-xl
內文：text-base
輔助文字：text-sm text-gray-500
```

## RWD 斷點

| 名稱 | 寬度 | 說明 |
|------|------|------|
| sm | 640px | 手機橫向 |
| md | 768px | 平板 |
| lg | 1024px | 筆電 |
| xl | 1280px | 桌機 |

## 元件規範

### 按鈕

```html
<!-- 主要按鈕 -->
<button class="bg-primary text-white px-4 py-2 rounded">

<!-- 次要按鈕 -->
<button class="border border-primary text-primary px-4 py-2 rounded">
```

### 表單

> 表單欄位、錯誤提示的統一樣式規則

### 卡片

> 卡片元件的統一樣式規則

## 三種必要 UI 狀態

每個有資料請求的頁面或元件，必須處理以下三種狀態，不可省略：

### 載入中（Loading）

```html
<!-- 使用 Skeleton 或 Spinner，避免直接顯示空白 -->
<div class="animate-pulse bg-gray-200 rounded h-6 w-full" />
```

規則：
- 列表用 Skeleton（佔位骨架）
- 按鈕送出中用 Spinner + 禁用按鈕（防止重複送出）

### 空狀態（Empty）

```html
<!-- 沒有資料時，顯示提示訊息，不可顯示空白區塊 -->
<div class="text-center text-gray-400 py-12">
  <p>目前沒有資料</p>
</div>
```

規則：
- 明確告知使用者「沒有資料」而不是讓畫面空著
- 可視情況提供引導行動（例如「立即新增」按鈕）

### 錯誤狀態（Error）

```html
<!-- API 失敗時，顯示錯誤訊息，提供重試選項 -->
<div class="text-center text-red-500 py-12">
  <p>載入失敗，請稍後再試</p>
  <button @click="retry" class="mt-4 text-sm underline">重試</button>
</div>
```

規則：
- 顯示對使用者友善的訊息，不顯示技術性錯誤內容
- 提供重試機制
- 表單送出失敗需在對應欄位旁顯示錯誤訊息（422 回應）

## 動畫與過渡

> 是否使用動畫？統一的 transition duration 是多少？

## 備註

> 其他 UI 相關規則或慣例
