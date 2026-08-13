<!-- ── Codex BEGIN: bilingual public README / 雙語公開 README ───────────────── -->
# Signin Signout System Web

Public WebUI repository for cloud-hosted guest check-in, checkpoint, and host operations.  
本專案是公開的 WebUI 倉庫，用於雲端部署的來賓報到、檢查點與主持流程。

This repository contains only the Expo web runtime and its GitHub Pages deployment workflow.  
此倉庫只保留 Expo 網頁執行環境與 GitHub Pages 發布流程。

## Security / 安全性

- No Google Drive link is hardcoded in source.  
  原始碼內沒有硬編碼的 Google Drive 連結。
- No Apps Script URL is hardcoded in source.  
  原始碼內沒有硬編碼的 Apps Script URL。
- No secrets are committed to this repository.  
  此倉庫未提交任何 secret。
- Operators enter shared links at runtime in the Settings UI.  
  操作人員需在執行時於 Settings 畫面輸入共享連結。

## Deployment / 部署

- GitHub Actions exports the Expo web build.  
  GitHub Actions 會輸出 Expo web build。
- GitHub Pages serves the static site.  
  GitHub Pages 會提供靜態網站服務。

## Runtime Fields / 執行時欄位

The current public page exposes these Settings fields:  
目前公開頁面的 Settings 會顯示以下欄位：

- `Source Google Sheet URL / Drive File URL`
- `Writable Google Sheet URL`
- `Apps Script Web App URL`
- `CSV cache host URL`
- `Worksheet Name`

Only input the values you want to use at runtime.  
只需填入你目前執行時真正要使用的值。

## Input Guide / 輸入說明

- See [PUBLIC_PAGE_INPUT_GUIDE.md](./PUBLIC_PAGE_INPUT_GUIDE.md) for detailed field-by-field instructions.  
  詳細欄位說明請見 [PUBLIC_PAGE_INPUT_GUIDE.md](./PUBLIC_PAGE_INPUT_GUIDE.md)。
- Use that guide when deciding which fields are required, optional, or should stay blank on the public page.  
  如需判斷哪些欄位必填、選填、或應保持空白，請以該文件為準。
<!-- ── Codex END ──────────────────────────────────────── -->
