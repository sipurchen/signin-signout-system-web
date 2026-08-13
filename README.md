# Signin Signout System Web

Public WebUI repository for cloud-hosted guest check-in, checkpoint, and host operations.

This repository contains only the Expo web runtime and its GitHub Pages deployment workflow.

## Security

- No Google Drive link is hardcoded in source.
- No Apps Script URL is hardcoded in source.
- No secrets are committed to this repository.
- Operators enter shared links at runtime in the Settings UI.

## Deployment

- GitHub Actions exports the Expo web build.
- GitHub Pages serves the static site.

## Runtime fields

- `Source Google Sheet URL / Drive File URL`
- `Writable Google Sheet URL`
- `Apps Script Web App URL`
- `CSV cache host URL`
- `Worksheet Name`

Only input the values you want to use at runtime.
