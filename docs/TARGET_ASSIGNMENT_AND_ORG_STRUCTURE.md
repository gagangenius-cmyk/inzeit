# Monthly Targets & Org Structure

Covers two related changes made together: the 9-role org restructuring (who
exists and who reports to whom) and the hierarchical Monthly Target
Assignment feature built on top of it.

## 1. The new role roster

The CRM's ~35-role legacy list has been retired down to 9 active
designations (`scripts/seed-roles-permissions.js`). Retired roles are
**deactivated (`crm_role.status = 0`), never deleted** - every historical
lead, remark, and payment that references an old `role_id` stays intact, and
any retired role can be reinstated by flipping its status back to 1.

| Role | Permission summary | Can delete? |
|---|---|---|
| CEO | Everything (`'all'`) | Yes |
| Director of Sales | Everything CEO has, except every `*.delete` permission | No |
| Team Leader | Company-wide leads/clients/ops visibility, assigns leads to Senior Immigration Advisors | No |
| Area Manager | Identical permissions to Team Leader; assigns leads to Immigration Advisors instead | No |
| Senior Immigration Advisor | Individual-contributor: own leads/appointments/agreements | No |
| Immigration Advisor | Same as Senior Immigration Advisor | No |
| HR | HR module only | Own HR records |
| Accounts | Finance module only (view/manage, payments, invoices) | No |
| Operations | Operations module only | No |

### Active roster seeded (`scripts/seed-employees.js`)

| Name | Username | Role | Reports to |
|---|---|---|---|
| Roopa Kainth | `Roopa` | CEO | — |
| Ujjwal Sahani | `Ujjwal` | Director of Sales | — |
| Mehak Riaz | `Mehak` | Team Leader | — |
| Ashutosh Pandey | `Ashutosh` | Area Manager | — |
| Aaron Paul | `Aaron` | Senior Immigration Advisor | Mehak Riaz |
| Rubeca Francis | `Rubeca` | Senior Immigration Advisor | Mehak Riaz |
| Harpreet Kaur | `Harpreet` | Immigration Advisor | Ashutosh Pandey |
| HR | `HR` | HR | — |
| Accounts | `Accounts` | Accounts | — |
| Operations | `Operations` | Operations | — |

Every account's password equals its username (this codebase's existing
convention - see `scripts/seed-employees.js`), e.g. `Roopa` / `Roopa`. **All
10 were seeded into the Dubai SZR branch** since no branch was specified per
person - move anyone to a different branch from Employees admin if that's
wrong for them.

All 33 previously-active employees not in this list (including the old CEO
account, all Branch Managers, all Counsellors/Sales staff, FOEs, etc.) were
**deactivated, not deleted** - `crm_employee.status = 0`. They can no longer
log in, but every lead/remark/payment/appointment they ever touched is
untouched in the database. Reactivate anyone via the Employees admin page
(or by editing their row directly) if this was too broad.

### The reporting hierarchy is `crm_employee.manager_id`

