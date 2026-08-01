@echo off
set PLAYWRIGHT_SKIP_WEBSERVER=1
set WEB_E2E_BASE_URL=http://127.0.0.1:3000
set API_URL=http://127.0.0.1:4000
cd /d C:\Users\Nikhil Dhiman\Desktop\dashboard\apps\web
npx playwright test e2e/workflow-ems.spec.ts --reporter=list --project=chromium 2>&1
