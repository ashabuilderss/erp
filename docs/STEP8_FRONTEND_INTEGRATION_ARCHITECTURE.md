# Phase 4.2 — Step 8: Frontend Integration Architecture Plan

> **Status:** Architecture planning pass only. No code changes.
> **Date:** 2026-07-08
> **Scope:** Integrate all frozen Phase 4.2 backend capabilities into production-ready frontend.

---

## 1. Scope Review

### What's Frozen (Backend — DO NOT MODIFY)
- Database schema (all Phase 4.2 models)
- All backend APIs (50+ endpoints across 7 controllers)
- Domain events, CQRS, audit, scheduler, governance
- Business logic, transactions, RBAC

### What's In Scope (Frontend — Step 8)
- New pages for missing features
- New API hooks for unconnected endpoints
- New TypeScript types for new backend models
- Navigation updates for new routes
- Export format expansion (Excel, PDF, Google Sheets)
- Charts for new performance analytics
- Role-based UI verification
- End-to-end integration validation

### What's NOT In Scope
- New business functionality
- Backend API changes
- Schema changes
- New design system components (reuse existing)

---

## 2. Current Frontend Audit

### 2.1 Frontend Stats
| Category | Count |
|----------|-------|
| Dashboard pages | 35 |
| UI components | 19 |
| Shared components | 8 |
| Layout components | 4 |
| Dashboard components | 8 |
| Chart components | 6 |
| API hooks | 32 |
| Type files | 7 |
| Design tokens | shadcn (base-nova) |
| State management | TanStack React Query v5 |
| Table library | @tanstack/react-table v8 |
| Chart library | Recharts |
| Icons | Lucide React |

### 2.2 Architecture Pattern
- **Framework:** Next.js 16 App Router, React 19
- **Auth:** NextAuth v5 (Credentials + JWT)
- **API Pattern:** Proxy route (`/api/proxy/*`) → backend
- **Data Fetching:** React Query hooks wrapping `api.get/post/patch/delete`
- **Tables:** `DataTable` component (sorting, pagination, search)
- **Forms:** Manual state + `validateForm()` utility
- **Charts:** Recharts (lazy-loaded)
- **Layout:** `AppShell` → `Sidebar` + `TopNav` + content

---

## 3. Missing Integrations

### 3.1 Pages That Don't Exist Yet
| Module | Backend Endpoints | Frontend Page | Status |
|--------|------------------|---------------|--------|
| Announcements | 9 endpoints (`/announcements/*`) | None | **MISSING** |
| Documents | 7 endpoints (`/documents/*`) | None | **MISSING** |
| Export Config | 5 endpoints (`/reports/export-configs/*`) | None | **MISSING** |
| Google Sheets Sync | 0 endpoints (service-only) | None | **MISSING** |
| Performance Scores | 7 endpoints (`/performance-scores/*`) | Legacy `/performance` only | **PARTIAL** |
| Owner Dashboard | 4 endpoints (`/dashboard/owner/*`) | Uses generic analytics | **PARTIAL** |
| Event Replay | 2 endpoints (`/internal/events/*`) | None | **MISSING** |
| Export History | 1 endpoint (`/reports/export-history`) | Not on page | **MISSING** |

### 3.2 API Hooks Missing
| Hook | Backend Endpoint | Exists? |
|------|-----------------|---------|
| `usePerformanceScores` | GET `/performance-scores` | NO |
| `useCalculateScore` | POST `/performance-scores/calculate` | NO |
| `useRateEmployee` | POST `/performance-scores/rate` | NO |
| `usePerformanceTrends` | GET `/performance-scores/trends` | NO |
| `usePerformanceLeaderboard` | GET `/performance-scores/leaderboard` | NO |
| `useRecalculateScore` | POST `/performance-scores/recalculate` | NO |
| `useAnnouncements` | GET `/announcements` | NO |
| `useMyAnnouncements` | GET `/announcements/my` | NO |
| `useCreateAnnouncement` | POST `/announcements` | NO |
| `usePublishAnnouncement` | POST `/announcements/publish` | NO |
| `useArchiveAnnouncement` | POST `/announcements/archive` | NO |
| `useReadAnnouncement` | POST `/announcements/:id/read` | NO |
| `useAcknowledgeAnnouncement` | POST `/announcements/:id/acknowledge` | NO |
| `useAnnouncementReceipts` | GET `/announcements/:id/receipts` | NO |
| `useDocuments` | GET `/documents` | NO |
| `useRegisterDocument` | POST `/documents` | NO |
| `useDeleteDocument` | POST `/documents/:id/delete` | NO |
| `useDocumentAccessLogs` | GET `/documents/:id/access-logs` | NO |
| `useDocumentAccessStats` | GET `/documents/:id/access-stats` | NO |
| `useLogDocumentAccess` | POST `/documents/access` | NO |
| `useExportConfigs` | GET `/reports/export-configs` | NO |
| `useCreateExportConfig` | POST `/reports/export-configs` | NO |
| `useUpdateExportConfig` | PUT `/reports/export-configs/:id` | NO |
| `useDeleteExportConfig` | DELETE `/reports/export-configs/:id` | NO |
| `useExportHistory` | GET `/reports/export-history` | NO |
| `useOwnerMetrics` | GET `/dashboard/owner/metrics` | NO |
| `useOwnerKpi` | GET `/dashboard/owner/kpi` | NO |
| `useOwnerAlerts` | GET `/dashboard/owner/alerts` | NO |
| `useOwnerHistory` | GET `/dashboard/owner/history` | NO |
| `useReplayEvent` | POST `/internal/events/:id/replay` | NO |
| `useReplayHandler` | POST `/internal/events/handlers/:eventId/:handlerName/replay` | NO |

### 3.3 TypeScript Types Missing
| Type | For Endpoint | Exists? |
|------|-------------|---------|
| `PerformanceScore` | `/performance-scores` | NO |
| `CalculateScoreDto` | POST calculate | NO |
| `RateEmployeeDto` | POST rate | NO |
| `PerformanceTrend` | GET trends | NO |
| `PerformanceLeaderboard` | GET leaderboard | NO |
| `Announcement` | `/announcements` | NO |
| `AnnouncementReceipt` | `/announcements/:id/receipts` | NO |
| `CreateAnnouncementDto` | POST create | NO |
| `DocumentRegistry` | `/documents` | NO |
| `DocumentAccessLog` | `/documents/:id/access-logs` | NO |
| `RegisterDocumentDto` | POST register | NO |
| `ExportConfig` | `/reports/export-configs` | NO |
| `CreateExportConfigDto` | POST create | NO |
| `UpdateExportConfigDto` | PUT update | NO |
| `ReportExport` | `/reports/exports` (enhanced) | NO |
| `OwnerMetrics` | GET owner/metrics | NO |
| `OwnerKpi` | GET owner/kpi | NO |
| `OwnerAlert` | GET owner/alerts | NO |
| `DomainEvent` | `/internal/events` | NO |

### 3.4 Navigation Missing
| Route Label | Path | Icon | Roles |
|------------|------|------|-------|
| Announcements | `/dashboard/announcements` | `Megaphone` | OWNER, ADMIN, HR_MANAGER |
| Documents | `/dashboard/documents` | `FileStack` | OWNER, ADMIN, HR_MANAGER |
| Export Config | `/dashboard/export-configs` | `Settings2` | OWNER, ADMIN |

### 3.5 Export Capabilities Missing
| Capability | Backend Support | Frontend Support |
|-----------|----------------|-----------------|
| CSV export | ✅ | ✅ (reports page) |
| Excel export | ✅ | ❌ |
| PDF export | ✅ | ❌ |
| Google Sheets sync | ✅ (scheduler) | ❌ |
| Export history | ✅ | ❌ |
| Export config CRUD | ✅ | ❌ |

### 3.6 Charts Missing
| Chart | Backend Data Source | Frontend Component |
|-------|--------------------|--------------------|
| Performance composite score | `/performance-scores` | ❌ |
| Performance trends | `/performance-scores/trends` | ❌ |
| Performance leaderboard | `/performance-scores/leaderboard` | ❌ |
| Owner dashboard KPIs | `/dashboard/owner/kpi` | ❌ (uses generic) |
| Owner alerts | `/dashboard/owner/alerts` | ❌ |
| Announcement activity | `/announcements` | ❌ |
| Document access stats | `/documents/:id/access-stats` | ❌ |

---

## 4. Module-by-Module Plan

### 4.1 Performance Scores Module

**Current State:**
- EMS page (`/dashboard/ems`) uses legacy `/performance` endpoints
- Legacy `usePerformance` hook queries `/performance` (EMS module)
- No awareness of new `/performance-scores/*` endpoints

**What Needs to Happen:**
1. Create `usePerformanceScores.ts` hook with all 6 endpoints
2. Add `PerformanceScore` type to `lib/types/ems.ts`
3. Create a new Performance Analytics page at `/dashboard/performance`
4. Add navigation item for Performance (visible to OWNER, ADMIN, HR_MANAGER, EMPLOYEE with different views)
5. Build: Score list (DataTable), Calculate dialog, Rate dialog, Trends chart, Leaderboard table
6. Optionally enhance EMS page to link to new performance scores

**Backend Endpoints:**
- `POST /performance-scores/calculate` → Calculate composite score for employee/period
- `POST /performance-scores/rate` → Manager rates a score (1-10)
- `GET /performance-scores/trends` → Score trends over time
- `GET /performance-scores/leaderboard` → Top performers for a period
- `GET /performance-scores` → Paginated list with filters
- `GET /performance-scores/:id` → Single score detail
- `POST /performance-scores/recalculate` → Force recalculation

**Components to Create:**
- `PerformanceScoreTable.tsx` — DataTable with employee, period, composite score, task/attendance/eod/manager scores
- `CalculateScoreDialog.tsx` — Form: employee select, period, periodType, calculate button
- `RateEmployeeDialog.tsx` — Form: score (1-10 slider), comment, submit
- `PerformanceTrendsChart.tsx` — Line chart of composite scores over periods
- `PerformanceLeaderboardTable.tsx` — Ranked table with score, rank, employee name

**Verification Checklist:**
- [ ] Owner sees all employees' scores
- [ ] Admin sees all employees' scores
- [ ] HR Manager sees all employees' scores
- [ ] Employee sees only own scores (via employeeId filter)
- [ ] Calculate creates score record and returns composite
- [ ] Rate updates managerRating and recomputes composite
- [ ] Trends chart renders correctly
- [ ] Leaderboard sorts by composite score desc
- [ ] Loading/skeleton states on all views
- [ ] Empty state when no scores exist

---

### 4.2 Announcements Module

**Current State:**
- No page exists
- No hooks exist
- No types exist
- Backend has 9 endpoints fully implemented

**What Needs to Happen:**
1. Create `useAnnouncements.ts` hook with all 9 endpoints
2. Add `Announcement`, `CreateAnnouncementDto` types to a new `lib/types/communication.ts`
3. Create `/dashboard/announcements` page
4. Add navigation item for Announcements (OWNER, ADMIN, HR_MANAGER)
5. Build: Announcement list, Create dialog, Publish/Archive actions, Employee "My Announcements" view
6. Employee role: read-only view of active announcements with acknowledge button

**Backend Endpoints:**
- `POST /announcements` → Create (DRAFT)
- `POST /announcements/publish` → Publish (DRAFT→PUBLISHED)
- `POST /announcements/archive` → Archive (PUBLISHED→ARCHIVED)
- `GET /announcements` → List all (ADMIN/HR view)
- `GET /announcements/my` → List active for employee
- `GET /announcements/:id` → Detail
- `GET /announcements/:id/receipts` → Read receipts
- `POST /announcements/:id/read` → Mark as read
- `POST /announcements/:id/acknowledge` → Acknowledge

**Components to Create:**
- `AnnouncementListTable.tsx` — DataTable: title, priority badge, status badge, target roles, created date, actions (publish/archive)
- `CreateAnnouncementDialog.tsx` — Form: title, body (textarea), priority select, target roles multi-select, target employees multi-select, expiresAt date picker
- `AnnouncementDetailSheet.tsx` — Side panel: full body, receipt stats, acknowledge button
- `AnnouncementReceiptsDialog.tsx` — Modal showing read/acknowledged employee list
- `MyAnnouncementsList.tsx` — Employee view: active announcements, read/acknowledge buttons

**Verification Checklist:**
- [ ] Owner/Admin/HR can create, publish, archive announcements
- [ ] Employee sees only active announcements
- [ ] Employee can mark as read and acknowledge
- [ ] Priority badges render correctly (LOW/NORMAL/HIGH/URGENT)
- [ ] Status transitions work (DRAFT→PUBLISHED→ARCHIVED)
- [ ] Receipt tracking shows who read/acknowledged
- [ ] Empty state when no announcements
- [ ] Loading states on all views
- [ ] Target roles/employees filtering works

---

### 4.3 Documents Module

**Current State:**
- No page exists
- No hooks exist
- No types exist
- Backend has 7 endpoints fully implemented

**What Needs to Happen:**
1. Create `useDocuments.ts` hook with all 7 endpoints
2. Add `DocumentRegistry`, `DocumentAccessLog`, `RegisterDocumentDto` types
3. Create `/dashboard/documents` page
4. Add navigation item for Documents (OWNER, ADMIN, HR_MANAGER)
5. Build: Document list, Register dialog, Delete with confirmation, Access logs viewer, Access stats

**Backend Endpoints:**
- `POST /documents` → Register document
- `POST /documents/access` → Log access (VIEW/DOWNLOAD)
- `GET /documents` → List all (paginated, filterable by category)
- `GET /documents/:id` → Detail
- `GET /documents/:id/access-logs` → Access history
- `GET /documents/:id/access-stats` → Access statistics
- `POST /documents/:id/delete` → Soft delete (status→DELETED)

**Components to Create:**
- `DocumentListTable.tsx` — DataTable: name, category, fileType, fileSize, status badge, access count, created date, actions
- `RegisterDocumentDialog.tsx` — Form: name, fileType, fileSize, category select, storageObjectId, accessLevel select
- `DocumentDetailSheet.tsx` — Side panel: metadata, access stats chart, recent access logs
- `DocumentAccessLogsTable.tsx` — Nested table: user, action, timestamp
- `DeleteDocumentConfirmDialog.tsx` — Confirmation with warning