This column existed before but was essentially unused (no UI ever read or
wrote it). It's now the backbone of the org chart: Aaron and Rubeca's
`manager_id` points at Mehak's employee id; Harpreet's points at Ashutosh's.
Add more people to the org chart by setting their `manager_id` the same way
(via `scripts/seed-employees.js`'s `manager: 'username'` field, or directly).

### Code paths that had to learn the new role names

Several places in the codebase matched role names/types by hardcoded text
rather than an enum, so they needed updating alongside the roster itself, or
the retired "Branch Manager"/"FOE"/"Counsellor" tiers would silently stop
being recognized as managers/advisors anywhere those checks ran:

- `src/lib/roleChecks.ts` - `isFoeOrBranchManagerOrCeo`, `isBranchManagerOrCeo`,
  `isCounsellor`, `canViewAllBranches` now also match Team Leader/Area
  Manager/Immigration Advisor. New helper `isCeoOrDirectorOfSales` added for
  checks that must stay narrower than "sees all leads" (see §3).
- `src/lib/modulePermissions.ts` (`resolveModuleRoleKey`) - default-dashboard
  redirect logic.
- `src/app/api/leads/route.ts` - the main leads-list `canViewAll` whitelist.
- `src/lib/salesPerformanceData.ts`, `src/services/monthly-report-service.ts`,
  `src/app/api/reports/branch-performance/route.ts`,
  `src/components/transfer/LeadTransferManager.tsx` - reporting/notification
  role-name matching.

**Known residual gap**: a handful of *other* list endpoints
(`admin/invoices-payments`, `admin/ops-dashboard/summary`,
`admin/ops-follow-ups`, `admin/operations/search`, `admin/balance-payments`)
independently re-declare their own copy of the same "who sees everything"
whitelist rather than importing `canViewAllBranches` - these were not all
audited/updated. If a Team Leader/Area Manager reports one of those pages
looks branch-scoped instead of company-wide, that's why.

## 2. Company/branch rebrand

Alongside the role restructuring, the Dubai entity's registered trading name
was updated system-wide to **Global Navigator LLC FZ** (address: 606, Latifa
Towers, Trade Center 1, Sheikh Zayed Road, Dubai, UAE; phone +971 55 947
6936; email info@navigatorglobals.com):

- `scripts/seed-branches.js` - Dubai SZR branch record (also broadened the
  seeder's own UPDATE clause, which previously only synced `branch`/`region`
  on re-runs and silently dropped address/contact edits on an existing row).
- `src/lib/branchAgreementProfiles.ts` - Dubai's legal-agreement profile
  (name/address/contact line). Abu Dhabi/Kuwait/Qatar/Hyderabad's distinct
  registered entities were left untouched - no updated details were given
  for those.
- `src/lib/receiptTemplate.ts` - receipts now resolve their legal company
  name from `branchAgreementProfiles.ts` first (previously they used
  `crm_branch.name` directly, which could drift out of sync with the
  agreement's legal name - now both documents share one source of truth).
- `src/components/hr/DMCLettersModule.tsx` - HR letter letterhead, logo, and
  body-text company references.

## 3. Monthly Target Assignment

New table `crm_employee_targets` (self-provisioning, same
`CREATE TABLE IF NOT EXISTS` pattern as every other config table in this
codebase - see `src/lib/targetAssignment.ts`).

### Flow

```
Manager opens /admin/targets
        |
        v
Picks a starting person from the top-level org chart
(anyone with no manager: CEO, Director of Sales, Team Leader, Area Manager,
 HR, Accounts, Operations)
        |
        v
If that person has direct reports (crm_employee.manager_id), the UI shows
them as the next row - keeps drilling down until reaching whoever the
target is actually for (a manager can also target themselves directly)
        |
        v
Picks a target TYPE:
  - "New Leads"                    -> meetings / appointments / sales
                                       revenue targets for the month
  - "Balance Recovery / Collection" -> a single collection-amount target
        |
        v
Saves - POST /api/targets upserts one row keyed on
(employee_id, target_month, target_type), so re-saving the same
person+month+type updates rather than duplicates
        |
        v
Progress bars show "actual achieved so far" computed LIVE from existing
CRM data (never stored, never goes stale):
  - meetings     <- crm_meeting_schedules (user_id, meeting_date)
  - appointments <- appointments (counsilorid, done=1, date)
  - sales revenue <- crm_opportunities (assignedTo, status='won', createdAt)
                     joined to crm_forum_leads.payTotal
  - collection   <- crm_opportunity_payments (createdBy, paidAmount, paymentDate)
```

### Who can set targets vs. who can only view them

- **CEO and Director of Sales** can set a target for anyone in the company
  (`POST /api/targets`, gated by the `transfers.manage` permission) and can
  view every target that exists.
- **Team Leader / Area Manager** also hold `transfers.manage` (needed for
  their lead-assignment duties), so they can set targets too - but only for
  themselves and their own reporting subtree. Trying to view or set a target
  for someone outside their subtree (e.g. Team Leader Mehak looking at Area
  Manager Ashutosh's report Harpreet) returns a 403.
- **Individual advisors** (Senior Immigration Advisor / Immigration Advisor)
  can view their own targets and progress, but cannot create or edit any
  target (no `transfers.manage`).

This is deliberately a narrower check (`isCeoOrDirectorOfSales` in
`roleChecks.ts`) than the "sees complete leads" visibility Team Leader/Area
Manager get elsewhere in the app (`canViewAllBranches`) - seeing every lead
company-wide and seeing every other manager's private target-setting for
their own team are different concerns, and conflating them was caught and
fixed during testing (an earlier draft let Team Leader see Area Manager's
team's targets).

### API reference

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/targets/hierarchy` | Flat active-employee list (`id`, `name`, `roleName`, `managerId`) scoped to what the caller may see - the admin UI builds its cascading picker from this. |
| `GET` | `/api/targets?month=YYYY-MM&employeeId=&targetType=` | List targets, scoped to the caller's visibility. |
| `POST` | `/api/targets` | Upsert a target - body `{ employeeId, targetMonth, targetType, meetingsTarget?, appointmentsTarget?, salesRevenueTarget?, collectionTarget?, notes? }`. |
| `DELETE` | `/api/targets/:id` | Remove a target. |
| `GET` | `/api/targets/progress?employeeId=&month=YYYY-MM` | Live actual-vs-target numbers for one person/month. |

### Known gaps / future extension points

- No quarterly/yearly rollup view yet - only month-by-month.
- No notification when a target is set or when someone falls behind pace
  partway through the month (the existing `notifyUser`/`notifyRole` helpers
  in `src/lib/notify.ts` would be the natural place to add this).
- Meetings vs. appointments is the same distinction the round-robin
  documentation (`docs/LEAD_ASSIGNMENT_ROUND_ROBIN.md`) already flags as
  fuzzy in this schema - `crm_meeting_schedules.meeting_type` is the meeting's
  *purpose*, not a meeting/appointment category, so "meetings" here counts
  every row in that table regardless of type.
