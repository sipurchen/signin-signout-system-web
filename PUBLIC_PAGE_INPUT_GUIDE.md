<!-- ── Codex BEGIN: bilingual public page input guide / 雙語公開頁輸入說明 ───────────────── -->
# Public Page Input Guide / 公開頁輸入說明

## Page URL / 頁面網址

- Public Pages URL: `https://sipurchen.github.io/signin-signout-system-web/`
- 公開 Pages 網址：`https://sipurchen.github.io/signin-signout-system-web/`

## Purpose / 文件目的

This file explains what each input field on the current public page is for, what is required, and when a field should stay blank.  
本文件說明目前公開頁面每個輸入欄位的用途、哪些必填，以及哪些情況應保持空白。

## Current Visible Fields / 目前可見欄位

The current public page Settings UI shows these runtime fields:  
目前公開頁面的 Settings UI 會顯示以下執行時欄位：

- `Source Google Sheet URL / Drive File URL`
- `Writable Google Sheet URL`
- `Apps Script Web App URL`
- `CSV cache host URL`
- `Worksheet Name`

## Quick Start / 快速開始

For the simplest public-page usage:  
若要用最簡單的方式操作公開頁：

1. Fill `Source Google Sheet URL / Drive File URL`  
   填入 `Source Google Sheet URL / Drive File URL`
2. Fill `Worksheet Name`  
   填入 `Worksheet Name`
3. Click `Save and Reload`  
   按下 `Save and Reload`

If you only need to load guest data from a shared Google Sheet or Drive file, the other fields can usually stay blank.  
如果你只是要從共享 Google Sheet 或 Google Drive 檔案載入來賓資料，其他欄位通常可以保持空白。

## Field Details / 欄位詳細說明

### 1. `Source Google Sheet URL / Drive File URL`

What it is for / 用途：

- Main source for loading roster data  
  載入名單資料的主要來源
- Can be a Google Sheet URL  
  可以是 Google Sheet 網址
- Can be a Google Drive file URL  
  可以是 Google Drive 檔案網址
- Can be another direct file URL if reachable  
  也可以是其他可直接存取的檔案網址

What to enter / 應填內容：

- The actual shared source link you want the page to read from  
  你希望頁面實際讀取的共享來源連結

Required / 是否必填：

- Yes, if you want the public page to load remote data  
  若你要讓公開頁載入遠端資料，這欄必填

Leave blank when / 可留白情況：

- You plan to use `Load XLSX` from a local file instead  
  你打算改用 `Load XLSX` 從本機檔案載入

Notes / 備註：

- This is the main read/import field  
  這是主要的讀取/匯入欄位
- On the public page, this is usually the most important field  
  在公開頁上，這通常是最重要的欄位

### 2. `Writable Google Sheet URL`

What it is for / 用途：

- Target Google Sheet for direct cloud writeback  
  直接雲端回寫時使用的目標 Google Sheet
- Usually paired with `Apps Script Web App URL`  
  通常會與 `Apps Script Web App URL` 搭配使用

What to enter / 應填內容：

- A real writable Google Sheet URL  
  真正可寫入的 Google Sheet 網址
- Not a Drive preview/view link  
  不是 Drive 預覽或檢視連結

Required / 是否必填：

- No  
  否
- Only needed when you want direct Google writeback from the public page  
  只有在你要從公開頁直接回寫到 Google 時才需要

Leave blank when / 可留白情況：

- You only need read/import  
  你只需要讀取/匯入
- You are not using Apps Script writeback  
  你沒有使用 Apps Script 回寫

Notes / 備註：

- Filling this field alone does not automatically enable writes  
  單填這欄不會自動開啟寫入功能
- It is a target sheet identity, not a complete write channel by itself  
  這欄只是目標工作表識別，不是完整寫入通道

### 3. `Apps Script Web App URL`

What it is for / 用途：

- The actual bridge endpoint for direct Google writeback  
  直接回寫到 Google 時使用的橋接端點
- Used by `Check Bridge`  
  `Check Bridge` 會使用這個欄位
- Used when the public page sends updates through Apps Script  
  公開頁要透過 Apps Script 發送更新時會用到

What to enter / 應填內容：

- A deployed Apps Script Web App URL  
  已部署的 Apps Script Web App URL
- Example: `https://script.google.com/macros/s/.../exec`  
  格式例如：`https://script.google.com/macros/s/.../exec`

Required / 是否必填：

- No  
  否
- Required only when you want direct Google writeback from the public page  
  只有在你要從公開頁直接回寫到 Google 時才必填

Leave blank when / 可留白情況：

- You only need read/import  
  你只需要讀取/匯入
- You are not using Apps Script integration  
  你沒有使用 Apps Script 整合

Notes / 備註：

- `Check Bridge` mainly validates this field  
  `Check Bridge` 主要驗證這個欄位
- If this field is empty or invalid, bridge-related checks will fail  
  若這欄為空或格式錯誤，Bridge 相關檢查會失敗

### 4. `CSV cache host URL`

What it is for / 用途：

- Connects the page to an existing shared cache host  
  讓頁面連到既有的 shared cache host
- Intended for shared-cache sync flows  
  用於 shared-cache 同步流程

What to enter / 應填內容：

- The URL of an already running cache host  
  已經在運行中的 cache host 網址
