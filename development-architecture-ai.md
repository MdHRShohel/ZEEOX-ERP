# ZEEOX Business System — Development Architecture & AI Build Guide

## 1. Goal
Build a production-ready internal business system from the spreadsheet reference, with a structure that is:
- easy for developers to extend
- easy for AI coding agents to generate safely
- strict about calculations and data integrity
- simple enough for business users to operate

This document is the **implementation guide**. It is more specific than the requirements file and should be used to start development.

## 2. Product Direction
The app should behave like a **business ERP-lite** for a leather product company:
- one source of truth for stock, production, sales, courier, and expenses
- transaction-driven calculations
- management dashboard with live totals
- investor and profit sharing support
- ready for future growth into multi-branch or multi-warehouse use

## 3. Fixed Technology Stack

### Frontend
- **Next.js 14+ App Router**
- **React**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui**
- **TanStack Table**
- **Zod** for validation

### Backend
- Next.js server actions for normal CRUD
- Route handlers for exports, webhooks, and external integrations
- **Prisma** as ORM
- **PostgreSQL** as the database

### Auth
- email/password authentication
- session-based auth
- role-based permissions

### Infrastructure
- Docker-ready deployment
- object storage for files/attachments
- Redis optional later for queues/cache

## 4. Architecture Style
Use a **modular monolith**.

Why:
- faster to build
- easier to maintain for a small team
- safer for AI-generated code
- avoids microservice complexity too early

### Architectural rules
- keep business rules in server-side services, not UI components
- keep calculations in shared utility functions
- keep database writes transactional
- keep UI dumb and data-driven
- never duplicate a formula in multiple places

## 5. Domain Modules

### 5.1 Auth & Access Control
Responsibilities:
- login/logout
- session handling
- role checks
- permission guards

Roles:
- Admin
- Manager
- Accounts
- Operator
- Viewer

### 5.2 Company & Investor
Responsibilities:
- investor profiles
- investment amount
- ownership %
- profit share %
- notes
- profit distribution reports

### 5.3 Product & Inventory
Responsibilities:
- categories
- models
- colors
- sizes
- stock variants
- stock ledger
- stock valuation
- low-stock alerts

### 5.4 Production
Responsibilities:
- production batches
- cost breakdown
- unit cost calculation
- stock increase
- production history

### 5.5 Sales
Responsibilities:
- invoice creation
- customer details
- pricing
- payment tracking
- profit calculation
- returns handling

### 5.6 Courier
Responsibilities:
- shipment records
- tracking ID
- delivery charges
- COD charges
- return charges
- shipment status

### 5.7 Expenses
Responsibilities:
- office expense entries
- categories
- reporting

### 5.8 Reporting & Dashboard
Responsibilities:
- KPI aggregation
- business summaries
- export files
- date filtering

## 6. Recommended Folder Structure

```txt
src/
  app/
    (auth)/
      login/
    (dashboard)/
      dashboard/
      company/
      inventory/
      production/
      sales/
      courier/
      expenses/
      reports/
      settings/
  components/
    ui/
    layout/
    forms/
    tables/
  features/
    company/
    inventory/
    production/
    sales/
    courier/
    expenses/
    reports/
  lib/
    auth.ts
    db.ts
    calculations.ts
    permissions.ts
    constants.ts
    format.ts
  server/
    services/
    repositories/
    validators/
  types/
  prisma/
```

## 7. Data Model Blueprint

### Core tables
- users
- roles
- permissions
- companies
- investors
- product_categories
- product_models
- product_variants
- stock_ledger
- production_batches
- sales_invoices
- sales_invoice_items
- courier_shipments
- office_expenses
- customers
- payments
- returns
- profit_distributions
- audit_logs

### Ledger principle
Do not store only final totals.

Store:
- every stock movement
- every sales invoice
- every production batch
- every courier charge
- every expense

Then calculate totals from these records.

## 8. Business Logic Rules

### Inventory
- stock formula:
  `opening + production - sold + returned`
- never silently allow negative stock
- every change must have a source reference

### Production
- total production cost:
  `material + labor + packaging + other`
- unit production cost:
  `total production cost / qty`
- posting production creates stock movement

### Sales
- total sale:
  `qty * selling price`