**Verification Checklist:**
- [ ] Owner/Admin/HR can register, view, delete documents
- [ ] Category filter works
- [ ] Access logging works (VIEW/DOWNLOAD)
- [ ] Access logs show who accessed and when
- [ ] Access stats show total views/downloads
- [ ] Delete sets status to DELETED (soft delete)
- [ ] DELETED documents hidden from default list
- [ ] Empty state when no documents
- [ ] Loading states on all views

---

### 4.4 Export Config & History Module

**Current State:**
- Reports page has basic CSV export via `useCreateReportExport`
- No export config management UI
- No export history page
- No Excel/PDF export buttons
- Google Sheets sync exists in backend but no frontend visibility

**What Needs to Happen:**
1. Create `useExportConfigs.ts` hook with 4 endpoints
2. Add `ExportConfig`, `CreateExportConfigDto`, `UpdateExportConfigDto` types
3. Create `/dashboard/export-configs` page (OWNER, ADMIN only)
4. Enhance Reports page with format selector (CSV/Excel/PDF)
5. Add Export History tab/card to Reports page
6. Add navigation item for Export Config

**Backend Endpoints:**
- `GET /reports/export-configs` → List configs
- `GET /reports/export-configs/:id` → Detail
- `POST /reports/export-configs` → Create (OWNER, ADMIN)
- `PUT /reports/export-configs/:id` → Update (OWNER, ADMIN)
- `DELETE /reports/export-configs/:id` → Delete (OWNER, ADMIN)
- `GET /reports/export-history` → Export history

**Components to Create:**
- `ExportConfigTable.tsx` — DataTable: exportType, sheetId, syncEnabled badge, syncSchedule, allowedRoles, actions
- `CreateExportConfigDialog.tsx` — Form: exportType, sheetId, sheetName, syncEnabled toggle, syncSchedule, allowedRoles multi-select, grantedUsers multi-select
- `ExportFormatSelector.tsx` — Radio group or select: CSV, Excel, PDF
- `ExportHistoryTable.tsx` — DataTable: title, format badge, status badge, generated date, file size, download action

**Changes to Existing:**
- Reports page: Add format selector to export buttons
- Reports page: Add "Export History" tab with `useExportHistory` hook
- Reports page: Add "Export Config" link for OWNER/ADMIN

**Verification Checklist:**
- [ ] OWNER can create/update/delete export configs
- [ ] ADMIN can create/update/delete export configs
- [ ] HR_MANAGER can view but not modify configs
- [ ] Format selector shows CSV/Excel/PDF options
- [ ] Export creates correct format
- [ ] Export history shows past exports with status
- [ ] Google Sheets sync status visible on config
- [ ] Sync schedule configurable
- [ ] Allowed roles/granted users configurable
- [ ] Empty states on all views

---

### 4.5 Owner Dashboard Enhancement

**Current State:**
- `OwnerDashboard` component uses `useAnalyticsDashboard()` (generic `/reports/kpi-dashboard`)
- 8 KPI cards, LeadFunnelChart, property overview, revenue, action links
- No dedicated owner endpoints consumed

**What Needs to Happen:**
1. Create `useOwnerDashboard.ts` hook with 4 endpoints
2. Enhance `OwnerDashboard` component to consume dedicated owner APIs
3. Add owner-specific charts and alerts

**Backend Endpoints:**
- `GET /dashboard/owner/metrics` → Company-wide metrics
- `GET /dashboard/owner/kpi` → KPI snapshot data
- `GET /dashboard/owner/alerts` → Critical/material alerts
- `GET /dashboard/owner/history` → Historical KPI data

**Changes to Existing:**
- `owner-dashboard.tsx`: Replace generic analytics calls with owner-specific hooks
- Add alerts section (from `/dashboard/owner/alerts`)
- Add historical KPI trend chart (from `/dashboard/owner/history`)

**Verification Checklist:**
- [ ] Only OWNER sees enhanced dashboard
- [ ] KPI data comes from dedicated owner endpoints
- [ ] Alerts render with severity indicators
- [ ] History chart shows KPI trends
- [ ] Fallback to generic analytics if owner endpoints unavailable

---

### 4.6 Event Replay (Internal/Admin)

**Current State:**
- No frontend page
- 2 endpoints for replaying failed events
- Governance events are backend-only

**What Needs to Happen:**
1. Create `useEvents.ts` hook with 2 endpoints
2. Add event replay section to Security page (or dedicated admin page)
3. Only visible to OWNER

**Backend Endpoints:**
- `POST /internal/events/:id/replay` → Replay entire event
- `POST /internal/events/handlers/:eventId/:handlerName/replay` → Replay specific handler

**Changes to Existing:**
- Security page: Add "Failed Events" card with replay action (OWNER only)

**Verification Checklist:**
- [ ] Only OWNER sees event replay section
- [ ] Replay button triggers event reprocessing
- [ ] Success feedback on replay
- [ ] Error handling for replay failures

---

### 4.7 Export History Integration

**Current State:**
- Reports page shows "Recent Exports" card with last 6 exports
- No dedicated export history view

**What Needs to Happen:**
1. Create `useExportHistory` hook (already planned in 4.4)
2. Add Export History tab to Reports page
3. Add download action for completed exports
4. Show export status (REQUESTED/PROCESSING/COMPLETED/FAILED)

**Verification Checklist:**
- [ ] Export history shows all past exports
- [ ] Status badges render correctly
- [ ] Download button enabled only for COMPLETED exports
- [ ] Pagination works for large history
- [ ] Search/filter by title or format

---

## 5. API Integration Plan

### 5.1 New Hooks to Create
All hooks follow the existing pattern: `use client`, React Query, `api.get/post/patch/delete`, query key conventions, cache invalidation.

| Hook File | Hooks | Endpoints |
|-----------|-------|-----------|
| `usePerformanceScores.ts` | `usePerformanceScores`, `usePerformanceScore`, `useCalculateScore`, `useRateEmployee`, `usePerformanceTrends`, `usePerformanceLeaderboard`, `useRecalculateScore` | 7 |
| `useAnnouncements.ts` | `useAnnouncements`, `useMyAnnouncements`, `useAnnouncement`, `useCreateAnnouncement`, `usePublishAnnouncement`, `useArchiveAnnouncement`, `useReadAnnouncement`, `useAcknowledgeAnnouncement`, `useAnnouncementReceipts` | 9 |
| `useDocuments.ts` | `useDocuments`, `useDocument`, `useRegisterDocument`, `useDeleteDocument`, `useDocumentAccessLogs`, `useDocumentAccessStats`, `useLogDocumentAccess` | 7 |
| `useExportConfigs.ts` | `useExportConfigs`, `useExportConfig`, `useCreateExportConfig`, `useUpdateExportConfig`, `useDeleteExportConfig` | 5 |
| `useOwnerDashboard.ts` | `useOwnerMetrics`, `useOwnerKpi`, `useOwnerAlerts`, `useOwnerHistory` | 4 |
| `useEvents.ts` | `useReplayEvent`, `useReplayHandler` | 2 |
| **TOTAL** | **37 hooks** | **34 endpoints** |

### 5.2 Existing Hooks to Modify
| Hook | Change |
|------|--------|
| `useReports.ts` | Add `useExportHistory` hook, enhance `useCreateReportExport` to accept format param |
| `usePerformance.ts` | Add deprecation note pointing to `usePerformanceScores` for new scoring |
| `hooks/api/index.ts` | Add barrel exports for all new hook modules |

### 5.3 Query Key Convention (Existing)
```ts
// Pattern: [entity, ...filters]
["performance-scores", query]
["performance-scores", id]
["performance-scores", "trends", params]
["performance-scores", "leaderboard", period, periodType]
["announcements", query]
["announcements", "my"]
["announcements", id]
["announcements", id, "receipts"]
["documents", query]
["documents", id]
["documents", id, "access-logs"]
["documents", id, "access-stats"]
["export-configs"]
["export-configs", id]
["export-history", query]
["owner", "metrics", date]
["owner", "kpi", date]
["owner", "alerts", limit]
["owner", "history", days]
```

### 5.4 Cache Invalidation Pattern (Existing)
```ts
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["entity-name"] });
  // Also invalidate related queries
  queryClient.invalidateQueries({ queryKey: ["related-entity"] });
}
```

### 5.5 API Error Handling (Existing)
```ts
import { api, ApiError } from "@/lib/api";
// In mutations:
onError: (err: ApiError) => {
  showToast(err.message, "error");
}
```

---

## 6. RBAC Integration Plan

### 6.1 Current RBAC Pattern
- **Navigation:** `Sidebar` filters `NAV_ITEMS` by `item.roles.includes(role)`
- **Pages:** No per-page role guards (relies on backend 403)
- **Components:** Role-specific dashboards rendered based on `useCurrentUser().user.role`

### 6.2 RBAC Matrix for New Features

| Feature | OWNER | ADMIN | HR_MANAGER | EMPLOYEE |
|---------|-------|-------|------------|----------|
| Performance Scores (view) | ✅ | ✅ | ✅ | ✅ (own) |
| Performance Scores (calculate) | ✅ | ✅ | ✅ | ❌ |
| Performance Scores (rate) | ✅ | ✅ | ✅ | ❌ |
| Performance Leaderboard | ✅ | ✅ | ✅ | ✅ |
| Announcements (create/publish/archive) | ✅ | ✅ | ✅ | ❌ |
| Announcements (read/acknowledge) | ✅ | ✅ | ✅ | ✅ |
| Documents (register/delete) | ✅ | ✅ | ✅ | ❌ |
| Documents (read) | ✅ | ✅ | ✅ | ❌ |
| Export Config (CRUD) | ✅ | ✅ | ❌ | ❌ |
| Export Config (read) | ✅ | ✅ | ✅ | ❌ |
| Export History | ✅ | ✅ | ✅ | ❌ |
| Export (CSV/Excel/PDF) | ✅ | ✅ | ✅ | ❌ |
| Owner Dashboard (dedicated) | ✅ | ❌ | ❌ | ❌ |
| Event Replay | ✅ | ❌ | ❌ | ❌ |

### 6.3 UI-Level Permission Gating
- **Navigation:** Add new items to `NAV_ITEMS` with correct `roles` arrays
- **Page-level:** Use `useCurrentUser().permissions` array for fine-grained checks
- **Component-level:** Conditionally render action buttons based on permissions
- **Backend enforcement:** All endpoints already enforce RBAC via `@Roles` + `@RequirePermissions`

### 6.4 Forbidden State Handling
- If user navigates to a route they shouldn't access, backend returns 403
- Frontend should show error boundary or redirect to dashboard
- No client-side privilege escalation possible (backend is source of truth)

---

## 7. UI Component Plan

### 7.1 Reusable Components to Leverage
| Existing Component | Usage |
|-------------------|-------|
| `DataTable` | All list views (scores, announcements, documents, configs, history) |
| `Dialog` + `DialogContent/Header/Title/Footer` | All create/edit forms |
| `Sheet` + `SheetContent/Header/Title` | Detail side panels |
| `Card` + `CardHeader/Title/Content` | Dashboard cards, stat cards |
| `Badge` | Status badges, priority badges, format badges |
| `Select` + `SelectTrigger/Content/Item` | All dropdowns |
| `Input` | All text fields |
| `Textarea` | Announcement body, document notes |
| `Button` | All actions |
| `ConfirmDialog` | Delete confirmations |
| `EmptyState` | Empty list states |
| `PageHeader` | All page headers |
| `StatusBadge` | Status display |
| `Skeleton` variants | Loading states |
| `Tabs` + `TabsList/Trigger/Content` | Tabbed views (export history) |
| `useToast()` | Success/error feedback |

### 7.2 New Components to Create
| Component | File | Description |
|-----------|------|-------------|
| `PerformanceScoreTable` | `components/performance/performance-score-table.tsx` | DataTable for scores |
| `CalculateScoreDialog` | `components/performance/calculate-score-dialog.tsx` | Calculate form |
| `RateEmployeeDialog` | `components/performance/rate-employee-dialog.tsx` | Rate form |
| `PerformanceTrendsChart` | `components/performance/performance-trends-chart.tsx` | Line chart |
| `PerformanceLeaderboardTable` | `components/performance/performance-leaderboard-table.tsx` | Ranked table |
| `AnnouncementListTable` | `components/communication/announcement-list-table.tsx` | DataTable |
| `CreateAnnouncementDialog` | `components/communication/create-announcement-dialog.tsx` | Create form |
| `AnnouncementDetailSheet` | `components/communication/announcement-detail-sheet.tsx` | Detail panel |
| `AnnouncementReceiptsDialog` | `components/communication/announcement-receipts-dialog.tsx` | Receipts modal |
| `MyAnnouncementsList` | `components/communication/my-announcements-list.tsx` | Employee view |
| `DocumentListTable` | `components/documents/document-list-table.tsx` | DataTable |
| `RegisterDocumentDialog` | `components/documents/register-document-dialog.tsx` | Register form |
| `DocumentDetailSheet` | `components/documents/document-detail-sheet.tsx` | Detail panel |
| `ExportConfigTable` | `components/reports/export-config-table.tsx` | DataTable |
| `CreateExportConfigDialog` | `components/reports/create-export-config-dialog.tsx` | Create form |
| `ExportFormatSelector` | `components/reports/export-format-selector.tsx` | Format radio/select |
| `ExportHistoryTable` | `components/reports/export-history-table.tsx` | DataTable |

### 7.3 Component Count
- **17 new components** across 4 directories
- **0 modifications** to existing UI primitives
- **1 modification** to `owner-dashboard.tsx` (add dedicated hooks)

---

## 8. Testing Strategy

### 8.1 Component-Level Testing
- Each new component should be testable in isolation
- DataTable components: verify columns render, sorting works, pagination triggers callbacks
- Dialog components: verify form fields, validation, submit handler called
- Chart components: verify data rendering (mock data props)

