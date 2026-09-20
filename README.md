# Riku blog

Vue 3 + TypeScript + VitePress 個人部落格。海洋藍、深淺模式、自訂配色、Markdown、分類、標籤、搜尋、分頁、文章目錄、閱讀進度、RSS 與靜態 SEO。

## 執行

安裝 Node.js 22 LTS 後：

```sh
npm install
npm run dev
npm run typecheck
npm run build
npm run preview
```

已納入 package-lock.json，CI 使用 npm ci，確保之後使用同一組依賴版本。取得專案後也可以使用 npm ci 安裝鎖定版本；新增或更新套件時，請一併提交 package.json 與 package-lock.json。

## 寫文章

在 `content/posts/my-post.md` 建立檔案：

```md
---
title: 我的文章
date: '2026-09-16'
description: 文章摘要與分享描述
category: 技術筆記
tags: [Vue, TypeScript]
featured: false
cover: ../media/my-cover.png
---
# 我的文章

## 第一個章節

內文。
```

`cover` 是選填；圖片存入 `content/public/media/`。檔名是固定 slug；發布後不要任意更名。日期必須用 YYYY-MM-DD。所有 posts 內的 Markdown 都會發布，未完成的草稿請放在 content 外。

首頁自動取最新文章，每頁 6 篇；第一篇 featured 文章顯示於精選區。全文搜尋由 VitePress 在建置時產生。文章用標準 Markdown，不要嵌入 Vue 或使用 VitePress 專屬語法，以維持可攜性。附帶兩篇明確標記的示範文章，正式使用前可刪除。

## 配色與版型

導覽列「配色」提供五種預設色、自訂選色、系統／淺色／深色模式，偏好只存在讀者自己的瀏覽器。自訂色會混合黑白以改善文字可讀性。

- 全站資訊：`content/.vitepress/site.ts`
- Vue 版型：`content/.vitepress/theme/Layout.vue`
- 外觀：`content/.vitepress/theme/style.css`
- 文章：`content/posts/`
- 圖片：`content/public/media/`

換本專案版型可保留文章。搬到其他平台時帶走 Markdown 與圖片，轉換必要的 frontmatter、圖片路徑及轉址規則。

## 瀏覽統計（待設定）

已預留 Umami 的 scriptUrl 與 websiteId，預設停用。建立自己的 Umami 網站後在 site.ts 填入服務提供的公開腳本 URL 與網站 ID，重新建置即可；訪客來源與熱門文章在 Umami 管理介面查看。不要放入密碼或私密 API 金鑰。需有實際帳號設定才能驗證資料收集。

## GitHub 與公開網站

目標儲存庫：https://github.com/PinkEvil-1/riku-blog

目前預設未啟用自動公開部署。GitHub Actions 會檢查型別、建置並保存靜態網站成品。公開網站前確認 site.ts 的 url/base；目前以 https://PinkEvil-1.github.io/riku-blog/ 為預期地址，此設定不表示網站已上線。

本次環境無法連線 GitHub，尚未讀取遠端內容、合併或推送。請先取得遠端儲存庫後合併本資料夾，避免覆蓋現有內容。已嘗試 pnpm 離線安裝（缺少套件快取）及線上安裝（registry.npmjs.org 連線失敗），尚未完成建置、型別檢查或瀏覽器驗證。原始碼目前是待驗證的第一版。