- total cost must include linked production cost, courier, ads, packaging, and return-related charges
- net profit:
  `total sale - total cost`

### Courier
- net courier cost:
  `delivery + COD + return`
- shipment status must be tracked

### Expenses
- office expenses are operating expenses, not product cost
- expenses should roll into dashboard and reports only

### Investor logic
- ownership and profit share should be validated
- profit share can equal ownership or differ by business rule

## 9. Status Models

### Sales payment status
- unpaid
- partial
- paid
- returned
- cancelled

### Courier status
- pending
- dispatched
- in_transit
- delivered
- returned
- failed

### Stock movement type
- opening
- production_in
- sale_out
- return_in
- adjustment

## 10. API / Server Action Map

Use server actions for:
- create/update/delete company settings
- create investor
- create stock entry
- create production batch
- create sales invoice
- record payment
- create courier shipment
- create expense

Use route handlers for:
- CSV/XLSX export
- PDF export
- webhook integrations
- file downloads

## 11. UI Page Map

### Main pages
- `/dashboard`
- `/company`
- `/inventory`
- `/production`
- `/sales`
- `/courier`
- `/expenses`
- `/reports`
- `/settings`

### Inventory pages
- list variants
- create variant
- stock movement history
- low stock view

### Sales pages
- invoice list
- create invoice
- invoice detail
- payment status
- returns

### Reports pages
- daily summary
- monthly summary
- product-wise sales
- profit report
- stock valuation
- investor report

## 12. Calculation Utilities
Put all formulas in one shared file like `src/lib/calculations.ts`.

Required helpers:
- calculateCurrentStock
- calculateProductionTotal
- calculateSalesTotal
- calculateCourierTotal
- calculateTotalCost
- calculateNetProfit
- calculateStockValue

Rules:
- no formula should be hardcoded in multiple forms
- UI should display the same calculated value as the database summary

## 13. Validation Rules
Use Zod schemas for all forms.

Required validations:
- dates must be valid
- quantities must be positive integers
- monetary values must be non-negative numbers
- invoice numbers must be unique
- references must exist before linking
- ownership/profit share must be reasonable

## 14. Latest Feature Set to Include
Build these from the start so the system feels modern:

- responsive layout
- global search
- advanced table filters
- pagination
- export to Excel/PDF
- activity/audit log
- notifications for low stock
- file attachments for invoices/receipts
- dark mode ready UI
- mobile-friendly dashboards
- command palette or quick actions

Optional later:
- AI assistant for report questions
- multi-warehouse support
- barcode scanning
- WhatsApp/SMS notifications

## 15. AI-Friendly Development Rules

### For AI code generation
When generating or editing code:
- make one module at a time
- keep changes small and scoped
- do not rewrite unrelated files
- reuse existing utilities first
- keep naming consistent
- add types before logic when possible
- prefer explicit code over clever abstractions

### For AI task prompts
Every coding task should include:
- target module
- exact user outcome
- data fields involved
- validation rules
- success criteria

### For AI patching behavior
- if a calculation exists, update all display locations
- if a schema changes, update forms, services, and tables together
- if a status enum changes, update filters and badges too

## 16. Suggested Build Order

1. auth + roles
2. database schema + migrations
3. shared calculations
4. company/investor module
5. product/inventory module
6. production module
7. sales module
8. courier module
9. expenses module
10. dashboard + reports
11. exports + audit logs
12. polish and edge-case handling

## 17. Acceptance Criteria
The build is ready when:
- core workbook features exist as real app modules
- totals and profit are calculated automatically
- inventory is transaction-driven
- sales and courier are linked properly
- dashboard numbers match source records
- investor and profit-share data is reportable
- the codebase is modular and AI-friendly

## 18. Developer Prompt for AI Agents
Use this as the default instruction when asking an AI coder to work in the repo:

> Build this feature using the existing Next.js + TypeScript + Prisma architecture. Keep the change modular, avoid touching unrelated files, and update all affected layers: schema, server logic, validation, UI, and calculated summaries. Reuse shared utilities for formulas and keep the business rules transaction-based. If a field or status changes, update every consumer of that field. Prefer clear, explicit code and preserve existing behavior unless the task explicitly changes it.

