# Automation Rules Engine

## Why this exists

Before this, every "notify someone when X happens" request became a new
hardcoded cron file (`renewal-reminder-cron.ts`, `lead-pool-sla-cron.ts`,
`monthly-report-cron.ts`). That doesn't scale as an organization adds roles,
branches, and compliance requirements — each new escalation rule meant a
code change and a deploy.

The Automation Rules engine turns that into config: a CEO/Director creates a
rule in **Admin → Configuration → Automation Rules** (`automation.manage`
permission), and it runs on its own — no code change, no deploy. This is
deliberately scoped to be a real, working engine for the triggers that exist
today, not a generic no-code platform — see "Extending" below for how to add
more.

## How it works

```
crm_automation_rules (config)          crm_automation_rule_runs (audit log)
┌──────────────────────────┐           ┌──────────────────────────────┐
│ trigger_type              │           │ rule_id, entity_type,         │
│ trigger_config (JSON)     │  ──run──▶ │ entity_id, run_date,          │
│ conditions (JSON)         │           │ status, detail                │
│ actions (JSON)            │           │ (one row per entity per rule  │
│ is_active                 │           │  per day — prevents re-firing)│
└──────────────────────────┘           └──────────────────────────────┘
```

Every 30 minutes (`src/lib/automation-rules-cron.ts`, registered in
`src/instrumentation.ts`), `AutomationRulesService.runScheduledRules()`:

1. Loads every **active** rule.
2. For each rule's trigger type, collects the matching entities from the
   real data (e.g. leads with no contact in N days).
3. Filters them through the rule's `conditions` (if any).
4. For each match not already logged today (`crm_automation_rule_runs`
   dedup), executes the rule's `actions` and logs the result.

The same method powers the admin UI's **"Preview (dry run)"** button
(`dryRun: true` — reports matches without notifying anyone or writing to the
log) and **"Run now"** (forces an immediate real run instead of waiting for
the next cron tick).

## Trigger types (v1)

| Trigger | Entity | Fires when | Config |
|---|---|---|---|
| `lead.no_contact` | lead | An assigned lead (not marked lost) has no remark newer than N days | `days` (default 3) |
| `payment.overdue` | opportunity payment | `crm_opportunity_payments.dueDate` has passed and status isn't completed/paid/failed/refunded | none |
| `case.visa_expiring` | case decision | `crm_case_decisions.expiryDate` (an approved visa/residence/permit issuance, from the Case Milestones module — see docs/CASE_MILESTONES.md) falls within N days | `days` (default 60) |

Both are **scheduled** (cron-polled), not event-driven — see "Adding an
event-based trigger" below for why `lead.created` / `lead.stage_changed`
aren't included yet.

## Action types (v1)

| Action | Does |
|---|---|
| `notify_assignee` | In-app notification (via `ModuleNotificationService.sendAutomationAlert`) to the lead/payment's assigned employee |
| `notify_manager` | Same, but to the assignee's `manager_id` (skipped if none on file) |
| `create_follow_up` | Inserts a `crm_follow_up_reminders` row assigned to the owner, due immediately |

Every action degrades gracefully: no assignee → skipped (not an error); no
manager → skipped. Nothing throws for a normal "this record has no owner"
case — only genuine failures (DB errors) mark the run `failed`.

**No email/SMS action yet** — this codebase has no outbound email/SMS
provider wired up (`ModuleNotificationService.dispatchChannel` already
no-ops email/SMS unless `EMAIL_PROVIDER`/`SMS_PROVIDER` env vars are set).
Once one is added, a new action type plugs into the same `executeActions`
switch in `automation-rules-service.ts`.

## Files

- `src/services/automation-rules-service.ts` — the engine: trigger/action
  definitions, entity collectors, condition evaluator, action executor,
  CRUD, `runScheduledRules()`.
- `src/lib/automation-rules-cron.ts` — node-cron wrapper (mirrors
  `renewal-reminder-cron.ts` exactly).
- `src/app/api/admin/automation-rules/` — REST API (`route.ts` list/create,
  `[id]/route.ts` update/delete, `runs/route.ts` audit log,
  `run-now/route.ts` manual/dry-run trigger).
- `src/app/admin/automation-rules/page.tsx` — admin UI.
- Tables `crm_automation_rules` / `crm_automation_rule_runs` are created
  lazily by `AutomationRulesService.ensureTables()` on first use (same
  pattern as `RenewalReminderService.ensureNotificationLogTable()` — safe
  here because nothing else has a foreign key into these tables).

## Permission

`automation.manage` — added to `adminPermissions` in
`scripts/seed-roles-permissions.js`, so **CEO** and **Director of Sales**
(everything CEO can do except deletes) have it by default. No other role
does; run `npm run db:setup` after changing role grants.

## Extending

**Adding a new scheduled trigger** (e.g. "visa expiring in N days"):
1. Add its id/label/config fields to `TRIGGER_DEFINITIONS`.
2. Write a `collectX()` method returning rows with at least `assigneeId` and
   (if you want `create_follow_up` to work) `leadId`.
3. Add a branch in `runScheduledRules()`'s entity-collection `if`.

**Adding a new action type**: add it to `ACTION_DEFINITIONS` and a `case` in
`executeActions()`.

**Adding an event-based trigger** (`lead.created`, `lead.stage_changed`):
these were deliberately NOT wired into `src/app/api/leads/route.ts` in v1 —
that file is 1000+ lines with multiple success paths (single create, Excel
bulk import), and hooking it safely means reading all of them first, not
guessing under time pressure. When you do this: add a
`AutomationRulesService.fireEvent(triggerType, context)` method (evaluate
active rules of that trigger type against the given context, same
condition/action/logging pipeline `runScheduledRules` already uses — the
collector step is skipped since the entity is already in hand), then call it
once at each success point in the route, e.g.:

```ts
await AutomationRulesService.fireEvent('lead.created', { leadId: newLead.id, assigneeId: newLead.assignTo, branchId: newLead.branch, /* ... */ });
```

## Known limitations (by design, not oversight)

- Conditions are a flat AND of `{field, operator, value}` triples — no
  OR/grouping. Sufficient for "priority = high" style filters; a real
  expression tree wasn't justified for two trigger types.
- No branch scoping in the UI yet (`crm_automation_rules` has no branch
  column) — moot while the company operates a single branch (see
  `migrations/20260916_dubai_only_branch.sql`); add one if that changes.
- Scheduled triggers poll every 30 minutes — near-real-time, not
  instantaneous. Fine for "no contact in N *days*" and "overdue payment";
  would need lowering (or converting to event-based) for anything requiring
  minute-level response.
