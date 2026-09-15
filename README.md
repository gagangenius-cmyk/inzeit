# Navigator - Complete Lead Management System

A comprehensive Next.js-based CRM and case-management platform for **Navigator Globals** (formerly DM Consulting), covering the full client lifecycle across multiple international branches — from lead capture through agreements, payments, case operations and reporting.

## Overview

Navigator is built with:
- **Next.js 16** (App Router) with TypeScript
- **Sequelize ORM** (primary data layer) and **Prisma** (supplementary)
- **MySQL** for data storage
- **JWT** for staff and client-portal authentication
- **Tailwind CSS** for styling
- **Pusher Channels** for realtime updates (chat, notifications, lead pool)
- **Vercel Blob** for file storage (payment proofs, signed agreements, documents)

## Core Modules

### CRM & Lead Management
- Lead intake, pool, assignment/reassignment and cross-branch transfers
- Follow-ups, remarks, market sources, campaigns and digital marketing tracking
- Meta/Facebook Lead Ads webhook integration (auto-ingests leads from connected Pages)
- Global search across leads, opportunities and clients

### Operations & Case Management
- Operations console/dashboard for case officers, with team allocation and assignment
- Opportunity workflow (lead → opportunity → agreement → payment → delivery)
- Compliance and discount approval workflows
- Realtime client ⟷ case-officer chat (Pusher-backed, with polling fallback so nothing depends on Pusher being configured)

### Client Portal
- Self-service portal for clients (per-opportunity conversation/chat, document access, agreement viewing)

### Agreements & Contracts
- Bilingual (EN/AR) "Agreement for Advisory Services" generator for the Dubai branch (currently the only active branch; the underlying template code supports Abu Dhabi/Kuwait/Qatar/India as well, ready for when those branches go live again)
- Branch legal identity (company name, address, licence/registration number, governing law) is resolved dynamically per branch rather than hardcoded, so a rebrand or new branch doesn't require template edits
- Contract lifecycle: generator, preview, signing, templates, archive and analytics
- Legacy PHP-era agreement archive lookup for pre-migration contracts

### Payments & Finance
- Multi-method payment recording, balance payments, invoices
- Branch-aware payment receipts (Tax Invoice/Receipt) with jurisdiction-correct VAT/GST/TRN handling
- Discounts, admin fees, and finance/accounts reporting

### HR & Employee Management
- Employee records, departments, roles/permissions
- Attendance, leave, payslips and resignation workflows (staff self-service + admin views)

### Reporting & Analytics
- Branch performance, contract analytics, recovery reports, lead-status and operational dashboards

## Prerequisites

- Node.js 18+
- MySQL 5.7+ or 8.0+
- npm

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd navigator-next
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy `.env.example` to `.env` and fill in the values:
   ```bash
   cp .env.example .env
   ```
   See [Environment Variables](#environment-variables) below for what each one does.

4. **Set up the database**

   - Create a MySQL database and point `DATABASE_URL` at it
   - Apply `database-schema.sql`, then run the migrations in `migrations/` in order
   - Optionally seed reference data: `npm run db:seed:roles`, `db:seed:sources`, `db:seed:fees`, `db:seed:employees`, `db:seed:countries`, `db:seed:program-types`, `db:seed:program-validity`

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
navigator-next/
├── src/
│   ├── app/
│   │   ├── admin/            # Staff-facing app (CRM, operations, HR, finance, reports, settings, ...)
│   │   ├── api/               # API routes (leads, opportunities, payments, agreements, pusher, webhooks, ...)
│   │   ├── clientportal/       # Client-facing self-service portal
│   │   └── login/              # Staff login
│   ├── components/             # React components, grouped by feature area
│   ├── models/                 # ~110 Sequelize models
│   ├── services/               # Business-logic services (e.g. client-portal-product-service)
│   └── lib/                    # Shared utilities (auth, branch profiles, agreement/receipt templates, Pusher, ...)
├── prisma/
│   └── schema.prisma            # Supplementary Prisma schema
├── migrations/                  # SQL migrations applied on top of database-schema.sql
├── scripts/                     # DB setup/seed scripts
└── database-schema.sql          # Base schema (150+ tables)
```

## Environment Variables

See `.env.example` for the full annotated list. Key variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | MySQL connection string | Yes |
| `JWT_SECRET` | JWT signing secret (staff + client-portal auth) | Yes |
| `CRON_SECRET` | Bearer token required by scheduled cron routes | Yes (for cron) |
| `META_APP_ID` / `META_APP_SECRET` / `META_WEBHOOK_VERIFY_TOKEN` / `META_PAGE_ACCESS_TOKEN` / `META_PAGE_ID` / `META_AD_ACCOUNT_ID` | Meta/Facebook Lead Ads integration | Only if `META_INTEGRATION_ENABLED=true` |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token for file uploads (payment proofs, agreements, documents) | Yes for upload endpoints |
| `PUSHER_APP_ID` / `PUSHER_KEY` / `PUSHER_SECRET` / `PUSHER_CLUSTER` / `NEXT_PUBLIC_PUSHER_KEY` / `NEXT_PUBLIC_PUSHER_CLUSTER` | Realtime chat/notifications | No — falls back to polling if unset |
| `LEGACY_AGREEMENT_ROOT` | Path to the pre-migration PHP contract archive | Only on the machine hosting that archive |
| `NODE_ENV` / `PORT` | Environment mode / dev server port | No |

## Development

```bash
npm run dev     # start dev server
npm run build   # production build
npm run start   # start production server
npm run lint    # lint
```

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect the repository to Vercel
3. Set the environment variables above in the Vercel dashboard
4. Deploy

## License

This project is proprietary to Navigator Globals.

## Support

For support and questions, please contact the development team.
