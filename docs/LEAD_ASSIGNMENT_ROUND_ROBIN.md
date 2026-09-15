# Lead Assignment Rules & Round Robin

Enterprise-style automatic lead routing, modeled on Zoho CRM's **Assignment
Rules** and Salesforce's **Lead Assignment Rules**: an ordered list of
condition → owner rules, evaluated top to bottom, first match wins, with a
per-branch round robin as the universal fallback so a lead is never stuck
unroutable.

## 1. Why this exists

Before this feature, every new lead was either assigned manually or handed
to whichever counselor was next in a single, branch-wide round robin
(`src/lib/leadAutoAssignment.ts`). That's fine as a default, but it can't
express real sales-ops policy such as:

- "Meta/Facebook leads always go to the Digital team, not the walk-in desk."
- "P1 leads bypass the general queue and rotate only among senior
  counselors."
- "Hot leads from the Website source go straight to a specific closer."

`src/lib/assignmentRuleEngine.ts` adds that policy layer **on top of** the
existing branch round robin, without replacing or risking it: a lead that
matches no rule (or whose rule's queue happens to be empty) still falls
through to the exact same battle-tested per-branch rotation as before.

## 2. Concepts

| Term | Meaning here | Zoho equivalent | Salesforce equivalent |
|---|---|---|---|
| Assignment Rule | An ordered condition → owner record in `crm_assignment_rules` | Assignment Rule / Rule Entry | Lead Assignment Rule / Rule Entry |
| Conditions | Branch, source, priority, lead quality, country interest, service interest — each is a wildcard when left empty | Criteria on a Rule Entry | Criteria on a Rule Entry |
| Queue | The `employeeIds` list a `round_robin` rule rotates across | Territory / Group | Queue |
| Round robin cursor | `last_employee_id` remembered per rule (or per branch) so the *next* lead goes to the *next* person | Round-robin pointer | Round-robin pointer |
| Fallback engine | Branch-wide round robin in `leadAutoAssignment.ts`, used when no rule matches | — (Zoho requires a rule to match or leaves it unassigned) | — |
| Manual override | An explicitly chosen owner always wins over rules and round robin | Manual reassignment overrides rules | Same |

## 3. Precedence — what happens when a lead is created

```
                 New lead is about to be created / routed
                                  │
                                  ▼
                 Did the caller explicitly name an owner
                 (and NOT ask for forced auto-assign)?
                                  │
                     ┌────────────┴────────────┐
                    YES                         NO
                     │                           │
                     ▼                           ▼
          Assign to that owner.        Load active rules from
          (manual pick always wins)    crm_assignment_rules,
                                        ordered by sort_order ASC.
                                                  │
                                                  ▼
                                     Evaluate each rule's conditions
                                     against the lead's branch / source /
                                     priority / lead quality / country
                                     interest / service interest.
                                     First ACTIVE rule that matches wins;
                                     the rest are never evaluated.
                                                  │
                                     ┌────────────┴────────────┐
                              Rule matched                No rule matched
                                     │                           │
                                     ▼                           │
                     assignment_mode = specific_employee?        │
                          ┌──────────┴──────────┐                │
                         YES                    NO                │
                          │                      │                │
                          ▼                      ▼                │
                 Assign to that          Round robin across the   │
                 one fixed employee      rule's own employeeIds   │
                 (if active).            queue (checked-in first, │
                                          any active as fallback). │
                          │                      │                │
                          └──────────┬───────────┘                │
                                     ▼                             │
                        Did the rule produce a candidate?          │
                          ┌──────────┴──────────┐                  │
                         YES                    NO ─────────────────┘
                          │                      │
                          ▼                      ▼
                 DONE - lead assigned    Fall back to the branch's own
                 to that employee.       round robin (leadAutoAssignment.ts):
                                         checked-in employees in that
                                         branch (or an explicit
                                         crm_counsilor_allocations list),
                                         rotated by the branch cursor.
                                                  │
                                     ┌────────────┴────────────┐
                              Candidate found              Nobody checked in
                                     │                           │
                                     ▼                           ▼
                          DONE - lead assigned         Lead stays unassigned
                          to that employee.            in the branch's pool
                                                        (never blocks lead
                                                        creation).
```

Every branch of this tree ends by calling `recordLeadAssignment()`
(`src/lib/leadRemarks.ts`), which stamps the "assigned since" audit fields,
logs a `lead_assigned` entry to `crm_remarks`, and sends the new owner an
in-app notification (`crm_notifications`, type `lead_assigned`) - the single
hook every assignment path shares, so this behavior is automatic for any
future call site too.

## 4. Where this is wired in

| Entry point | File | Behavior |
|---|---|---|
| Manual "Add Lead" form (round robin/auto-assign checkbox) | `src/app/api/leads/route.ts` (`POST`) | Only FOE/Branch Manager/CEO can request auto-assign; a plain counselor's lead is always self-assigned, bypassing rules entirely. |
| Excel bulk upload | `src/app/api/leads/bulk-upload/route.ts` | Assigns by literal "Counselor" column match only; **does not** call the rule engine (left unassigned when no name matches). Candidate for future extension - see §8. |
| Public lead-intake webhook (Meta/Instagram/LinkedIn/website forms) | `src/app/api/lead-intake/route.ts` (`POST`/`PUT`) | Resolves the inbound `source` string to a `crm_source.id` first, then calls the rule engine - this is the main entry point source-based rules are built for. |
| Admin-triggered "Auto-Assign" button on an existing lead | `src/app/api/lead-auto-assignment/route.ts` (`GET` preview / `POST` apply) | Loads the lead's own branch/source/priority/quality from the DB so the rule match is based on the lead's real attributes, not just its branch. |
| Assignment Rules admin UI | `src/app/admin/leads/assignment-rules/page.tsx` | Create/edit/reorder/delete rules, and a non-consuming "Test a lead" preview panel. |

## 5. Database schema

All tables are self-provisioning (`CREATE TABLE IF NOT EXISTS`, run lazily
on first use from the relevant `lib` module) - the same pattern this
codebase already uses for `crm_discount_tier_config`,
`crm_lead_round_robin_state`, and `crm_auto_reassignment_rules`. There is no
migration file to run; the tables appear automatically the first time a
lead is created or the admin UI is opened.

### `crm_assignment_rules` (new)

| Column | Type | Meaning |
|---|---|---|
| `id` | INT PK | |
| `name` | VARCHAR(150) | Display name |
| `description` | TEXT NULL | Optional notes |
| `is_active` | TINYINT | Inactive rules are skipped entirely |
| `sort_order` | INT | Evaluation order, ascending - **this is the rule's priority** |
| `branch_ids` | VARCHAR(255) NULL | CSV of `crm_branch.id`; empty = any branch |
| `source_ids` | VARCHAR(255) NULL | CSV of `crm_source.id`; empty = any source |
| `priorities` | VARCHAR(150) NULL | CSV of free-text values matched case-insensitively against `crm_forum_leads.priority` (e.g. `P1,P2`) |
| `lead_qualities` | VARCHAR(255) NULL | CSV matched against `crm_forum_leads.lead_quality` (e.g. `Hot,Warm`) |
| `country_interest_ids` | VARCHAR(255) NULL | CSV of `crm_forum_leads.country_interest` FK values |
| `service_interest_ids` | VARCHAR(255) NULL | CSV of `crm_forum_leads.service_interest` FK values |
| `assignment_mode` | VARCHAR(20) | `round_robin` or `specific_employee` |
| `employee_ids` | VARCHAR(1000) | CSV of `crm_employee.id` - the queue (or the single fixed owner) |
| `created_at` / `updated_at` | DATETIME | |
| `created_by` / `updated_by` | INT NULL | `crm_employee.id` of the admin who last touched the rule |

### `crm_assignment_rule_state` (new)

One row per rule, tracking its own independent round-robin cursor so two
different rules never interfere with each other's rotation:

| Column | Type |
|---|---|
| `rule_id` | INT PK |
| `last_employee_id` | INT NULL |
| `created_at` / `updated_at` | DATETIME |

### Existing tables this feature reads (unchanged)

- `crm_lead_round_robin_state` - the branch-level fallback cursor (`branch_id` PK).
- `crm_employee_attendance` - "checked in today" gate (`emp_id`, `created`, `checkin`, `checkout`).
- `crm_counsilor_allocations` - an explicit branch-scoped counselor list that the branch fallback prefers over "every active employee in the branch" when present.
- `crm_forum_leads` - `assignTo` / `case_officer` / `Counsilor` are the three columns every assignment path writes; `branch`, `market_source`, `priority`, `lead_quality`, `country_interest`, `service_interest` are the condition inputs.
- `crm_notifications` - the `lead_assigned` alert sent to the new owner.

## 6. How the round robin actually rotates

Both the rule-level engine and the branch-level fallback use the same
technique, just against different cursor tables:

1. Build the ordered candidate list (rule: the rule's `employeeIds`, in the
   order they were saved; branch: `crm_counsilor_allocations` order, or
   `id ASC`).
2. Prefer only employees checked in today (`crm_employee_attendance`); if
   that leaves zero candidates, degrade to "every active member of the
   pool" rather than abandoning the rule/branch.
3. Inside a DB transaction, `SELECT ... FOR UPDATE` the cursor row for this
   rule/branch (row-locked, so two leads created at the same instant can
   never both land on the same person).
4. Find the previous pick's index in the candidate list; the next pick is
   `(previousIndex + 1) % candidates.length`. If the previous pick is no
   longer a candidate (went inactive, checked out), this naturally wraps to
   position 0 instead of erroring.
5. Write the new pick back as `last_employee_id` (skipped when previewing,
   so "Test a lead" in the admin UI never disturbs live rotation) and
   commit.

### Worked example

Rule "Meta leads to Digital team" has `employeeIds = [12, 7, 19]` and
`last_employee_id = 7`. The next 4 Meta leads that arrive, assuming everyone
stays checked in, go to: `19 → 12 → 7 → 19`. If employee `12` checks out
partway through, the candidate list shrinks to `[7, 19]` and the rotation
continues correctly from whichever of those two was picked last.

## 7. API reference

All routes require the `transfers.manage` permission (the same gate the
sibling `auto-reassignment` rules feature uses) except where noted -
practically this means CEO, Director, Director of Sales, Super Admin, IT,
and Founder; **not** Branch Manager (company-wide routing policy is treated
as a director-level configuration, matching how the inactivity-reassignment
rules feature is already scoped).

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/assignment-rules` | List all rules, ordered by `sortOrder`. |
| `POST` | `/api/assignment-rules` | Create a rule. |
| `GET` | `/api/assignment-rules/:id` | Fetch one rule. |
| `PUT` | `/api/assignment-rules/:id` | Update a rule (partial - only sent fields change). |
| `DELETE` | `/api/assignment-rules/:id` | Delete a rule. **CEO only**, on top of the base permission check. |
| `POST` | `/api/assignment-rules/reorder` | Body `{ orderedIds: number[] }` - rewrites `sort_order` to match array order. |
| `POST` | `/api/assignment-rules/preview` | Body `{ branchId, sourceId?, priority?, leadQuality?, countryInterestId?, serviceInterestId? }` → `{ matchedRule, assignment }`. Non-consuming. |
| `GET` | `/api/assignment-rules/reference-data` | `{ branches, sources, employees }` for populating the admin UI's pickers in one request. |
| `GET` | `/api/lead-auto-assignment?leadId=&branchId=` | Existing manual "who's next" preview, now rule-aware; pass `leadId` for an accurate match against that lead's real attributes. |
| `POST` | `/api/lead-auto-assignment` | Existing manual "Auto-Assign" action on an existing lead, now rule-aware. |

## 8. Admin UI

`/admin/leads/assignment-rules` (linked from the sidebar as **Assignment
Rules**, next to the existing **Lead Assignment** availability page):

- An ordered list of rules with up/down re-order buttons, an active/inactive
  toggle, condition chips, and the queue's member names.
- **New Rule** opens a form: name/description, condition builder (branch and
  source as multi-select chips; priority and lead quality as comma-separated
  text, since those columns are free text rather than enums in this schema),
  and an assignment section (round robin queue vs. one fixed owner), with
  employees grouped by their own branch for easy scanning.
- **Test a lead** - pick a branch/source/priority/quality combination and see
  which rule (if any) would fire and who would receive it right now, without
  moving any rotation cursor. Falls back to reporting the branch round robin
  pick when no rule matches, so it always shows the real outcome.

## 9. Notifications

`recordLeadAssignment()` now sends the new owner an in-app notification
(`type: 'lead_assigned'`, `link: /admin/leads/:id`) any time a lead's
`assignTo` changes to them, regardless of which path caused it - manual
reassignment, rule-based round robin, branch fallback, or the inactivity
auto-reassignment job. No individual call site had to be touched for this;
it lives in the one shared hook every assignment path already called.

## 10. Operational notes / troubleshooting

- **"My rule never fires."** Check `is_active`, then check `sort_order` - an
  earlier, broader rule (e.g. one with no conditions at all) will always win
  first. Conditions within a rule are AND'ed together; values within one
  condition (e.g. multiple sources) are OR'ed.
- **"Leads matching my rule are landing in the branch fallback instead."**
  This means the rule matched but its queue had zero eligible employees -
  every member is either inactive (`crm_employee.status != 1`) or not
  checked in today. Check `crm_employee_attendance` for today's date.
- **Attendance is separate from the employee record.** "Active" (can ever
  receive leads) and "checked in today" (can receive leads *right now*) are
  two different gates - see `/admin/lead-assignment-availability` to toggle
  today's presence.
- **A duplicate lead never consumes a turn.** Assignment resolution runs
  after the duplicate-phone/email check in `leads/route.ts`, specifically so
  a rejected duplicate submission doesn't silently advance the queue.

## 11. Known gaps / future extension points

- Bulk Excel upload (`bulk-upload/route.ts`) still only assigns by literal
  counselor-name column match; it does not consult assignment rules. Wiring
  it in would mean deciding whether each row should be evaluated against the
  rule engine individually (likely correct, but slower for large files) or
  once for the whole batch.
- No territory/region-level rule dimension yet - only branch, not region, is
  a condition. `crm_forum_leads.region` and `crm_employee.region` already
  exist and could be added as a seventh condition column the same way the
  other five were added.
- No working-hours-awareness beyond "checked in today" - a lead created at
  11pm still round-robins to whoever is marked checked in, with no SLA
  escalation if nobody responds (that concern is handled separately, and
  only by inactive-hours, by the existing `crm_auto_reassignment_rules`
  engine in `src/app/api/auto-reassignment`).
- No weighted round robin (e.g. senior counselors getting 2x the leads of
  junior ones) - every queue member gets exactly one turn per rotation.