### 8.2 Integration Testing (React Query)
- Verify hooks fetch correct endpoints
- Verify cache invalidation on mutations
- Verify loading/error/empty states
- Verify role-based visibility

### 8.3 Permission Testing
For each role (OWNER, ADMIN, HR_MANAGER, EMPLOYEE):
- Verify navigation items visible/hidden correctly
- Verify page renders or shows 403
- Verify action buttons visible/hidden based on permissions
- Verify API calls succeed or fail with correct status

### 8.4 Navigation Testing
- Verify all new routes are accessible
- Verify sidebar shows correct items per role
- Verify deep linking works
- Verify redirect to sign-in when unauthenticated

### 8.5 API Integration Testing
- Verify each hook calls correct endpoint
- Verify query parameters passed correctly
- Verify mutation payloads match DTOs
- Verify error handling displays toast

### 8.6 Responsive Testing
- Desktop (1280px+): Full sidebar + content
- Tablet (768px-1279px): Collapsible sidebar
- Mobile (< 768px): Hidden sidebar, hamburger menu

### 8.7 Accessibility Testing
- Keyboard navigation through all interactive elements
- Focus management in dialogs
- ARIA labels on icon-only buttons
- Screen reader compatibility for data tables
- Color contrast for status badges

---

## 9. SRS Compliance Checklist

| SRS Requirement | Frontend Status | Action Needed |
|----------------|-----------------|---------------|
| Performance Analytics (composite scoring) | ❌ Legacy only | New `/performance` page with `/performance-scores` hooks |
| Broadcast Announcements | ❌ No page | New `/announcements` page |
| Document Registry | ❌ No page | New `/documents` page |
| Export Config Management | ❌ No page | New `/export-configs` page |
| Export Format Support (CSV/Excel/PDF) | ⚠️ CSV only | Add format selector to reports page |
| Export History | ⚠️ Partial | Add history tab to reports page |
| Google Sheets Sync UI | ❌ No UI | Status display on export configs page |
| Owner Dashboard (dedicated KPIs) | ⚠️ Generic | Enhance with dedicated owner hooks |
| Event Replay | ❌ No UI | Add to security page (OWNER only) |
| Role-Based Navigation | ✅ Working | Add new nav items |
| Company Isolation | ✅ Backend enforced | Verify frontend doesn't leak cross-company data |
| RBAC Permission Gating | ✅ Backend enforced | Add client-side permission checks for UI |

---

## 10. Risks

### 10.1 Technical Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| `useCurrentUser` may not return `permissions` array | Permission-based UI gating fails | Verify `/auth/me` returns permissions; fallback to role-based checks |
| Google Sheets sync has no HTTP endpoints | Cannot show real-time sync status in UI | Display config-level `syncEnabled` and `syncStatus` fields only |
| Backend owner endpoints may not match frontend's expected data shape | Dashboard integration breaks | Verify response schema before implementation |
| Legacy `/performance` and new `/performance-scores` coexist | Confusion about which to use | Clearly separate: EMS page for legacy, new Performance page for scores |
| `ReportExportStatus` uses `REQUESTED` not `PENDING` | Status badge mismatch | Use correct enum values in frontend types |

### 10.2 Scope Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Announcements + Documents + Export Config + Performance Scores = large scope | Implementation timeline | Break into independent slices; each slice is freezable |
| Owner Dashboard enhancement requires verifying data shape | May need adjustment | Implement with fallback to existing generic analytics |

### 10.3 Integration Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Export format (Excel/PDF) returns base64 buffer | Need to decode and create Blob for download | Reuse existing CSV download pattern from reports page |
| Announcements have complex state machine (DRAFT→PUBLISHED→ARCHIVED) | UI must show correct actions per state | Use StatusBadge + conditional action buttons |

---

## 11. Implementation Slices

### Slice 1: Types & Hooks Foundation
**Scope:** All new TypeScript types and API hooks
**Files:**
- `lib/types/communication.ts` (new)
- `lib/types/exports.ts` (new)
- `hooks/api/usePerformanceScores.ts` (new)
- `hooks/api/useAnnouncements.ts` (new)
- `hooks/api/useDocuments.ts` (new)
- `hooks/api/useExportConfigs.ts` (new)
- `hooks/api/useOwnerDashboard.ts` (new)
- `hooks/api/useEvents.ts` (new)
- `hooks/api/useReports.ts` (modify: add `useExportHistory`)
- `hooks/api/index.ts` (modify: add barrel exports)
**Freeze Criteria:**
- [ ] All types compile with zero TS errors
- [ ] All hooks export correctly
- [ ] Query keys follow existing convention
- [ ] Cache invalidation on mutations
- [ ] No `any` types

---

### Slice 2: Navigation & Layout Updates
**Scope:** Navigation items, page routes, role-based visibility
**Files:**
- `lib/constants.ts` (modify: add 3 nav items)
- `app/(dashboard)/dashboard/announcements/page.tsx` (new: placeholder)
- `app/(dashboard)/dashboard/documents/page.tsx` (new: placeholder)
- `app/(dashboard)/dashboard/export-configs/page.tsx` (new: placeholder)
- `app/(dashboard)/dashboard/performance/page.tsx` (new: placeholder)
**Freeze Criteria:**
- [ ] All new routes accessible
- [ ] Sidebar shows correct items per role
- [ ] Placeholder pages render without errors
- [ ] No unauthorized routes visible

---

### Slice 3: Performance Scores Module
**Scope:** Performance scores page with all features
**Files:**
- `components/performance/performance-score-table.tsx` (new)
- `components/performance/calculate-score-dialog.tsx` (new)
- `components/performance/rate-employee-dialog.tsx` (new)
- `components/performance/performance-trends-chart.tsx` (new)
- `components/performance/performance-leaderboard-table.tsx` (new)
- `app/(dashboard)/dashboard/performance/page.tsx` (new: full implementation)
**Freeze Criteria:**
- [ ] Score list renders with DataTable
- [ ] Calculate dialog creates score
- [ ] Rate dialog updates score
- [ ] Trends chart renders
- [ ] Leaderboard sorts correctly
- [ ] Employee view shows only own scores
- [ ] Loading/empty states work
- [ ] Role-based action visibility

---

### Slice 4: Announcements Module
**Scope:** Announcements page with full CRUD and state management
**Files:**
- `components/communication/announcement-list-table.tsx` (new)
- `components/communication/create-announcement-dialog.tsx` (new)
- `components/communication/announcement-detail-sheet.tsx` (new)
- `components/communication/announcement-receipts-dialog.tsx` (new)
- `components/communication/my-announcements-list.tsx` (new)
- `app/(dashboard)/dashboard/announcements/page.tsx` (new: full implementation)
**Freeze Criteria:**
- [ ] Admin/HR can create, publish, archive
- [ ] Employee sees only active announcements
- [ ] Read/acknowledge works
- [ ] Receipt tracking displays correctly
- [ ] Priority/status badges render
- [ ] Empty/loading states work

---

### Slice 5: Documents Module
**Scope:** Documents page with CRUD, access logging, and stats
**Files:**
- `components/documents/document-list-table.tsx` (new)
- `components/documents/register-document-dialog.tsx` (new)
- `components/documents/document-detail-sheet.tsx` (new)
- `app/(dashboard)/dashboard/documents/page.tsx` (new: full implementation)
**Freeze Criteria:**
- [ ] Document list with category filter
- [ ] Register document form works
- [ ] Access logs display correctly
- [ ] Access stats render
- [ ] Delete with confirmation
- [ ] DELETED documents hidden
- [ ] Empty/loading states work

---

### Slice 6: Export Config & History
**Scope:** Export config management and export history
**Files:**
- `components/reports/export-config-table.tsx` (new)
- `components/reports/create-export-config-dialog.tsx` (new)
- `components/reports/export-format-selector.tsx` (new)
- `components/reports/export-history-table.tsx` (new)
- `app/(dashboard)/dashboard/export-configs/page.tsx` (new: full implementation)
- `app/(dashboard)/dashboard/reports/page.tsx` (modify: add format selector + history tab)
**Freeze Criteria:**
- [ ] Export config CRUD works for OWNER/ADMIN
- [ ] HR_MANAGER can view but not modify
- [ ] Format selector shows CSV/Excel/PDF
- [ ] Export history shows past exports
- [ ] Download action works for completed exports
- [ ] Sync status displayed on configs
- [ ] Empty/loading states work

---

### Slice 7: Owner Dashboard & Event Replay
**Scope:** Enhanced owner dashboard and event replay in security page
**Files:**
- `components/dashboard/owner-dashboard.tsx` (modify: add dedicated hooks)
- `app/(dashboard)/dashboard/security/page.tsx` (modify: add failed events section)
- `hooks/api/useEvents.ts` (already created in Slice 1)
**Freeze Criteria:**
- [ ] Owner dashboard uses dedicated owner endpoints
- [ ] Alerts section renders with severity
- [ ] History chart shows KPI trends
- [ ] Event replay button works (OWNER only)
- [ ] Fallback to generic analytics if needed

---

### Slice 8: Final Integration & Polish
**Scope:** Cross-cutting concerns, responsive, accessibility, testing
**Files:**
- All pages (verify responsive behavior)
- All components (verify keyboard navigation)
- All hooks (verify error handling)
**Freeze Criteria:**
- [ ] All pages responsive (desktop/tablet/mobile)
- [ ] Keyboard navigation works
- [ ] Focus management in dialogs
- [ ] ARIA labels on icon buttons
- [ ] All loading states use Skeleton variants
- [ ] All empty states use EmptyState component
- [ ] All errors show toast notifications
- [ ] TypeScript compilation: zero errors
- [ ] ESLint: zero errors
- [ ] No `any` types in new code
- [ ] No `ts-ignore` in new code

---

## 12. Final Readiness Assessment

### Current Frontend Maturity
- **Solid Foundation:** 35 pages, 50+ components, 32 hooks, proven patterns
- **RBAC:** Working navigation-level filtering, role-specific dashboards
- **Data Layer:** React Query with proper cache management
- **Design System:** shadcn/ui components, consistent styling
- **API Pattern:** Proxy route with JWT injection, consistent error handling

### What Step 8 Delivers
- **8 new pages** (Performance, Announcements, Documents, Export Config + 4 placeholders promoted)
- **37 new hooks** connecting all Phase 4.2 backend endpoints
- **17 new components** following existing design patterns
- **3 new type files** for new backend models
- **Enhanced Reports page** with format selector and history
- **Enhanced Owner Dashboard** with dedicated endpoints
- **Enhanced Security page** with event replay

### Step 8 Does NOT Deliver
- New business logic (backend is frozen)
- New design system components
- New state management patterns
- Backend API changes
- Database schema changes

### Estimated Slice Count: 8 independently freezable slices
### Estimated Total Files: ~40 new/modified files
### Estimated Effort: Medium-High (large scope but follows proven patterns)

---

*This document is the authoritative architecture plan for Phase 4.2 Step 8. All implementation must follow this plan. No backend modifications permitted.*

---

# PATCH 1 — Frontend Ownership Matrix

> Every page traced: UI → Backend Endpoints → React Query Hooks → Permissions → Read Models → Mutations.

---

## P1.1 Performance Scores Page (`/dashboard/performance`)

| Layer | Detail |
|-------|--------|
| **Page** | `app/(dashboard)/dashboard/performance/page.tsx` |
| **Backend Endpoints** | `GET /performance-scores`, `GET /performance-scores/:id`, `GET /performance-scores/trends`, `GET /performance-scores/leaderboard`, `POST /performance-scores/calculate`, `POST /performance-scores/rate`, `POST /performance-scores/recalculate` |
| **React Query Hooks** | `usePerformanceScores(query)`, `usePerformanceScore(id)`, `usePerformanceTrends(params)`, `usePerformanceLeaderboard(period, periodType)`, `useCalculateScore()`, `useRateEmployee()`, `useRecalculateScore()` |
| **Permissions (nav)** | OWNER, ADMIN, HR_MANAGER, EMPLOYEE (EMPLOYEE sees own scores only) |
| **Backend Permission** | `PERFORMANCE_READ`, `PERFORMANCE_CALCULATE`, `PERFORMANCE_RATE`, `PERFORMANCE_TREND`, `PERFORMANCE_LEADERBOARD` |
| **Read Models** | `PerformanceScore { id, employeeId, companyId, period, periodType, taskScore, attendanceScore, eodScore, managerRating, compositeScore, calculatedById, calculatedAt, ratedById, ratedAt }` |
| **Mutations** | `useCalculateScore` → POST `/performance-scores/calculate`, `useRateEmployee` → POST `/performance-scores/rate`, `useRecalculateScore` → POST `/performance-scores/recalculate` |

**Data Flow:**
```
Page mount
  → useCurrentUser() → role, permissions
  → usePerformanceScores({ page, limit, employeeId?, periodType?, period? })
    → GET /performance-scores
    → Response: { data: PerformanceScore[], meta: PaginatedResponse }
  → usePerformanceLeaderboard({ period, periodType, limit })
    → GET /performance-scores/leaderboard
    → Response: { data: { rank, employeeName, compositeScore }[] }
  → usePerformanceTrends({ employeeId?, periodType?, limit })
    → GET /performance-scores/trends
    → Response: { data: { period, compositeScore, taskScore, ... }[] }
  → CalculateScoreDialog submit
    → useCalculateScore()
      → POST /performance-scores/calculate { employeeId, period, periodType }
      → Invalidate: ["performance-scores"], ["performance-scores", "leaderboard"]
  → RateEmployeeDialog submit
    → useRateEmployee()
      → POST /performance-scores/rate { performanceScoreId, ratedById, score, comment }
      → Invalidate: ["performance-scores"], ["performance-scores", id]
```

---

## P1.2 Announcements Page (`/dashboard/announcements`)

