# Pre-Deployment Manual Testing Guide

## Prerequisites
```bash
docker compose -f docker-compose.yml up -d          # Start DB + Redis
cd apps/api && npm run start:dev                     # Terminal 1: API on :4000
cd apps/web && npm run dev                           # Terminal 2: Web on :3000
```

## 1. Login & Authentication
| Step | Expected |
|------|----------|
| Open `http://localhost:3000` | Redirected to `/sign-in` |
| Login as `owner@company.com` / `Owner@123` | Redirected to dashboard |
| Click profile → **Change Password** | Can change password successfully |
| Logout, login with new password | Works |
| Login as `admin@company.com` / `Admin@123` | Dashboard loads (fewer modules) |

## 2. Role-Based Access — Test All 4 Roles
Open **different browsers/incognito** for each:

| Role | Email | Can See | Cannot See |
|------|-------|---------|------------|
| **OWNER** | owner@company.com | Everything (Users, Permissions, Settings, Payroll) | N/A |
| **ADMIN** | admin@company.com | CRM, HRMS, Construction, Reports, Commissions | Users, Permissions |
| **HR_MANAGER** | hr@company.com | Employees, Leave, Payroll, Attendance, Departments | CRM, Construction, Settings |
| **EMPLOYEE** | sales@company.com | Own tasks, own attendance, own leave, leads | Any admin/HR module |

## 3. Core Business Flows

### Employee Management
1. Go to **Employees** → Verify list loads
2. Click **+ Add Employee** → Fill form → Submit (check Department & Designation dropdowns)
3. Edit an existing employee → Change department → Save

### Attendance
1. Go to **Attendance** → Verify current month calendar
2. Admin should see **Corrections** tab → Request a correction → Approve it

### Leave Management
1. HR_MANAGER: Go to **Leave Requests** → Approve/Reject
2. EMPLOYEE: Submit a leave request with document upload

### Task Management
1. ADMIN: Go to **EMS** → Create a task → Assign to an employee
2. EMPLOYEE: Go to **My Tasks** → Acknowledge → Mark complete

### Payroll
1. ADMIN/OWNER: Go to **Payroll** → Run payroll for a period
2. Verify payslip shows correct calculations (attendance, half-days)

### CRM Pipeline
1. Go to **Leads** → Create a new lead
2. Change stage (New → Contacted → Qualified → Converted)
3. Verify converted lead creates a customer record

### Construction
1. Go to **Construction Sites** → Add a site with phases
2. Go to **Vendors** → Add vendor
3. Go to **Materials** → Add material inward entry

### Reports
1. Go to **Reports** → View KPI dashboard
2. Generate a CSV/Excel/PDF export → Download

### Escalation & Warnings
1. ADMIN: Go to **Escalation** → Configure escalation rules
2. Create a task for an employee, do not mark it complete
3. After SLA expiry, verify a warning is generated

## 4. Security Checks

| Check | How |
|-------|-----|
| 2FA Setup | Login → Profile → Enable 2FA → Scan QR code → Verify backup codes |
| Permission Grants | OWNER → Permissions → Toggle off a permission for a user → Verify it blocks |
| Data Isolation | Login as `owner@company.com` → Create data → Login as different company user → Verify no cross-company data visible |

## 5. Quick Verify Scripts

```bash
# API health
curl http://localhost:4000/api/health

# API unit tests (all 417)
cd apps/api && npx jest --passWithNoTests --forceExit

# API E2E tests (RBAC + tenant-isolation)
cd apps/api && npx jest --config ./test/jest-e2e.json --runInBand test/rbac test/tenant-isolation

# Web E2E tests
cd apps/web && npx playwright test

# TypeScript check
cd apps/web && npx tsc --noEmit
cd apps/api && npx tsc --noEmit

# Lint
cd apps/web && npx next lint
cd apps/api && npx eslint src --ext .ts
```

## 6. Deployment Checklist

- [x] `.env` files NOT tracked in git (only `.env.example` templates are tracked)
- [x] `temp_*.sql` already in `.gitignore`
- [ ] Production `.env` uses strong unique secrets (not defaults)
- [ ] PostgreSQL exposed port removed in production docker-compose
- [ ] CORS `FRONTEND_URL` set to production domain
- [ ] Redis password set in production
- [ ] `NODE_ENV=production` for both API and Web
- [ ] Rate limiting enabled (100 req/60s global, 20 req/60s auth)
- [ ] SSL/TLS termination configured at reverse proxy
- [ ] Database backups configured
- [ ] Health check endpoints monitored

## 7. CRITICAL BLOCKERS — Must Fix Before Deployment

### BLOCKER-01: Dark Mode Toggle Crashes the App
- **What happens:** Click the sun/moon theme toggle button (top-right, 36x36px)
- **Result:** Page immediately crashes — React app unmounts, Next.js chunk scripts show in body
- **Repro:** Login as owner → click theme toggle → page crashes
- **Root cause:** Theme toggle handler throws an unhandled error (likely a missing component or state mutation)
- **Fix:** Wrap theme toggle in try/catch, fix the dark mode state management

### BLOCKER-02: Attendance Check-In Has No GPS Fallback
- **What happens:** Click "Check In" as employee → button shows "Getting location..." → silently fails after ~30s
- **Result:** No error message, no selfie camera, no attendance recorded
- **Root cause:** GPS geolocation is required first; if it fails, the flow stops silently
- **On mobile:** Browser prompts for location → user approves → GPS obtained → camera opens for selfie
- **But:** If user DENIES location permission, they get stuck with no feedback
- **Fix:** Show error toast when GPS fails, provide manual location entry option

### BLOCKER-03: Selfie Camera Never Opens
- **What happens:** After GPS (if it succeeds), no camera feed appears for selfie capture
- **Result:** Employee cannot complete attendance check-in with selfie
- **Root cause:** Camera (getUserMedia) is only triggered AFTER GPS succeeds; no fallback
- **Fix:** Open camera feed immediately, capture selfie, then get GPS in parallel

### BLOCKER-04: Missing Graphs on Owner Dashboard
- **What happens:** Owner dashboard shows SVG charts but they may not render properly in dark mode
- **Result:** Graphs appear broken or invisible when dark mode is toggled
- **Fix:** Ensure chart colors adapt to dark/light theme

### BLOCKER-05: Nonce Error During Attendance
- **What happens:** Next.js script loading shows `"nonce":"$undefined"` in page source
- **Result:** Scripts may fail to load in strict CSP environments
- **Fix:** Configure proper CSP nonce in Next.js config

### BLOCKER-06: Mobile Sidebar Not Collapsible
- **What happens:** Sidebar is always 240px wide, no hamburger toggle on mobile
- **Result:** On 375px screens, sidebar takes 65% of width
- **Fix:** Add responsive breakpoints (hidden on md, toggleable)

### BLOCKER-07: Employee Can Access Settings via Direct URL
- **What happens:** Navigate to `/dashboard/settings` as employee
- **Result:** Page loads with Company Info, 2FA, Reset All Data options
- **Fix:** Add RBAC guard to Settings page route

## 8. Quick Fix Priorities

| Priority | Issue | Estimated Fix Time |
|----------|-------|-------------------|
| P0 | Dark mode toggle crash | 1-2 hours |
| P0 | Attendance GPS fallback + camera | 3-4 hours |
| P0 | Selfie camera opens without GPS | 2-3 hours |
| P1 | Mobile sidebar responsive | 2-3 hours |
| P1 | Settings page RBAC guard | 30 min |
| P1 | Nonce/CSP configuration | 30 min |
| P2 | Dashboard graph dark mode | 1 hour |