- Example: `http://192.168.1.10:43123`  
  例如：`http://192.168.1.10:43123`

Required / 是否必填：

- No  
  否

Leave blank when / 可留白情況：

- You are only using the public page as a standalone web page  
  你只是把公開頁當成單機網頁使用
- You do not already have a separate cache host running  
  你沒有另外運行 cache host

Important / 重要：

- The current GitHub Pages public site is a static site  
  目前 GitHub Pages 公開站是靜態網站
- The public site itself is not the cache host  
  公開站本身不是 cache host
- Do not paste the GitHub Pages URL here  
  不要把 GitHub Pages 網址貼到這欄

### 5. `Worksheet Name`

What it is for / 用途：

- The worksheet/tab name used when reading a Google Sheet  
  從 Google Sheet 讀取資料時使用的工作表名稱
- Should also match your bridge configuration if Apps Script is used  
  若有使用 Apps Script，也應與 bridge 設定一致

What to enter / 應填內容：

- The exact worksheet name, for example `Guest List`  
  精確的工作表名稱，例如 `Guest List`

Required / 是否必填：

- Strongly recommended  
  強烈建議填寫

Leave blank when / 可留白情況：

- Almost never recommended  
  幾乎不建議留白

Notes / 備註：

- If this value is wrong, the page may load the wrong sheet or fail to match your bridge setup  
  如果這個值錯誤，頁面可能會讀到錯的工作表，或與 bridge 設定不一致

## Recommended Input Patterns / 建議填法情境

### Scenario A: Read data only from a shared Sheet or Drive file / 情境 A：只從共享 Sheet 或 Drive 檔案讀資料

Fill / 請填：

- `Source Google Sheet URL / Drive File URL`
- `Worksheet Name`

Leave blank / 請留白：

- `Writable Google Sheet URL`
- `Apps Script Web App URL`
- `CSV cache host URL`

Use this when / 適用情況：

- You only need to open and load the roster  
  你只需要開啟並載入名單

### Scenario B: Public page + direct Google writeback / 情境 B：公開頁加直接回寫 Google

Fill / 請填：

- `Source Google Sheet URL / Drive File URL`
- `Writable Google Sheet URL`
- `Apps Script Web App URL`
- `Worksheet Name`

Usually leave blank / 通常留白：

- `CSV cache host URL`

Use this when / 適用情況：

- You need the public page to send updates back to Google through Apps Script  
  你需要公開頁透過 Apps Script 把更新寫回 Google

### Scenario C: Public page connects to an existing cache host / 情境 C：公開頁連到既有 cache host

Fill / 請填：

- `Source Google Sheet URL / Drive File URL` if still needed  
  若流程仍需要來源連結則填 `Source Google Sheet URL / Drive File URL`
- `CSV cache host URL`
- `Worksheet Name`

Optional / 選填：

- `Writable Google Sheet URL`
- `Apps Script Web App URL`

Use this when / 適用情況：

- You already have another host or service running shared cache endpoints  
  你已經有其他 host 或服務在運行 shared cache 端點
- You are not expecting GitHub Pages itself to act as the host  
  你並不期待 GitHub Pages 本身充當 host

## What Usually Causes Confusion / 常見混淆點

### `Source` vs `Writable`

- `Source` is mainly for loading data  
  `Source` 主要用於讀取資料
- `Writable` is the target sheet reference for writeback  
  `Writable` 是回寫目標工作表的參考

### `Writable` without `Apps Script`

- Usually not enough for direct Google writeback on the public page  
  若沒有 `Apps Script`，通常不足以讓公開頁直接回寫到 Google

### `CSV cache host URL`

- This is not the public GitHub Pages URL  
  這不是 GitHub Pages 的公開網址
- It should point to a real cache host endpoint  
  它應該指向真正的 cache host 端點

### `Check Bridge`

- This checks the Apps Script bridge metadata path  
  這會檢查 Apps Script bridge 的 metadata 路徑
- It does not prove that all guest writes have already succeeded  
  它不代表所有來賓寫入操作都已經成功

## Suggested Operator Order / 建議操作順序

1. Open Settings  
   開啟 Settings
2. Paste `Source Google Sheet URL / Drive File URL`  
   貼上 `Source Google Sheet URL / Drive File URL`
3. Fill `Worksheet Name`  
   填入 `Worksheet Name`
4. If needed, add `Writable Google Sheet URL`  
   若需要，再填 `Writable Google Sheet URL`
5. If needed, add `Apps Script Web App URL`  
   若需要，再填 `Apps Script Web App URL`
6. If you use an external cache host, add `CSV cache host URL`  
   若你使用外部 cache host，再填 `CSV cache host URL`
7. Click `Save and Reload`  
   按下 `Save and Reload`
8. Only then use `Check Bridge` if Apps Script is part of your setup  
   只有當 Apps Script 是你的流程一部分時，才再使用 `Check Bridge`

## Minimal Safe Guidance / 最小安全建議

- If you are unsure, start with only:  
  如果你不確定，先只填：
  - `Source Google Sheet URL / Drive File URL`
  - `Worksheet Name`
- Add the other fields only when your deployment really uses them  
  只有在你的部署流程真的會用到時，再填其他欄位

## Related File / 相關文件

- See also: `README.md`  
  另請參考：`README.md`
<!-- ── Codex END ──────────────────────────────────────── -->