| Layer | Detail |
|-------|--------|
| **Page** | `app/(dashboard)/dashboard/announcements/page.tsx` |
| **Backend Endpoints** | `GET /announcements`, `GET /announcements/my`, `GET /announcements/:id`, `GET /announcements/:id/receipts`, `POST /announcements`, `POST /announcements/publish`, `POST /announcements/archive`, `POST /announcements/:id/read`, `POST /announcements/:id/acknowledge` |
| **React Query Hooks** | `useAnnouncements(query)`, `useMyAnnouncements()`, `useAnnouncement(id)`, `useAnnouncementReceipts(id)`, `useCreateAnnouncement()`, `usePublishAnnouncement()`, `useArchiveAnnouncement()`, `useReadAnnouncement()`, `useAcknowledgeAnnouncement()` |
| **Permissions (nav)** | OWNER, ADMIN, HR_MANAGER (create/publish/archive); EMPLOYEE (read/acknowledge via `/my`) |
| **Backend Permission** | `ANNOUNCEMENT_READ`, `ANNOUNCEMENT_CREATE`, `ANNOUNCEMENT_PUBLISH`, `ANNOUNCEMENT_ARCHIVE` |
| **Read Models** | `Announcement { id, companyId, title, body, priority, status, targetRoles, targetEmployees, createdBy, publishedAt, archivedAt, expiresAt, createdAt }` |
| **Mutations** | `useCreateAnnouncement` → POST `/announcements`, `usePublishAnnouncement` → POST `/announcements/publish`, `useArchiveAnnouncement` → POST `/announcements/archive`, `useReadAnnouncement` → POST `/announcements/:id/read`, `useAcknowledgeAnnouncement` → POST `/announcements/:id/acknowledge` |

**Data Flow:**
```
ADMIN/HR_MANAGER view:
  → useAnnouncements({ page, limit, status? })
    → GET /announcements
    → Response: { data: Announcement[], meta: PaginatedResponse }
  → CreateAnnouncementDialog submit
    → useCreateAnnouncement()
      → POST /announcements { title, body, priority, targetRoles, targetEmployees, expiresAt }
      → Invalidate: ["announcements"]
  → Publish/Archive buttons
    → usePublishAnnouncement() / useArchiveAnnouncement()
      → POST /announcements/publish|archive { announcementId }
      → Invalidate: ["announcements"], ["announcements", id]

EMPLOYEE view:
  → useMyAnnouncements()
    → GET /announcements/my
    → Response: { data: Announcement[] }
  → Read/Acknowledge buttons
    → useReadAnnouncement(id) / useAcknowledgeAnnouncement(id)
      → POST /announcements/:id/read | /acknowledge
      → Invalidate: ["announcements", "my"]
```

---

## P1.3 Documents Page (`/dashboard/documents`)

| Layer | Detail |
|-------|--------|
| **Page** | `app/(dashboard)/dashboard/documents/page.tsx` |
| **Backend Endpoints** | `GET /documents`, `GET /documents/:id`, `GET /documents/:id/access-logs`, `GET /documents/:id/access-stats`, `POST /documents`, `POST /documents/access`, `POST /documents/:id/delete` |
| **React Query Hooks** | `useDocuments(query)`, `useDocument(id)`, `useDocumentAccessLogs(id, query)`, `useDocumentAccessStats(id)`, `useRegisterDocument()`, `useLogDocumentAccess()`, `useDeleteDocument()` |
| **Permissions (nav)** | OWNER, ADMIN, HR_MANAGER |
| **Backend Permission** | `DOCUMENT_READ`, `DOCUMENT_CREATE`, `DOCUMENT_DELETE` |
| **Read Models** | `DocumentRegistry { id, companyId, name, fileType, fileSize, category, storageObjectId, accessLevel, status, registeredById, createdAt, updatedAt }` |
| **Mutations** | `useRegisterDocument` → POST `/documents`, `useLogDocumentAccess` → POST `/documents/access`, `useDeleteDocument` → POST `/documents/:id/delete` |

**Data Flow:**
```
Page mount:
  → useDocuments({ page, limit, category? })
    → GET /documents → { data: DocumentRegistry[], meta }
  → RegisterDocumentDialog submit
    → useRegisterDocument()
      → POST /documents { name, fileType, fileSize, category, storageObjectId, accessLevel }
      → Invalidate: ["documents"]
  → Document click → DetailSheet
    → useDocument(id) → GET /documents/:id
    → useDocumentAccessStats(id) → GET /documents/:id/access-stats
    → useDocumentAccessLogs(id, { page, limit }) → GET /documents/:id/access-logs
  → Download → useLogDocumentAccess() → POST /documents/access
  → Delete → ConfirmDialog → useDeleteDocument() → POST /documents/:id/delete
```

---

## P1.4 Export Config Page (`/dashboard/export-configs`)

| Layer | Detail |
|-------|--------|
| **Page** | `app/(dashboard)/dashboard/export-configs/page.tsx` |
| **Backend Endpoints** | `GET /reports/export-configs`, `GET /reports/export-configs/:id`, `POST /reports/export-configs`, `PUT /reports/export-configs/:id`, `DELETE /reports/export-configs/:id` |
| **React Query Hooks** | `useExportConfigs()`, `useExportConfig(id)`, `useCreateExportConfig()`, `useUpdateExportConfig()`, `useDeleteExportConfig()` |
| **Permissions (nav)** | OWNER, ADMIN (CRUD); HR_MANAGER (read-only via direct nav) |
| **Backend Permission** | `EXPORT_CONFIG_READ`, `EXPORT_CONFIG_MANAGE` |
| **Read Models** | `ExportConfig { id, companyId, exportType, sheetId, sheetName, syncEnabled, syncSchedule, syncStatus, lastSyncedAt, allowedRoles, grantedUsers, createdById, createdAt, updatedAt }` |
| **Mutations** | `useCreateExportConfig` → POST, `useUpdateExportConfig` → PUT, `useDeleteExportConfig` → DELETE |

---

## P1.5 Reports Page (Enhanced) (`/dashboard/reports`)

| Layer | Detail |
|-------|--------|
| **Page** | `app/(dashboard)/dashboard/reports/page.tsx` (modified) |
| **Backend Endpoints** | `GET /reports/catalog`, `GET /reports/kpi-dashboard`, `GET /reports/pipeline-funnel`, `GET /reports/exports`, `GET /reports/export-history`, `POST /reports/exports` |
| **React Query Hooks** | `useReportCatalog()`, `useAnalyticsDashboard()`, `useConversionFunnel()`, `useReportExports()`, `useExportHistory(query)`, `useCreateReportExport()` |
| **Permissions (nav)** | OWNER, ADMIN, HR_MANAGER |
| **Backend Permission** | `REPORT_VIEW`, `REPORT_EXPORT`, `ANALYTICS_VIEW`, `EXPORT_HISTORY` |
| **Read Models** | `ReportExport { id, companyId, reportKey, title, format, status, filters, fileUrl, fileSize, generatedById, generatedAt, failedAt, errorMessage, createdAt }` |
| **Mutations** | `useCreateReportExport` → POST `/reports/exports` |

---

## P1.6 Owner Dashboard (Enhanced) (`/dashboard`)

| Layer | Detail |
|-------|--------|
| **Page** | `components/dashboard/owner-dashboard.tsx` (modified) |
| **Backend Endpoints** | `GET /dashboard/owner/metrics`, `GET /dashboard/owner/kpi`, `GET /dashboard/owner/alerts`, `GET /dashboard/owner/history` |
| **React Query Hooks** | `useOwnerMetrics(date?)`, `useOwnerKpi(date?)`, `useOwnerAlerts(limit?)`, `useOwnerHistory(days?)` |
| **Permissions (nav)** | OWNER only |
| **Backend Permission** | `DASHBOARD_VIEW` |
| **Read Models** | `DashboardKpiSnapshot { id, companyId, snapshotDate, totalEmployees, totalLeads, totalProperties, totalBookings, totalSiteVisits, presentEmployees, absentEmployees, onLeaveToday, pendingApprovals, overdueTasks, activeWarnings, activePayrollHolds, criticalAlerts, materialAlerts, siteDelays, conversionRate, convertedLeads, newLeads, totalRevenue, avgPerformanceScore, collectionStatus, rebuiltAt }` |
| **Mutations** | None (read-only dashboard) |

---

## P1.7 Event Replay (Security Page) (`/dashboard/security`)

| Layer | Detail |
|-------|--------|
| **Page** | `app/(dashboard)/dashboard/security/page.tsx` (modified) |
| **Backend Endpoints** | `POST /internal/events/:id/replay`, `POST /internal/events/handlers/:eventId/:handlerName/replay` |
| **React Query Hooks** | `useReplayEvent()`, `useReplayHandler()` |
| **Permissions (nav)** | OWNER only |
| **Backend Permission** | None (roles-only: OWNER) |
| **Read Models** | DomainEvent from governance-events (displayed in failed events list) |
| **Mutations** | `useReplayEvent` → POST, `useReplayHandler` → POST |

---

## P1.8 Existing Pages — No Changes Required

| Page | Hooks | Backend | Status |
|------|-------|---------|--------|
| Dashboard (non-OWNER) | `useAnalyticsDashboard`, `useConversionFunnel` | `/reports/kpi-dashboard`, `/reports/pipeline-funnel` | Integrated |
| Employees | `useEmployees`, `useCreateEmployee` | `/employees/*` | Integrated |
| Attendance | `useAttendance`, `useCheckIn`, `useCheckOut` | `/attendance/*` | Integrated |
| Leave Requests | `useLeaveRequests`, `useApproveLeave` | `/leave-requests/*` | Integrated |
| Payroll | `usePayroll`, `useProcessPayroll` | `/payroll/*` | Integrated |
| Properties | `useProperties`, `useCreateProperty` | `/properties/*` | Integrated |
| Leads | `useLeads`, `useConvertLead` | `/leads/*` | Integrated |
| Bookings | `useBookings`, `useCreateBooking` | `/bookings/*` | Integrated |
| Notifications | `useNotifications`, `useMarkAsRead` | `/notifications/*` | Integrated |
| Settings | `useUpdateCompany`, TOTP hooks | `/companies/*`, `/auth/2fa/*` | Integrated |
| EMS (legacy) | `usePerformance`, `useAssignments` | `/performance/*`, `/assignments/*` | Integrated |

---

# PATCH 2 — Component Reuse Audit

> For every planned component: Existing reusable component? YES → Reuse. NO → Create new.

---

## P2.1 Performance Score Components

| Planned Component | Existing Reusable? | Decision | Notes |
|------------------|-------------------|----------|-------|
| `PerformanceScoreTable` | `DataTable` (ui/data-table.tsx) | **REUSE** | Define columns for PerformanceScore. Use existing DataTable with `columns`, `data`, `pageCount`, `onPaginationChange`, `searchKey`. |
| `CalculateScoreDialog` | `Dialog` + `Input` + `Select` + `Button` | **REUSE** | Compose Dialog + DialogContent/Header/Title/Footer + Input (period) + Select (employee, periodType) + Button (submit). |
| `RateEmployeeDialog` | `Dialog` + `Input` + `Button` + `Label` | **REUSE** | Compose Dialog + Input (score 1-10) + Textarea (comment) + Button. |
| `PerformanceTrendsChart` | None | **CREATE** | No existing line chart component. Must create using Recharts `LineChart` (same pattern as `AttendanceTrendChart`). |
| `PerformanceLeaderboardTable` | `DataTable` (ui/data-table.tsx) | **REUSE** | Define columns for ranked leaderboard. Use existing DataTable. |

**Reuse Score: 4/5 components reuse existing. 1 new chart (follows `AttendanceTrendChart` pattern).**

---

## P2.2 Announcement Components

| Planned Component | Existing Reusable? | Decision | Notes |
|------------------|-------------------|----------|-------|
| `AnnouncementListTable` | `DataTable` (ui/data-table.tsx) | **REUSE** | Define columns for Announcement. Use DataTable with status badge, priority badge. |
| `CreateAnnouncementDialog` | `Dialog` + `Input` + `Textarea` + `Select` + `Button` | **REUSE** | Compose Dialog + form fields. Multi-select for targetRoles/targetEmployees uses `DropdownMenu` checkbox items. |
| `AnnouncementDetailSheet` | `Sheet` (ui/sheet.tsx) + `Badge` + `Button` | **REUSE** | Compose Sheet with content showing full body, status, priority, dates. |
| `AnnouncementReceiptsDialog` | `Dialog` + `DataTable` | **REUSE** | Compose Dialog containing a mini DataTable of receipts. |
| `MyAnnouncementsList` | `Card` + `Badge` + `Button` | **REUSE** | Compose Card list with status badges and action buttons. |

**Reuse Score: 5/5 components reuse existing primitives.**

---

## P2.3 Document Components

| Planned Component | Existing Reusable? | Decision | Notes |
|------------------|-------------------|----------|-------|
| `DocumentListTable` | `DataTable` (ui/data-table.tsx) | **REUSE** | Define columns for DocumentRegistry. |
| `RegisterDocumentDialog` | `Dialog` + `Input` + `Select` + `Button` | **REUSE** | Compose Dialog + form fields. |
| `DocumentDetailSheet` | `Sheet` + `Badge` + `Tabs` | **REUSE** | Compose Sheet with Tabs for metadata/access-logs/access-stats. |
| `DeleteDocumentConfirmDialog` | `ConfirmDialog` (shared/confirm-dialog.tsx) | **REUSE** | Direct use of existing ConfirmDialog with `variant="destructive"`. |

**Reuse Score: 4/4 components reuse existing.**

---

## P2.4 Export Config Components

| Planned Component | Existing Reusable? | Decision | Notes |
|------------------|-------------------|----------|-------|
| `ExportConfigTable` | `DataTable` (ui/data-table.tsx) | **REUSE** | Define columns for ExportConfig. |
| `CreateExportConfigDialog` | `Dialog` + `Input` + `Select` + `Button` | **REUSE** | Compose Dialog. For `syncEnabled` toggle, use `Button` with pressed state or inline checkbox. |
| `ExportFormatSelector` | `Select` (ui/select.tsx) | **REUSE** | Use Select with 3 items: CSV, EXCEL, PDF. |
| `ExportHistoryTable` | `DataTable` (ui/data-table.tsx) | **REUSE** | Define columns for ReportExport. |

**Reuse Score: 4/4 components reuse existing.**

---

## P2.5 Enhanced Existing Components

