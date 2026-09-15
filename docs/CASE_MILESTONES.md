# Case Milestones

## Why this exists

This CRM already has an extensive operations/case-processing system: 20
program-specific wizards (`src/app/admin/leads/*-operations-wizard.tsx` —
skill-canada, eip-canada, student-visa, work-permit, business-immigration
variants, CBI, visit-visa, etc.), a shared shell
(`OperationsWizardShell.tsx`), per-module JSON stage storage
(`crm_operation_stage_data`), and a formal pre-case onboarding state machine
(`crm-workflow-service.ts` / `crm_opportunity_workflow_reviews`: finance
review → compliance review → case activation).

The gap: of those 20 wizards, only **skill-canada** (Express Entry) has
structured fields for government reference numbers (AOR/ITA), a decision,
visa-grant details, and a closure reason. The other 19 have only a free-text
"Application Status" dropdown, and **none** of the 20 — including
skill-canada — have any structure for RFE (request for additional evidence)
tracking or interview scheduling. This means:

- No way to query "which cases have a government reference number on file"
  across programs.
- No way to see upcoming interviews or overdue RFE responses in one place.
- No structured record of what visa/permit was actually issued, or when it
  expires (so no way to alert anyone before a client's residency lapses).
- Inconsistent/missing case-closure reasons outside skill-canada.

## What was built

Six new tables (`migrations/20260920_case_milestones.sql`), all keyed by
`(module, leadId, opportunityId)` so they attach to a case regardless of
which of the 20 wizards is handling it:

| Table | Captures |
|---|---|
| `crm_case_eligibility_assessments` | A formal eligibility check recorded **against an actual case** — distinct from `crm_immigration_tool_results` (the pre-sales screening calculator, tied only to a lead, Canada/Australia only, explicitly "not official"). |
| `crm_case_references` | Government reference/tracking numbers (AOR, ITA, application number, case number, etc.) — generalizes skill-canada's ITA/AOR fields to every program. |
| `crm_case_rfe_requests` | Requests for additional evidence: what was asked, response due date, submission date, status. Did not exist anywhere before. |
| `crm_case_interviews` | Visa interviews, biometrics appointments, landing interviews — type, schedule, mode, outcome. Did not exist anywhere before. |
| `crm_case_decisions` | The government decision (approved/refused/withdrawn) **and** what was issued as a result (document type, number, issue date, expiry date) — generalizes skill-canada's `visa-grant` stage. |
| `crm_case_closures` | One structured closure reason per case (`visa_approved_completed` / `client_withdrew` / `refused` / `non_payment` / `other`) — generalizes skill-canada's closure enum to every program; `UNIQUE(leadId, module)` enforces one closure per case. |

All six carry `leadId` (`FK → crm_forum_leads`, `ON DELETE RESTRICT` — you
cannot delete a lead with case history) and `opportunityId` (`FK →
crm_opportunities`, nullable, `ON DELETE SET NULL`), matching the same
RESTRICT/SET NULL reasoning as `migrations/20260914_core_fk_constraints.sql`.

**Explicitly not touched or reused**: `crm_pro_*` (10 tables) and
`hr-joining-exit-service.ts`. Those are internal UAE compliance for Inzeit's
**own** trade license/employees/owners (MOHRE codes, GDRFA establishment
numbers, WPS payroll) — structurally disconnected from client case data (no
`leadId`/`opportunityId` columns at all). Conflating the two would have been
a real design mistake; Case Milestones tables are scoped only to client
cases.

**Explicitly not a replacement for** `crm_operation_stage_data` — that stays
exactly as-is for each module's own bespoke stage fields (Personal,
Documents, ECA, Language, etc.). Case Milestones is an *addition* covering
the specific structured concepts every program needs but only one had.

## How it surfaces in the UI

