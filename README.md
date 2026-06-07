# ZEEOX ERP

A full-stack Inventory Management ERP built with Next.js 14, Prisma, and PostgreSQL. Covers the complete stock lifecycle from purchase orders through sales invoicing and returns.

## Features

- **Procurement** — Suppliers, Purchase Orders, Goods Receipts (GRN)
- **Inventory** — Products, Stock Ledger, Adjustments, Warehouse Transfers
- **Sales** — Customers, Sales Orders, Invoices, Returns
- **Reports** — Inventory valuation, low stock alerts, stock movements, profitability
- **Dashboard** — Live KPIs and charts (revenue trend, top products, stock status)
- **Admin** — User management, Audit log, Settings
- **Role-based access** — `admin`, `staff`, `viewer`

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL 16 |
| ORM | Prisma 6 |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Auth | Custom HMAC-SHA256 sessions (Edge-compatible) |

---

## Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL 16 **or** Docker + Docker Compose

---

## Option A — Local Development (manual Postgres)

### 1. Clone and install

```bash
git clone <repo-url>
cd ZEEOX-ERP
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set your database connection:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/zeeox"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/zeeox"
AUTH_SECRET="replace-with-a-random-secret"
```

> **AUTH_SECRET** can be any long random string. Generate one with:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### 3. Run database migrations

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Seed initial data

```bash
npm run prisma:seed
```

This creates default UoMs, categories, a warehouse, sample products, and three user accounts:

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | admin |
| `staff` | `staff123` | staff |
| `viewer` | `staff123` | viewer |

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in.

---

## Option B — Docker Compose (database only)

Run Postgres in Docker, app on your machine:

```bash
# Start Postgres
docker compose -f docker-compose.db.yml up -d

# Install deps and run migrations
npm install
npx prisma migrate dev --name init
npx prisma generate
npm run prisma:seed

# Start dev server
npm run dev
```

---

## Option C — Full Docker Compose (app + database)

```bash
docker compose up --build
```

The app will be available at [http://localhost:3000](http://localhost:3000).

> On first run, migrations are applied automatically before the app starts.
> Seed data is **not** applied automatically — run it once manually:
> ```bash
> docker exec -it zeeox-app npx tsx prisma/seed.ts
> ```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (hot reload) |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run prisma:generate` | Regenerate Prisma client |
| `npm run prisma:migrate` | Run pending migrations |
| `npm run prisma:seed` | Seed the database |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `DIRECT_URL` | Yes | Direct connection URL (same as DATABASE_URL for local) |
| `AUTH_SECRET` | Yes | Secret key for session token signing |
| `ADMIN_SEED_PASSWORD` | No | Override admin password in seed (default: `admin123`) |
| `STAFF_SEED_PASSWORD` | No | Override staff password in seed (default: `staff123`) |
| `BOOTSTRAP_ADMIN_USER` | No | Emergency admin username (bypasses DB auth) |
| `BOOTSTRAP_ADMIN_PASS` | No | Emergency admin password (bypasses DB auth) |

---

## Role Permissions

| Module | admin | staff | viewer |
|--------|-------|-------|--------|
| Dashboard & Reports | ✓ | ✓ | ✓ |
| Products | ✓ | ✓ | — |
| Suppliers | ✓ | — | — |
| Purchase Orders | ✓ | — | — |
| Goods Receipts | ✓ | ✓ | — |
| Stock Adjustments | ✓ | — | — |
| Stock Transfers | ✓ | ✓ | — |
| Customers | ✓ | ✓ | — |
| Sales Orders | ✓ | ✓ | — |
| Invoices | ✓ | ✓ | — |
| Returns | ✓ | ✓ | — |
| Users & Audit | ✓ | — | — |
| Settings | ✓ | — | — |

---

## Project Structure

```
src/
├── app/                  # Next.js App Router pages and actions
│   ├── dashboard/
│   ├── products/
│   ├── purchases/
│   ├── receipts/
│   ├── sales/
│   ├── returns/
│   ├── reports/
│   ├── users/
│   ├── audit/
│   └── settings/
├── components/
│   ├── ui/               # Button, Input, Badge, Card, Table, etc.
│   ├── layout/           # AppShell, Sidebar, PageHeader, DataTable
│   └── charts/           # Recharts wrappers (all "use client")
├── lib/                  # Utilities (auth, prisma, calculations, schemas)
└── server/
    └── services/         # DB query layer (no actions, no headers)
prisma/
├── schema.prisma
└── seed.ts
```

---

## Database Schema Overview

The stock ledger (`StockLedger`) is the **single source of truth** for all inventory quantities. Current stock is always computed by aggregating ledger entries — never stored as a running total on the product record.

Movement types: `opening`, `purchase_in`, `sale_out`, `return_in`, `transfer_in`, `transfer_out`, `adjustment`