| Component | Change | Existing Reusable? | Decision |
|-----------|--------|-------------------|----------|
| `owner-dashboard.tsx` | Add dedicated owner hooks + alerts section | `Card` + `Badge` + existing charts | **REUSE** existing Card/Badge/chart components |
| `reports/page.tsx` | Add format selector + export history tab | `Tabs` + `Select` + `DataTable` | **REUSE** existing Tabs, Select, DataTable |
| `security/page.tsx` | Add failed events section | `Card` + `Button` | **REUSE** existing Card + Button |

---

## P2.6 Component Reuse Summary

| Category | Reused | Created | Reuse Rate |
|----------|--------|---------|------------|
| Tables | 5 (DataTable) | 0 | 100% |
| Dialogs | 6 (Dialog + ConfirmDialog) | 0 | 100% |
| Sheets | 3 (Sheet) | 0 | 100% |
| Forms | 10 (Input, Select, Textarea, Button, Label) | 0 | 100% |
| Charts | 0 | 1 (PerformanceTrendsChart) | 0% |
| Cards | 3 (Card) | 0 | 100% |
| Badges | All (Badge, StatusBadge) | 0 | 100% |
| Loading | All (Skeleton variants) | 0 | 100% |
| Empty | All (EmptyState) | 0 | 100% |
| **TOTAL** | **27** | **1** | **96%** |

---

# PATCH 3 — React Query Ownership

> For every hook: query key, cache owner, invalidation strategy, stale time, retry policy, refetch policy.

---

## P3.1 Global React Query Configuration

```ts
// providers/query-provider.tsx (existing)
defaultOptions: {
  queries: {
    staleTime: 30_000,        // 30 seconds
    gcTime: 300_000,          // 5 minutes
    retry: 1,                 // 1 retry on failure
    refetchOnWindowFocus: false,
  },
}
```

All new hooks inherit these defaults unless overridden.

---

## P3.2 Performance Scores Hooks

| Hook | Query Key | Cache Owner | Invalidation | Stale Time | Retry | Refetch |
|------|-----------|-------------|-------------|-----------|-------|---------|
| `usePerformanceScores(query)` | `["performance-scores", query]` | Paginated list | On calculate/rate/recalculate → `["performance-scores"]` | 30s (default) | 1 | Disabled |
| `usePerformanceScore(id)` | `["performance-scores", id]` | Single score | On rate → `["performance-scores", id]` | 30s | 1 | Disabled |
| `usePerformanceTrends(params)` | `["performance-scores", "trends", params]` | Trends data | On calculate → `["performance-scores", "trends"]` | 60s | 1 | Disabled |
| `usePerformanceLeaderboard(params)` | `["performance-scores", "leaderboard", params]` | Leaderboard | On calculate/rate → `["performance-scores", "leaderboard"]` | 60s | 1 | Disabled |
| `useCalculateScore()` | N/A (mutation) | — | Invalidate `["performance-scores"]`, `["performance-scores", "leaderboard"]`, `["performance-scores", "trends"]` | — | 0 | — |
| `useRateEmployee()` | N/A (mutation) | — | Invalidate `["performance-scores"]`, `["performance-scores", "leaderboard"]`, `["performance-scores", id]` | — | 0 | — |
| `useRecalculateScore()` | N/A (mutation) | — | Invalidate `["performance-scores"]`, `["performance-scores", "leaderboard"]`, `["performance-scores", "trends"]` | — | 0 | — |

---

## P3.3 Announcement Hooks

| Hook | Query Key | Cache Owner | Invalidation | Stale Time | Retry | Refetch |
|------|-----------|-------------|-------------|-----------|-------|---------|
| `useAnnouncements(query)` | `["announcements", query]` | Paginated list | On create/publish/archive → `["announcements"]` | 30s | 1 | Disabled |
| `useMyAnnouncements()` | `["announcements", "my"]` | Employee's active | On read/acknowledge → `["announcements", "my"]` | 30s | 1 | Disabled |
| `useAnnouncement(id)` | `["announcements", id]` | Single announcement | On publish/archive/read → `["announcements", id]` | 30s | 1 | Disabled |
| `useAnnouncementReceipts(id)` | `["announcements", id, "receipts"]` | Receipt list | On read/acknowledge → `["announcements", id, "receipts"]` | 30s | 1 | Disabled |
| `useCreateAnnouncement()` | N/A (mutation) | — | Invalidate `["announcements"]` | — | 0 | — |
| `usePublishAnnouncement()` | N/A (mutation) | — | Invalidate `["announcements"]`, `["announcements", id]` | — | 0 | — |
| `useArchiveAnnouncement()` | N/A (mutation) | — | Invalidate `["announcements"]`, `["announcements", id]` | — | 0 | — |
| `useReadAnnouncement()` | N/A (mutation) | — | Invalidate `["announcements", "my"]`, `["announcements", id]` | — | 0 | — |
| `useAcknowledgeAnnouncement()` | N/A (mutation) | — | Invalidate `["announcements", "my"]`, `["announcements", id]`, `["announcements", id, "receipts"]` | — | 0 | — |

---

## P3.4 Document Hooks

| Hook | Query Key | Cache Owner | Invalidation | Stale Time | Retry | Refetch |
|------|-----------|-------------|-------------|-----------|-------|---------|
| `useDocuments(query)` | `["documents", query]` | Paginated list | On register/delete → `["documents"]` | 30s | 1 | Disabled |
| `useDocument(id)` | `["documents", id]` | Single document | On register/delete → `["documents", id]` | 30s | 1 | Disabled |
| `useDocumentAccessLogs(id, query)` | `["documents", id, "access-logs", query]` | Paginated logs | On log access → `["documents", id, "access-logs"]`, `["documents", id, "access-stats"]` | 30s | 1 | Disabled |
| `useDocumentAccessStats(id)` | `["documents", id, "access-stats"]` | Access stats | On log access → `["documents", id, "access-stats"]` | 60s | 1 | Disabled |
| `useRegisterDocument()` | N/A (mutation) | — | Invalidate `["documents"]` | — | 0 | — |
| `useLogDocumentAccess()` | N/A (mutation) | — | Invalidate `["documents", id, "access-logs"]`, `["documents", id, "access-stats"]` | — | 0 | — |
| `useDeleteDocument()` | N/A (mutation) | — | Invalidate `["documents"]`, `["documents", id]` | — | 0 | — |

---

## P3.5 Export Config Hooks

| Hook | Query Key | Cache Owner | Invalidation | Stale Time | Retry | Refetch |
|------|-----------|-------------|-------------|-----------|-------|---------|
| `useExportConfigs()` | `["export-configs"]` | Config list | On create/update/delete → `["export-configs"]` | 60s | 1 | Disabled |
| `useExportConfig(id)` | `["export-configs", id]` | Single config | On update/delete → `["export-configs", id]` | 60s | 1 | Disabled |
| `useCreateExportConfig()` | N/A (mutation) | — | Invalidate `["export-configs"]` | — | 0 | — |
| `useUpdateExportConfig()` | N/A (mutation) | — | Invalidate `["export-configs"]`, `["export-configs", id]` | — | 0 | — |
| `useDeleteExportConfig()` | N/A (mutation) | — | Invalidate `["export-configs"]` | — | 0 | — |

---

## P3.6 Reports / Export History Hooks

| Hook | Query Key | Cache Owner | Invalidation | Stale Time | Retry | Refetch |
|------|-----------|-------------|-------------|-----------|-------|---------|
| `useExportHistory(query)` | `["export-history", query]` | Paginated history | On create export → `["export-history"]` | 30s | 1 | Disabled |
| `useReportExports()` | `["report-exports"]` | Recent exports | On create export → `["report-exports"]` | 30s | 1 | Disabled |
| `useCreateReportExport()` | N/A (mutation) | — | Invalidate `["report-exports"]`, `["export-history"]` | — | 0 | — |

---

## P3.7 Owner Dashboard Hooks

| Hook | Query Key | Cache Owner | Invalidation | Stale Time | Retry | Refetch |
|------|-----------|-------------|-------------|-----------|-------|---------|
| `useOwnerMetrics(date)` | `["owner", "metrics", date]` | KPI metrics | None (read-only) | 60s | 1 | Disabled |
| `useOwnerKpi(date)` | `["owner", "kpi", date]` | KPI snapshot | None | 60s | 1 | Disabled |
| `useOwnerAlerts(limit)` | `["owner", "alerts", limit]` | Alert list | None | 30s | 1 | Disabled |
| `useOwnerHistory(days)` | `["owner", "history", days]` | Historical data | None | 300s | 1 | Disabled |

---

## P3.8 Event Replay Hooks

| Hook | Query Key | Cache Owner | Invalidation | Stale Time | Retry | Refetch |
|------|-----------|-------------|-------------|-----------|-------|---------|
| `useReplayEvent()` | N/A (mutation) | — | Invalidate security events queries | — | 0 | — |
| `useReplayHandler()` | N/A (mutation) | — | Invalidate security events queries | — | 0 | — |

---

## P3.9 Invalidation Dependency Graph

```
Mutation                    → Query Key(s) Invalidated
───────────────────────────────────────────────────────
useCalculateScore           → ["performance-scores"], ["performance-scores", "leaderboard"], ["performance-scores", "trends"]
useRateEmployee             → ["performance-scores"], ["performance-scores", "leaderboard"], ["performance-scores", id]
useRecalculateScore         → ["performance-scores"], ["performance-scores", "leaderboard"], ["performance-scores", "trends"]
useCreateAnnouncement       → ["announcements"]
usePublishAnnouncement      → ["announcements"], ["announcements", id]
useArchiveAnnouncement      → ["announcements"], ["announcements", id]
useReadAnnouncement         → ["announcements", "my"], ["announcements", id]
useAcknowledgeAnnouncement  → ["announcements", "my"], ["announcements", id], ["announcements", id, "receipts"]
useRegisterDocument         → ["documents"]
useLogDocumentAccess        → ["documents", id, "access-logs"], ["documents", id, "access-stats"]
useDeleteDocument           → ["documents"], ["documents", id]
useCreateExportConfig       → ["export-configs"]
useUpdateExportConfig       → ["export-configs"], ["export-configs", id]
useDeleteExportConfig       → ["export-configs"]
useCreateReportExport       → ["report-exports"], ["export-history"]
useReplayEvent              → ["security"] (existing queries)
useReplayHandler            → ["security"] (existing queries)
```

---

# PATCH 4 — Permission Verification

> For every feature: navigation visibility, backend permission, API authorization, required permission string.

---

## P4.1 Permission String Reference

| Constant | String Value | Defined In |
|----------|-------------|------------|
| `PERFORMANCE_READ` | `performance:read` | `permissions.ts` |
| `PERFORMANCE_CALCULATE` | `performance:calculate` | `permissions.ts` |
| `PERFORMANCE_RATE` | `performance:rate` | `permissions.ts` |
| `PERFORMANCE_TREND` | `performance:trend` | `permissions.ts` |
| `PERFORMANCE_LEADERBOARD` | `performance:leaderboard` | `permissions.ts` |
| `ANNOUNCEMENT_READ` | `announcement:read` | `permissions.ts` |
| `ANNOUNCEMENT_CREATE` | `announcement:create` | `permissions.ts` |
| `ANNOUNCEMENT_PUBLISH` | `announcement:publish` | `permissions.ts` |
| `ANNOUNCEMENT_ARCHIVE` | `announcement:archive` | `permissions.ts` |
| `DOCUMENT_READ` | `document:read` | `permissions.ts` |
| `DOCUMENT_CREATE` | `document:create` | `permissions.ts` |
| `DOCUMENT_DELETE` | `document:delete` | `permissions.ts` |
| `EXPORT_CONFIG_READ` | `export-config:read` | `permissions.ts` |
| `EXPORT_CONFIG_MANAGE` | `export-config:manage` | `permissions.ts` |
| `EXPORT_SHEET_SYNC` | `export-sheet:sync` | `permissions.ts` |
| `EXPORT_DOWNLOAD` | `export:download` | `permissions.ts` |
| `EXPORT_HISTORY` | `export:history` | `permissions.ts` |
| `REPORT_VIEW` | `report:view` | `permissions.ts` |
| `REPORT_EXPORT` | `report:export` | `permissions.ts` |
| `ANALYTICS_VIEW` | `analytics:view` | `permissions.ts` |
| `DASHBOARD_VIEW` | `dashboard:view` | `permissions.ts` |

---

## P4.2 Role → Permission Matrix

| Permission | OWNER | ADMIN | HR_MANAGER | EMPLOYEE |
|-----------|-------|-------|------------|----------|
| `PERFORMANCE_READ` | ✅ | ✅ | ✅ | ❌ |
| `PERFORMANCE_CALCULATE` | ✅ | ✅ | ✅ | ❌ |
| `PERFORMANCE_RATE` | ✅ | ✅ | ✅ | ❌ |
| `PERFORMANCE_TREND` | ✅ | ✅ | ✅ | ✅ |
| `PERFORMANCE_LEADERBOARD` | ✅ | ✅ | ✅ | ✅ |
| `ANNOUNCEMENT_READ` | ✅ | ✅ | ✅ | ✅ |
| `ANNOUNCEMENT_CREATE` | ✅ | ✅ | ✅ | ❌ |
| `ANNOUNCEMENT_PUBLISH` | ✅ | ✅ | ✅ | ❌ |
| `ANNOUNCEMENT_ARCHIVE` | ✅ | ✅ | ✅ | ❌ |
| `DOCUMENT_READ` | ✅ | ✅ | ✅ | ❌ |
| `DOCUMENT_CREATE` | ✅ | ✅ | ✅ | ❌ |
| `DOCUMENT_DELETE` | ✅ | ✅ | ✅ | ❌ |
| `EXPORT_CONFIG_READ` | ✅ | ✅ | ✅ | ❌ |
| `EXPORT_CONFIG_MANAGE` | ✅ | ✅ | ❌ | ❌ |
| `EXPORT_SHEET_SYNC` | ✅ | ✅ | ❌ | ❌ |
| `EXPORT_DOWNLOAD` | ✅ | ✅ | ✅ | ❌ |
| `EXPORT_HISTORY` | ✅ | ✅ | ✅ | ❌ |
| `REPORT_VIEW` | ✅ | ✅ | ✅ | ❌ |
| `REPORT_EXPORT` | ✅ | ✅ | ✅ | ❌ |
| `ANALYTICS_VIEW` | ✅ | ✅ | ✅ | ✅ |
| `DASHBOARD_VIEW` | ✅ | ✅ | ✅ | ✅ |