One new tab, **"Case Milestones"** (`CaseMilestonesPanel.tsx`), injected
into `OperationsWizardShell.tsx` the same way the existing "Client
Documents" and "Chat" tabs already are. The panel has one section per table
(add/list/delete), matching `ClientDocumentsPanel.tsx`'s visual style.
Verified live (Playwright, logged in as a real employee) on `cbi-operations`
— tab renders, all 6 sections load, zero console errors.

**Actual coverage: 12 of the 20 wizards, not all 20.** `OperationsWizardShell`
is shared by business, business-canada, business-poland, business-uk,
business-usa, cbi, europe-cases, ict-canada, job-search, portugal-business,
skill-canada-pip, work, and work-permit — those 12 get the new tab
automatically. The other 8 (**eip-canada, germany-jobseeker, poland-visa,
rms, skill-australia, skill-canada, student-visa, visit-visa**) are bespoke,
hand-built React components that don't import the shared shell at all —
verified by checking each of the 20 `*-operations-wizard.tsx` files for an
`OperationsWizardShell` import. These happen to be exactly the deeper,
richer-stage modules the research called out, so they were the ones most
worth this structure — but reaching them means adding
`<CaseMilestonesPanel module={module} leadId={leadId}
opportunityId={opportunityId} />` as a new tab inside each file
individually (same shape of change already made once inside the shell), not
a single shared-code change. Not done here to avoid 8 individual,
unreviewed file edits under one pass; flagged so it isn't mistaken for full
coverage later.

## API

One generic, type-dispatched endpoint rather than six near-identical CRUD
routes:

- `GET /api/admin/operations/case-milestones?leadId=X` — returns all six
  categories for a lead in one response.
- `POST /api/admin/operations/case-milestones` — body `{ type, module,
  leadId, opportunityId, ...fields }`, where `type` is one of `eligibility`
  / `reference` / `rfe` / `interview` / `decision` / `closure`. Audit
  columns (`assessedBy`/`createdBy`/`closedBy`) are always set server-side
  from the authenticated user, never accepted from the request body.
- `PATCH /api/admin/operations/case-milestones/[id]?type=...` — partial
  update.
- `DELETE /api/admin/operations/case-milestones/[id]?type=...` — requires
  `operations.manage` (read/write actions only require `operations.view` OR
  `operations.manage`, matching the existing `client-documents` route's
  permission pattern).

All table/column names used in the dynamic SQL are drawn from a fixed
whitelist keyed by the validated `type` enum — never from arbitrary request
body keys — so this stays safe despite being generic.

## Automation

The Automation Rules engine (see `docs/AUTOMATION_RULES.md`) gained a third
trigger, `case.visa_expiring`, which scans `crm_case_decisions` for approved
issuances whose `expiryDate` falls within N days — this is the "renewal
tracking for a client's own visa" capability the research identified as
missing (as opposed to `pro-works`' renewal reminders, which are for the
company's own trade license/employee visas). Create a rule with this trigger
and a `notify_assignee` action to get automatic pre-expiry alerts with zero
new code.

## Known limitations / deliberate scope cuts

- **No cross-program report yet.** `ops-report` is shaped around Express
  Entry/skilled-migration ECA buckets and doesn't read these new tables. A
  "Case Milestones" report (upcoming interviews, overdue RFEs, expiring
  visas, closure-reason breakdown across all 20 programs) would be a
  natural next page, built on the same six tables — not built here to keep
  this change to schema + API + UI-tab, verified working end-to-end, rather
  than also inventing a new reporting page's design.
- **The 20 wizards' own stage fields are untouched.** This does not migrate
  skill-canada's existing AOR/ITA/visa-grant stage data into the new tables
  — that would be a data-migration project of its own (mapping 19
  differently-shaped JSON blobs), not a schema addition. New cases can use
  the new tables immediately; nothing was done to backfill history.
- **`src/lib/workflowManagement.ts`** (a fully-modeled, generic,
  document/dependency-aware workflow engine) was found during research to be
  dead code — not connected to the database, not reachable from any route.
  It was left untouched rather than resurrected or deleted, since neither
  action was asked for; it's flagged here so it isn't mistaken for a live
  system later.