---

## P4.3 Page-Level Permission Verification

### Performance Scores Page

| Check | OWNER | ADMIN | HR_MANAGER | EMPLOYEE |
|-------|-------|-------|------------|----------|
| Nav item visible | ✅ | ✅ | ✅ | ✅ |
| Page loads | ✅ | ✅ | ✅ | ✅ |
| See all employees' scores | ✅ | ✅ | ✅ | ❌ (own only) |
| Calculate button visible | ✅ | ✅ | ✅ | ❌ |
| Rate button visible | ✅ | ✅ | ✅ | ❌ |
| Recalculate button visible | ✅ | ✅ | ❌ | ❌ |
| Leaderboard visible | ✅ | ✅ | ✅ | ✅ |
| Trends visible | ✅ | ✅ | ✅ | ✅ |

**Frontend gating:** Use `useCurrentUser().permissions` array. Check `permissions.includes("performance:calculate")` for calculate/rate buttons.

### Announcements Page

| Check | OWNER | ADMIN | HR_MANAGER | EMPLOYEE |
|-------|-------|-------|------------|----------|
| Nav item visible | ✅ | ✅ | ✅ | ❌ |
| Page loads (admin view) | ✅ | ✅ | ✅ | N/A |
| Create button visible | ✅ | ✅ | ✅ | N/A |
| Publish button visible | ✅ | ✅ | ✅ | N/A |
| Archive button visible | ✅ | ✅ | ✅ | N/A |
| Receipts button visible | ✅ | ✅ | ✅ | N/A |
| My Announcements (employee) | N/A | N/A | N/A | ✅ |
| Read/Acknowledge visible | N/A | N/A | N/A | ✅ |

**Frontend gating:** Two views: Admin/HR view (all announcements) vs Employee view (my announcements). Route to correct view based on role.

### Documents Page

| Check | OWNER | ADMIN | HR_MANAGER | EMPLOYEE |
|-------|-------|-------|------------|----------|
| Nav item visible | ✅ | ✅ | ✅ | ❌ |
| Page loads | ✅ | ✅ | ✅ | N/A |
| Register button visible | ✅ | ✅ | ✅ | N/A |
| Delete button visible | ✅ | ✅ | ✅ | N/A |
| Access logs visible | ✅ | ✅ | ✅ | N/A |
| Access stats visible | ✅ | ✅ | ✅ | N/A |

**Frontend gating:** `permissions.includes("document:create")` for register button. `permissions.includes("document:delete")` for delete.

### Export Config Page

| Check | OWNER | ADMIN | HR_MANAGER | EMPLOYEE |
|-------|-------|-------|------------|----------|
| Nav item visible | ✅ | ✅ | ❌ | ❌ |
| Page loads | ✅ | ✅ | N/A | N/A |
| Create button visible | ✅ | ✅ | N/A | N/A |
| Edit button visible | ✅ | ✅ | N/A | N/A |
| Delete button visible | ✅ | ✅ | N/A | N/A |

**Frontend gating:** Nav item only for OWNER/ADMIN. Backend enforces `EXPORT_CONFIG_MANAGE` on create/update/delete.

### Reports Page (Enhanced)

| Check | OWNER | ADMIN | HR_MANAGER | EMPLOYEE |
|-------|-------|-------|------------|----------|
| Nav item visible | ✅ | ✅ | ✅ | ❌ |
| Page loads | ✅ | ✅ | ✅ | N/A |
| KPI dashboard visible | ✅ | ✅ | ✅ | N/A |
| Export catalog visible | ✅ | ✅ | ✅ | N/A |
| Export buttons visible | ✅ | ✅ | ✅ | N/A |
| Export history visible | ✅ | ✅ | ✅ | N/A |
| Format selector visible | ✅ | ✅ | ✅ | N/A |

**Frontend gating:** `permissions.includes("report:export")` for export buttons. `permissions.includes("export:history")` for history tab.

### Owner Dashboard

| Check | OWNER | ADMIN | HR_MANAGER | EMPLOYEE |
|-------|-------|-------|------------|----------|
| Dedicated endpoints called | ✅ | ❌ | ❌ | ❌ |
| Generic analytics used | ❌ | ✅ | ✅ | ✅ |
| Alerts section visible | ✅ | ❌ | ❌ | ❌ |
| History chart visible | ✅ | ❌ | ❌ | ❌ |

**Frontend gating:** Check `role === "OWNER"` before calling owner-specific hooks. Fallback to generic analytics for other roles.

### Event Replay (Security Page)

| Check | OWNER | ADMIN | HR_MANAGER | EMPLOYEE |
|-------|-------|-------|------------|----------|
| Failed Events section visible | ✅ | ❌ | ❌ | ❌ |
| Replay button visible | ✅ | ❌ | ❌ | ❌ |
| Replay API call succeeds | ✅ | 403 | 403 | 403 |

**Frontend gating:** `role === "OWNER"` check before rendering the section.

---

## P4.4 Navigation Visibility Matrix

| Route | Path | OWNER | ADMIN | HR_MANAGER | EMPLOYEE |
|-------|------|-------|-------|------------|----------|
| Performance | `/dashboard/performance` | ✅ | ✅ | ✅ | ✅ |
| Announcements | `/dashboard/announcements` | ✅ | ✅ | ✅ | ❌ |
| Documents | `/dashboard/documents` | ✅ | ✅ | ✅ | ❌ |
| Export Config | `/dashboard/export-configs` | ✅ | ✅ | ❌ | ❌ |

---

## P4.5 Client-Side vs Backend Enforcement

| Concern | Client-Side | Backend | Notes |
|---------|------------|---------|-------|
| Nav visibility | ✅ Sidebar filters by role | N/A | UI convenience only |
| Page access | ⚠️ No route guard | ✅ 403 on API calls | Backend is source of truth |
| Button visibility | ✅ Check `permissions` array | ✅ `@RequirePermissions` | Belt and suspenders |
| Data scoping | ❌ Frontend doesn't filter | ✅ `companyId` in all queries | Backend enforces isolation |
| Role escalation | ❌ Not possible | ✅ JWT role + RBAC guard | Backend prevents |

---

# PATCH 5 — UI State Matrix

> Every page must define: Loading, Empty, Error, Unauthorized, Retry, Responsive behavior, Accessibility notes.

---

## P5.1 Performance Scores Page

| State | Behavior | Component |
|-------|----------|-----------|
| **Loading** | `TableSkeleton` with 10 rows for score list. `ChartSkeleton` for trends. `Skeleton` rows for leaderboard. | `Skeleton` variants (existing) |
| **Empty** | `EmptyState` with icon="Activity", title="No Performance Scores", description="Calculate scores for employees to get started." Action: Calculate button (ADMIN/HR only). | `EmptyState` (existing) |
| **Error** | `ErrorFallback` with retry button. Toast error message from `ApiError.message`. | `ErrorFallback` + `useToast` (existing) |
| **Unauthorized** | If 403 on initial load: redirect to `/dashboard` with toast "Access denied". If employee can't see other scores: silently filter to own data. | `useRouter` + `useToast` (existing) |
| **Retry** | React Query retry: 1 attempt. Manual retry via "Try again" button in ErrorFallback. | React Query default + `ErrorFallback` |
| **Responsive** | Desktop: full table + charts side by side. Tablet: stacked layout. Mobile: table scrolls horizontally, charts full width. | Tailwind responsive classes (`md:grid-cols-2`, `overflow-x-auto`) |
| **Accessibility** | DataTable: keyboard navigation through rows. Dialogs: focus trap. Score input: `aria-label="Performance score 1-10"`. Chart: `aria-label="Performance trends line chart"`. | Existing patterns |

---

## P5.2 Announcements Page (Admin/HR View)

| State | Behavior | Component |
|-------|----------|-----------|
| **Loading** | `TableSkeleton` with 10 rows. | `TableSkeleton` (existing) |
| **Empty** | `EmptyState` with icon="Megaphone", title="No Announcements", description="Create your first announcement to communicate with your team." Action: Create button. | `EmptyState` (existing) |
| **Error** | `ErrorFallback` with retry. Toast error. | `ErrorFallback` + `useToast` |
| **Unauthorized** | 403 → redirect to `/dashboard` with toast. | `useRouter` + `useToast` |
| **Retry** | 1 auto-retry. Manual retry via ErrorFallback. | React Query + ErrorFallback |
| **Responsive** | Desktop: full table. Tablet: condensed columns. Mobile: card list layout (no table). | Tailwind responsive + conditional rendering |
| **Accessibility** | Table: keyboard nav. Priority badges: `aria-label` with priority text. Publish/Archive buttons: clear labels. | Existing patterns |

---

## P5.3 Announcements Page (Employee View — My Announcements)

| State | Behavior | Component |
|-------|----------|-----------|
| **Loading** | `ListSkeleton` with 5 rows. | `ListSkeleton` (existing) |
| **Empty** | `EmptyState` with icon="Megaphone", title="No Announcements", description="There are no active announcements at this time." | `EmptyState` (existing) |
| **Error** | `ErrorFallback` with retry. Toast error. | `ErrorFallback` + `useToast` |
| **Unauthorized** | N/A (employee always has access to `/my`). | — |
| **Retry** | 1 auto-retry. Manual retry. | React Query + ErrorFallback |
| **Responsive** | Desktop: card list. Mobile: same card list (already simple). | Tailwind responsive |
| **Accessibility** | Read/Acknowledge buttons: `aria-label="Mark announcement as read"`, `aria-label="Acknowledge announcement"`. Status badges: `aria-label` with status text. | Existing patterns |

---

## P5.4 Documents Page

| State | Behavior | Component |
|-------|----------|-----------|
| **Loading** | `TableSkeleton` with 10 rows. | `TableSkeleton` (existing) |
| **Empty** | `EmptyState` with icon="FileStack", title="No Documents", description="Register documents to track access and manage your document library." Action: Register button. | `EmptyState` (existing) |
| **Error** | `ErrorFallback` with retry. Toast error. | `ErrorFallback` + `useToast` |
| **Unauthorized** | 403 → redirect to `/dashboard` with toast. | `useRouter` + `useToast` |
| **Retry** | 1 auto-retry. Manual retry. | React Query + ErrorFallback |
| **Responsive** | Desktop: full table. Tablet: condensed columns. Mobile: card list. | Tailwind responsive |
| **Accessibility** | Table: keyboard nav. File type icons: `aria-label` with file type. Delete button: `aria-label="Delete document [name]"`. | Existing patterns |

---

## P5.5 Export Config Page

| State | Behavior | Component |
|-------|----------|-----------|
| **Loading** | `TableSkeleton` with 5 rows. | `TableSkeleton` (existing) |
| **Empty** | `EmptyState` with icon="Settings2", title="No Export Configurations", description="Create export configurations to automate data syncing." Action: Create button. | `EmptyState` (existing) |
| **Error** | `ErrorFallback` with retry. Toast error. | `ErrorFallback` + `useToast` |
| **Unauthorized** | 403 → redirect to `/dashboard` with toast. | `useRouter` + `useToast` |
| **Retry** | 1 auto-retry. Manual retry. | React Query + ErrorFallback |
| **Responsive** | Desktop: full table. Tablet: condensed columns. Mobile: card list. | Tailwind responsive |
| **Accessibility** | Sync status badge: `aria-label="Sync enabled/disabled"`. Toggle: `role="switch"` with `aria-checked`. | Existing patterns |

---

## P5.6 Reports Page (Enhanced)

| State | Behavior | Component |
|-------|----------|-----------|
| **Loading** | `DashboardSkeleton` for KPI section. `TableSkeleton` for export history. `ChartSkeleton` for funnel chart. | `DashboardSkeleton` + `TableSkeleton` + `ChartSkeleton` (existing) |
| **Empty** | KPI: always has data (even if zeros). Export history: `EmptyState` with icon="Download", title="No Export History", description="Exported reports will appear here." | `EmptyState` (existing) |
| **Error** | `ErrorFallback` with retry. Toast error. | `ErrorFallback` + `useToast` |
| **Unauthorized** | 403 on export → toast "Export permission denied". Page still loads (read-only). | `useToast` |
| **Retry** | 1 auto-retry. Manual retry. | React Query + ErrorFallback |
| **Responsive** | Desktop: KPI grid + charts + export cards side by side. Tablet: stacked. Mobile: single column. | Tailwind responsive grid |
| **Accessibility** | Format selector: `aria-label="Export format"`. Export button: `aria-label="Export [report name] as [format]"`. | Existing patterns |

---

## P5.7 Owner Dashboard (Enhanced)

| State | Behavior | Component |
|-------|----------|-----------|
| **Loading** | `DashboardSkeleton` for entire page. Falls back to existing skeleton if owner endpoints fail. | `DashboardSkeleton` (existing) |
| **Empty** | KPI: shows zeros. Alerts: `EmptyState` with icon="CheckCircle", title="No Alerts", description="All systems operational." | `EmptyState` (existing) |
| **Error** | Graceful degradation: if owner endpoints fail, fall back to generic analytics (existing behavior). Toast warning "Owner dashboard data unavailable, showing general analytics". | Fallback logic + `useToast` |
| **Unauthorized** | N/A (OWNER-only page, other roles never reach this code path). | — |
| **Retry** | 1 auto-retry on owner hooks. Manual refresh button. | React Query + Button |
| **Responsive** | Desktop: 4-column KPI grid + 2-column chart grid. Tablet: 2-column. Mobile: single column. | Tailwind responsive grid |
| **Accessibility** | KPI cards: `aria-label` with metric name and value. Alert cards: `role="alert"` for critical alerts. Charts: `aria-label` descriptions. | Existing patterns |

---

## P5.8 Event Replay (Security Page)

| State | Behavior | Component |
|-------|----------|-----------|
| **Loading** | Inherits existing security page loading state. | Existing skeleton |
| **Empty** | No events section shown if no failed events. Section hidden entirely. | Conditional rendering |
| **Error** | Toast error on replay failure. Page remains functional. | `useToast` |
| **Unauthorized** | Section hidden for non-OWNER. Backend returns 403 if called directly. | `role === "OWNER"` check |
| **Retry** | Replay button can be clicked again after failure. | Button re-enable |
| **Responsive** | Inherits existing security page responsive behavior. | Existing layout |
| **Accessibility** | Replay button: `aria-label="Replay failed event [id]"`. Success toast: `role="status"`. | Existing patterns |

---

## P5.9 Shared UI State Patterns

### Loading Pattern (All Pages)
```tsx
if (isLoading) return <TableSkeleton rows={10} />;
```

### Empty Pattern (All Pages)
```tsx
if (!data?.data?.length) {
  return (
    <EmptyState
      icon={<IconName className="h-12 w-12" />}
      title="No [Entity]s"
      description="Description text."
      action={<Button onClick={openCreate}>Create [Entity]</Button>}
    />
  );
}
```

### Error Pattern (All Pages)
```tsx
// In ErrorFallback:
<button onClick={resetErrorBoundary}>Try again</button>

// In mutation onError:
onError: (err: ApiError) => {
  showToast(err.message, "error");
}
```

### Unauthorized Pattern (All Pages)
```tsx
// On 403 response:
showToast("Access denied", "error");
router.push("/dashboard");
```

### Responsive Pattern (All Pages)
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {items.map(item => <Card key={item.id} />)}
</div>
```

### Accessibility Pattern (All Pages)
```tsx
// Interactive elements:
<Button aria-label="Create announcement">Create</Button>
// Status displays:
<Badge aria-label={`Status: ${status}`}>{status}</Badge>
// Tables:
<Table aria-label="Performance scores">
// Charts:
<div role="img" aria-label="Performance trends over 6 months">
```

---

## P5.10 UI State Summary Matrix

| Page | Loading | Empty | Error | Unauthorized | Responsive | Accessible |
|------|---------|-------|-------|-------------|-----------|-----------|
| Performance Scores | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Announcements (Admin) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Announcements (Employee) | ✅ | ✅ | ✅ | N/A | ✅ | ✅ |
| Documents | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Export Config | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Reports (Enhanced) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Owner Dashboard | ✅ | ✅ | ✅ | N/A | ✅ | ✅ |
| Event Replay | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

*End of PATCH 1-5. This document remains the authoritative architecture plan for Phase 4.2 Step 8. No implementation permitted until approved.*

---

# PATCH 6 — Frontend Event Flow Matrix

> Complete CQRS lifecycle for every frontend mutation. User Action → Hook → API → Service → DB → Event → Projector → Read Model → Cache → UI.

---

## P6.1 Event Flow — Performance Scores

### Calculate Score

```
User clicks "Calculate Score"
  ↓
useCalculateScore()
  ↓
POST /performance-scores/calculate
  ↓
PerformanceService.calculateScore()
  ↓
PerformanceScore created (Prisma transaction)
  ↓
PERFORMANCE_SCORE_CALCULATED (published inside transaction)
  ↓
├── PerformanceProjector → upserts PerformanceTrendSnapshot
└── DashboardPerformanceProjector → upserts DashboardKpiSnapshot (avgPerformanceScore, topPerformers)
  ↓
invalidateQueries(["performance-scores"])
invalidateQueries(["performance-scores", "leaderboard"])
invalidateQueries(["performance-scores", "trends"])
  ↓
Score list refreshes, Leaderboard refreshes, Trends chart refreshes, Owner Dashboard KPI refreshes
```

**Verification:**
- ✅ Backend endpoint exists: `POST /performance-scores/calculate`
- ✅ Domain event exists: `PERFORMANCE_SCORE_CALCULATED`
- ✅ Projector exists: `PerformanceProjector`, `DashboardPerformanceProjector`
- ✅ Read model exists: `PerformanceTrendSnapshot`, `DashboardKpiSnapshot`
- ✅ Cache invalidation documented
- ✅ UI refresh documented

---

### Rate Employee

```
User clicks "Submit Rating"
  ↓
useRateEmployee()
  ↓
POST /performance-scores/rate
  ↓
PerformanceService.rateEmployee()
  ↓
ManagerRating created + PerformanceScore recalculated (Prisma transaction)
  ↓
MANAGER_RATING_RECORDED (published inside transaction)
  ↓
├── PerformanceProjector → upserts PerformanceTrendSnapshot (updated composite score)
└── DashboardPerformanceProjector → upserts DashboardKpiSnapshot (avgPerformanceScore, topPerformers)
  ↓
invalidateQueries(["performance-scores"])
invalidateQueries(["performance-scores", "leaderboard"])
invalidateQueries(["performance-scores", id])
  ↓
Score list refreshes, Leaderboard refreshes, Specific score detail refreshes, Owner Dashboard KPI refreshes
```

**Verification:**
- ✅ Backend endpoint exists: `POST /performance-scores/rate`
- ✅ Domain event exists: `MANAGER_RATING_RECORDED`
- ✅ Projector exists: `PerformanceProjector`, `DashboardPerformanceProjector`
- ✅ Read model exists: `PerformanceTrendSnapshot`, `DashboardKpiSnapshot`
- ✅ Cache invalidation documented
- ✅ UI refresh documented

---

### Recalculate Score

```
User clicks "Recalculate"
  ↓
useRecalculateScore()
  ↓
POST /performance-scores/recalculate
  ↓
PerformanceService.recalculateScore() → delegates to calculateScore()
  ↓
PerformanceScore updated (Prisma transaction)
  ↓
PERFORMANCE_SCORE_CALCULATED (published inside transaction)
  ↓
├── PerformanceProjector → upserts PerformanceTrendSnapshot
└── DashboardPerformanceProjector → upserts DashboardKpiSnapshot
  ↓
invalidateQueries(["performance-scores"])
invalidateQueries(["performance-scores", "leaderboard"])
invalidateQueries(["performance-scores", "trends"])
  ↓
Score list refreshes, Leaderboard refreshes, Trends chart refreshes
```

**Verification:**
- ✅ Backend endpoint exists: `POST /performance-scores/recalculate`
- ✅ Domain event exists: `PERFORMANCE_SCORE_CALCULATED` (delegates to calculateScore)
- ✅ Projector exists: Same as Calculate Score
- ✅ Read model exists: Same as Calculate Score
- ✅ Cache invalidation documented
- ✅ UI refresh documented

---

## P6.2 Event Flow — Announcements

### Create Announcement

```
User clicks "Create Announcement"
  ↓
useCreateAnnouncement()
  ↓
POST /announcements
  ↓
AnnouncementService.create()
  ↓
Announcement created with status DRAFT (Prisma transaction)
  ↓
ANNOUNCEMENT_CREATED (published inside transaction)
  ↓
⚠️ NO PROJECTOR CONSUMES THIS EVENT
  ↓
invalidateQueries(["announcements"])
  ↓
Announcement list refreshes (reads directly from Announcement table)
```

**Verification:**
- ✅ Backend endpoint exists: `POST /announcements`
- ✅ Domain event exists: `ANNOUNCEMENT_CREATED`
- ⚠️ **NO PROJECTOR** — event is published but not consumed by any `@OnEvent` handler
- ⚠️ **NO READ MODEL** — no dedicated read model; UI reads directly from `Announcement` table
- ✅ Cache invalidation documented
- ✅ UI refresh documented

**Architectural Note:** This mutation bypasses the CQRS read model pattern. The event is written to the outbox but has no projector. The frontend reads directly from the write model (Announcement table). This is acceptable for simple CRUD but means the event serves only as an audit trail, not as a projection trigger.

---

### Publish Announcement

```
User clicks "Publish"
  ↓
usePublishAnnouncement()
  ↓
POST /announcements/publish
  ↓
AnnouncementService.publish()
  ↓
Announcement status updated DRAFT → PUBLISHED (Prisma transaction)
  ↓
ANNOUNCEMENT_PUBLISHED (published inside transaction)
  ↓
⚠️ NO PROJECTOR CONSUMES THIS EVENT
  ↓
invalidateQueries(["announcements"])
invalidateQueries(["announcements", id])
  ↓
Announcement list refreshes, Announcement detail refreshes
```

**Verification:**
- ✅ Backend endpoint exists: `POST /announcements/publish`
- ✅ Domain event exists: `ANNOUNCEMENT_PUBLISHED`
- ⚠️ **NO PROJECTOR** — same pattern as create
- ⚠️ **NO READ MODEL** — reads from Announcement table
- ✅ Cache invalidation documented
- ✅ UI refresh documented

---

### Archive Announcement

```
User clicks "Archive"
  ↓
useArchiveAnnouncement()
  ↓
POST /announcements/archive
  ↓
AnnouncementService.archive()
  ↓
Announcement status updated PUBLISHED → ARCHIVED (Prisma transaction)
  ↓
ANNOUNCEMENT_ARCHIVED (published inside transaction)
  ↓
⚠️ NO PROJECTOR CONSUMES THIS EVENT
  ↓
invalidateQueries(["announcements"])
invalidateQueries(["announcements", id])
  ↓
Announcement list refreshes, Announcement detail refreshes
```

**Verification:**
- ✅ Backend endpoint exists: `POST /announcements/archive`
- ✅ Domain event exists: `ANNOUNCEMENT_ARCHIVED`
- ⚠️ **NO PROJECTOR**
- ⚠️ **NO READ MODEL**
- ✅ Cache invalidation documented
- ✅ UI refresh documented

---

### Read Announcement (Employee)

```
Employee clicks "Mark as Read"
  ↓
useReadAnnouncement(id)
  ↓
POST /announcements/:id/read
  ↓
AnnouncementReceiptService.markRead()
  ↓
AnnouncementReceipt created (Prisma transaction)
  ↓
ANNOUNCEMENT_READ (published inside transaction)
  ↓
⚠️ NO PROJECTOR CONSUMES THIS EVENT
  ↓
invalidateQueries(["announcements", "my"])
invalidateQueries(["announcements", id])
  ↓
My Announcements list refreshes, Announcement detail refreshes
```

**Verification:**
- ✅ Backend endpoint exists: `POST /announcements/:id/read`
- ✅ Domain event exists: `ANNOUNCEMENT_READ`
- ⚠️ **NO PROJECTOR**
- ⚠️ **NO READ MODEL** — reads from AnnouncementReceipt table
- ✅ Cache invalidation documented
- ✅ UI refresh documented

---

### Acknowledge Announcement (Employee)

```
Employee clicks "Acknowledge"
  ↓
useAcknowledgeAnnouncement(id)
  ↓
POST /announcements/:id/acknowledge
  ↓
AnnouncementReceiptService.acknowledge()
  ↓
AnnouncementReceipt updated with acknowledgedAt (Prisma transaction)
  ↓
ANNOUNCEMENT_ACKNOWLEDGED (published inside transaction)
  ↓
⚠️ NO PROJECTOR CONSUMES THIS EVENT
  ↓
invalidateQueries(["announcements", "my"])
invalidateQueries(["announcements", id])
invalidateQueries(["announcements", id, "receipts"])
  ↓
My Announcements list refreshes, Announcement detail refreshes, Receipts dialog refreshes
```

**Verification:**
- ✅ Backend endpoint exists: `POST /announcements/:id/acknowledge`
- ✅ Domain event exists: `ANNOUNCEMENT_ACKNOWLEDGED`
- ⚠️ **NO PROJECTOR**
- ⚠️ **NO READ MODEL** — reads from AnnouncementReceipt table
- ✅ Cache invalidation documented
- ✅ UI refresh documented

---

## P6.3 Event Flow — Documents

### Register Document

```
User clicks "Register Document"
  ↓
useRegisterDocument()
  ↓
POST /documents
  ↓
DocumentRegistryService.register()
  ↓
DocumentRegistry created (Prisma transaction)
  ↓
DOCUMENT_UPLOADED (published inside transaction)
  ↓
⚠️ NO PROJECTOR CONSUMES THIS EVENT
  ↓
invalidateQueries(["documents"])
  ↓
Document list refreshes (reads directly from DocumentRegistry table)
```

**Verification:**
- ✅ Backend endpoint exists: `POST /documents`
- ✅ Domain event exists: `DOCUMENT_UPLOADED`
- ⚠️ **NO PROJECTOR** — event published but not consumed
- ⚠️ **NO READ MODEL** — UI reads directly from write model
- ✅ Cache invalidation documented
- ✅ UI refresh documented

---

### Log Document Access

```
User clicks "Download"
  ↓
useLogDocumentAccess()
  ↓
POST /documents/access
  ↓
DocumentAccessService.logAccess()
  ↓
DocumentAccessLog created (Prisma transaction)
  ↓
DOCUMENT_ACCESSED (published inside transaction)
  ↓
⚠️ NO PROJECTOR CONSUMES THIS EVENT
  ↓
invalidateQueries(["documents", id, "access-logs"])
invalidateQueries(["documents", id, "access-stats"])
  ↓
Access logs table refreshes, Access stats card refreshes
```

**Verification:**
- ✅ Backend endpoint exists: `POST /documents/access`
- ✅ Domain event exists: `DOCUMENT_ACCESSED`
- ⚠️ **NO PROJECTOR**
- ⚠️ **NO READ MODEL** — reads from DocumentAccessLog table
- ✅ Cache invalidation documented
- ✅ UI refresh documented

---

### Delete Document

```
User clicks "Delete" → confirms
  ↓
useDeleteDocument()
  ↓
POST /documents/:id/delete
  ↓
DocumentRegistryService.delete()
  ↓
DocumentRegistry status updated to DELETED (Prisma transaction)
  ↓
DOCUMENT_DELETED (published inside transaction)
  ↓
⚠️ NO PROJECTOR CONSUMES THIS EVENT
  ↓
invalidateQueries(["documents"])
invalidateQueries(["documents", id])
  ↓
Document list refreshes (DELETED documents filtered out by query)
```

**Verification:**
- ✅ Backend endpoint exists: `POST /documents/:id/delete`
- ✅ Domain event exists: `DOCUMENT_DELETED`
- ⚠️ **NO PROJECTOR**
- ⚠️ **NO READ MODEL** — reads from DocumentRegistry table
- ✅ Cache invalidation documented
- ✅ UI refresh documented

---

## P6.4 Event Flow — Export Config

### Create Export Config

```
User clicks "Create Configuration"
  ↓
useCreateExportConfig()
  ↓
POST /reports/export-configs
  ↓
ExportConfigService.create()
  ↓
ExportConfig created (Prisma write)
  ↓
⚠️ NO DOMAIN EVENT PUBLISHED
  ↓
invalidateQueries(["export-configs"])
  ↓
Export config list refreshes (reads directly from ExportConfig table)
```

**Verification:**
- ✅ Backend endpoint exists: `POST /reports/export-configs`
- ❌ **NO DOMAIN EVENT** — ExportConfigService does not use GovernanceEventPublisher
- ❌ **NO PROJECTOR**
- ❌ **NO READ MODEL** — pure CRUD, no CQRS
- ✅ Cache invalidation documented
- ✅ UI refresh documented

**Architectural Note:** Export config is a pure CRUD service with no event publishing. This is acceptable for configuration data that doesn't need cross-module projection.

---

### Update Export Config

```
User clicks "Save Changes"
  ↓
useUpdateExportConfig()
  ↓
PUT /reports/export-configs/:id
  ↓
ExportConfigService.update()
  ↓
ExportConfig updated (Prisma write)
  ↓
⚠️ NO DOMAIN EVENT PUBLISHED
  ↓
invalidateQueries(["export-configs"])
invalidateQueries(["export-configs", id])
  ↓
Export config list refreshes, Config detail refreshes
```

**Verification:**
- ✅ Backend endpoint exists: `PUT /reports/export-configs/:id`
- ❌ **NO DOMAIN EVENT**
- ❌ **NO PROJECTOR**
- ❌ **NO READ MODEL**
- ✅ Cache invalidation documented
- ✅ UI refresh documented

---

### Delete Export Config

```
User clicks "Delete" → confirms
  ↓
useDeleteExportConfig()
  ↓
DELETE /reports/export-configs/:id
  ↓
ExportConfigService.remove()
  ↓
ExportConfig deleted (Prisma delete)
  ↓
⚠️ NO DOMAIN EVENT PUBLISHED
  ↓
invalidateQueries(["export-configs"])
  ↓
Export config list refreshes
```

**Verification:**
- ✅ Backend endpoint exists: `DELETE /reports/export-configs/:id`
- ❌ **NO DOMAIN EVENT**
- ❌ **NO PROJECTOR**
- ❌ **NO READ MODEL**
- ✅ Cache invalidation documented
- ✅ UI refresh documented

---

## P6.5 Event Flow — Reports

### Create Report Export

```
User selects format and clicks "Export"
  ↓
useCreateReportExport()
  ↓
POST /reports/exports
  ↓
ExportOrchestrationService.createExport()
  ↓
ReportExport record created → Engine generates buffer → Record updated with status
  ↓
⚠️ NO DOMAIN EVENT PUBLISHED (synchronous orchestration)
  ↓
invalidateQueries(["report-exports"])
invalidateQueries(["export-history"])
  ↓
Recent exports list refreshes, Export history refreshes
  ↓
Download: response.bufferBase64 → decode → Blob → browser download
```

**Verification:**
- ✅ Backend endpoint exists: `POST /reports/exports`
- ❌ **NO DOMAIN EVENT** — ExportOrchestrationService is synchronous, not event-driven
- ❌ **NO PROJECTOR**
- ⚠️ **NO READ MODEL** — reads directly from ReportExport table
- ✅ Cache invalidation documented
- ✅ UI refresh documented

**Architectural Note:** The export pipeline is intentionally synchronous (fire-and-forget). It writes directly to the ReportExport table and returns the buffer. No CQRS projection needed because the export result is the buffer itself, not a derived read model.

---

## P6.6 Event Flow — Event Replay

### Replay Event

```
Owner clicks "Replay Event"
  ↓
useReplayEvent()
  ↓
POST /internal/events/:id/replay
  ↓
EventsReplayController.replayEvent()
  ↓
DomainEvent status reset to PENDING (Prisma update)
  ↓
OutboxDispatchWorker picks up PENDING event on next cycle (≤10s)
  ↓
Event re-dispatched through EventEmitter → original handlers re-executed
  ↓
invalidateQueries(["security"])
  ↓
Security events list refreshes
```

**Verification:**
- ✅ Backend endpoint exists: `POST /internal/events/:id/replay`
- ✅ Domain event exists (re-queued, not newly published)
- ✅ Projector exists (original projectors re-consume the event)
- ✅ Read model exists (original read models re-updated)
- ✅ Cache invalidation documented
- ✅ UI refresh documented

---

### Replay Handler

```
Owner clicks "Replay Handler"
  ↓
useReplayHandler()
  ↓
POST /internal/events/handlers/:eventId/:handlerName/replay
  ↓
EventsReplayController.replayHandler()
  ↓
Specific ProcessedEvent status reset → handler re-invoked
  ↓
invalidateQueries(["security"])
  ↓
Security events list refreshes
```

**Verification:**
- ✅ Backend endpoint exists: `POST /internal/events/handlers/:eventId/:handlerName/replay`
- ✅ Handler re-execution documented
- ✅ Cache invalidation documented
- ✅ UI refresh documented

---

## P6.7 CQRS Compliance Summary

### Mutations WITH Full CQRS Flow

| Mutation | Event | Projector | Read Model | Status |
|----------|-------|-----------|------------|--------|
| Calculate Score | `PERFORMANCE_SCORE_CALCULATED` | `PerformanceProjector`, `DashboardPerformanceProjector` | `PerformanceTrendSnapshot`, `DashboardKpiSnapshot` | ✅ Full CQRS |
| Rate Employee | `MANAGER_RATING_RECORDED` | `PerformanceProjector`, `DashboardPerformanceProjector` | `PerformanceTrendSnapshot`, `DashboardKpiSnapshot` | ✅ Full CQRS |
| Recalculate Score | `PERFORMANCE_SCORE_CALCULATED` | `PerformanceProjector`, `DashboardPerformanceProjector` | `PerformanceTrendSnapshot`, `DashboardKpiSnapshot` | ✅ Full CQRS |

### Mutations WITH Event but NO Projector (Audit-Only)

| Mutation | Event | Projector | Read Model | Status |
|----------|-------|-----------|------------|--------|
| Create Announcement | `ANNOUNCEMENT_CREATED` | ❌ None | ❌ None | ⚠️ Audit-only |
| Publish Announcement | `ANNOUNCEMENT_PUBLISHED` | ❌ None | ❌ None | ⚠️ Audit-only |
| Archive Announcement | `ANNOUNCEMENT_ARCHIVED` | ❌ None | ❌ None | ⚠️ Audit-only |
| Read Announcement | `ANNOUNCEMENT_READ` | ❌ None | ❌ None | ⚠️ Audit-only |
| Acknowledge Announcement | `ANNOUNCEMENT_ACKNOWLEDGED` | ❌ None | ❌ None | ⚠️ Audit-only |
| Register Document | `DOCUMENT_UPLOADED` | ❌ None | ❌ None | ⚠️ Audit-only |
| Log Document Access | `DOCUMENT_ACCESSED` | ❌ None | ❌ None | ⚠️ Audit-only |
| Delete Document | `DOCUMENT_DELETED` | ❌ None | ❌ None | ⚠️ Audit-only |

### Mutations WITHOUT Event (Pure CRUD / Synchronous)

| Mutation | Event | Projector | Read Model | Status |
|----------|-------|-----------|------------|--------|
| Create Export Config | ❌ None | ❌ None | ❌ None | Pure CRUD |
| Update Export Config | ❌ None | ❌ None | ❌ None | Pure CRUD |
| Delete Export Config | ❌ None | ❌ None | ❌ None | Pure CRUD |
| Create Report Export | ❌ None | ❌ None | ❌ None | Synchronous |
| Replay Event | Re-queued | Original | Original | ✅ Replay |
| Replay Handler | Re-executed | Original | Original | ✅ Replay |

---

## P6.8 Architectural Observations

### Observation 1: PerformanceScore → Dashboard KPI

**Observation:** `PerformanceScore` mutations publish events that are consumed by `DashboardPerformanceProjector`, which upserts `DashboardKpiSnapshot.avgPerformanceScore` and `topPerformers`. The owner dashboard reads from `DashboardKpiSnapshot`.

**Reason:** `calculateScore()` and `rateEmployee()` write to `PerformanceScore` table and publish `PERFORMANCE_SCORE_CALCULATED` / `MANAGER_RATING_RECORDED`. The `DashboardPerformanceProjector` listens to both, aggregates `PerformanceScore` table, and writes to `DashboardKpiSnapshot`. The `OwnerDashboardService.getKpiSnapshot()` reads from `DashboardKpiSnapshot`.

**Expected Behaviour:** Full CQRS flow — event → projector → read model → dashboard.

**Requires Change:** NO — verified as correct.

**Status:** Verified

---

### Observation 2: Announcement Read / Acknowledge Events Have No Projectors

**Observation:** `ANNOUNCEMENT_READ` and `ANNOUNCEMENT_ACKNOWLEDGED` events are published to the outbox but no `@OnEvent` handler consumes them.

**Reason:** Audit events intentionally have no projector. The frontend reads directly from `AnnouncementReceipt` table. Cache invalidation on mutation success ensures UI consistency.

**Expected Behaviour:** Audit trail only — no projection required.

**Requires Change:** NO

**Status:** No Change Required

---

### Observation 3: Document Access Events Have No Projectors

**Observation:** `DOCUMENT_ACCESSED` event is published but no projector consumes it.

**Reason:** Audit-only event. The frontend reads directly from `DocumentAccessLog` table.

**Expected Behaviour:** Audit trail only — no projection required.

**Requires Change:** NO

**Status:** No Change Required

---

### Observation 4: Export Configuration CRUD Has No Domain Events

**Observation:** `ExportConfigService` is pure Prisma CRUD with no `GovernanceEventPublisher` injection.

**Reason:** Local CRUD, no downstream bounded context. Export config is configuration data, not business-critical domain state.

**Expected Behaviour:** Plain CRUD — no event publishing required.

**Requires Change:** NO

**Status:** No Change Required

---

### Observation 5: Export Pipeline Is Synchronous

**Observation:** `ExportOrchestrationService` writes directly to `ReportExport` table and returns buffer synchronously. No domain events published.

**Reason:** Synchronous orchestration by design. The export result (buffer) is returned directly in the API response. No CQRS projection needed.

**Expected Behaviour:** Request-response operation — not event-driven.

**Requires Change:** NO

**Status:** No Change Required

---

## P6.9 Event Flow Diagram — Complete

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND MUTATIONS                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Performance Scores          Announcements          Documents       │
│  ├── Calculate Score         ├── Create             ├── Register    │
│  ├── Rate Employee           ├── Publish            ├── Log Access  │
│  └── Recalculate             ├── Archive            └── Delete      │
│                              ├── Read                                │
│                              └── Acknowledge                         │
│                                                                     │
│  Export Config               Reports               Event Replay     │
│  ├── Create                  └── Create Export      ├── Replay      │
│  ├── Update                                          └── Handler    │
│  └── Delete                                                          │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                        DOMAIN EVENTS                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ✅ WITH PROJECTORS               ⚠️ AUDIT-ONLY (no projector)     │
│  ├── PERFORMANCE_SCORE_CALCULATED ├── ANNOUNCEMENT_CREATED          │
│  └── MANAGER_RATING_RECORDED      ├── ANNOUNCEMENT_PUBLISHED        │
│                                    ├── ANNOUNCEMENT_ARCHIVED         │
│  ❌ NO EVENTS                      ├── ANNOUNCEMENT_READ             │
│  ├── Create Export Config          ├── ANNOUNCEMENT_ACKNOWLEDGED     │
│  ├── Update Export Config          ├── DOCUMENT_UPLOADED             │
│  ├── Delete Export Config          ├── DOCUMENT_ACCESSED             │
│  └── Create Report Export          └── DOCUMENT_DELETED              │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                        PROJECTORS                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PerformanceProjector           DashboardPerformanceProjector        │
│  → PerformanceTrendSnapshot     → DashboardKpiSnapshot              │
│                                                                     │
│  (8 communication events have NO projectors)                        │
│  (3 export config mutations have NO events)                         │
│  (1 report export mutation has NO events)                           │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                        READ MODELS                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PerformanceTrendSnapshot       DashboardKpiSnapshot                │
│  (updated by projectors)        (updated by 7 projectors)           │
│                                                                     │
│  Announcement*                  DocumentRegistry*                   │
│  (read directly from table)     (read directly from table)          │
│                                                                     │
│  ReportExport*                  ExportConfig*                       │
│  (read directly from table)     (read directly from table)          │
│                                                                     │
│  * = no dedicated read model; UI reads from write table             │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                        CACHE INVALIDATION                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  All mutations: invalidateQueries() on related query keys           │
│  Performance: ["performance-scores"], [..., "leaderboard"],         │
│               [..., "trends"], [..., id]                            │
│  Announcements: ["announcements"], ["announcements", "my"],         │
│                 ["announcements", id], [..., "receipts"]            │
│  Documents: ["documents"], ["documents", id],                       │
│             [..., "access-logs"], [..., "access-stats"]             │
│  Export Config: ["export-configs"], ["export-configs", id]          │
│  Reports: ["report-exports"], ["export-history"]                    │
│  Security: ["security"]                                             │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                        UI REFRESH                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  React Query automatically re-renders components on cache           │
│  invalidation. No manual refresh needed.                            │
│                                                                     │
│  Owner Dashboard: also refreshes via ["owner", "kpi"] when          │
│  DashboardKpiSnapshot is updated by PerformanceProjector.           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

*End of PATCH 6. This document remains the authoritative architecture plan for Phase 4.2 Step 8. No implementation permitted until approved.*
