# ZEEOX Complete Business System — Requirements Document

## 1. Purpose
This document defines the reference requirements for building a complete business management system based on the client-provided Excel workbook **ZEEOX_Complete_Business_System.xlsx**.

The workbook is treated as a **reference model**, not a complete specification. The application must therefore cover the visible sheets, the embedded formulas, and the implied business rules needed to operate the full business end-to-end.

## 2. Business Context
The system is for a **product-based leather business** that needs to manage:
- inventory and product variants
- production
- sales and profit
- courier/fulfillment costs
- office expenses
- investor ownership and profit sharing
- dashboard reporting

## 3. Project Goals
- Replace manual spreadsheet management with a centralized web application.
- Keep stock, sales, production, courier, expense, and profit data consistent.
- Automatically calculate totals, balances, and profitability.
- Provide role-based access for internal staff and management.
- Generate reports and dashboards for business decisions.

## 4. Scope

### In Scope
- Company/investor setup
- Product and stock management
- Production entries and production cost tracking
- Sales, invoice, and profit tracking
- Courier and return charge tracking
- Office expense management
- Dashboard reporting
- Search, filters, exports, and audit history
- User roles and permissions

### Out of Scope for Initial Build
- Full accounting/bookkeeping replacement
- Advanced tax automation
- HR/payroll
- E-commerce storefront
- Warehouse barcode automation unless added later

## 5. Source Workbook Interpretation

The workbook contains these sheets:
- **Company Overview**
- **Stock Management**
- **Office Expenses**
- **Sales & Profit**
- **Dashboard**
- **Courier Management**
- **Production Management**

### Implied business logic from the workbook
- Stock is variant-based: **category + model + color + size**
- Current stock is derived from movement, not entered manually
- Sales, courier cost, packaging, ads, and production cost affect profit
- Production records increase stock and create cost records
- Dashboard totals are calculated from transaction sheets
- Investor profit share is based on ownership/share configuration

## 6. Recommended Product Modules

### 6.1 Company & Investor Management
Manage business ownership, investors, and profit-sharing rules.

**Features**
- investor profile
- investment amount
- ownership percentage
- profit share percentage
- notes/remarks
- total ownership validation

**Rules**
- ownership and profit share should be validated
- system should support one business entity initially, but allow future expansion

### 6.2 Product & Inventory Management
Manage product categories and stock by variant.

**Features**
- category
- model
- color
- size
- opening stock
- production quantity
- sold quantity
- returned quantity
- current stock
- production cost per unit
- total stock value

**Rules**
- current stock is calculated:
  `opening stock + production qty - sold qty + returned qty`
- stock valuation is calculated using production cost per unit
- negative stock should be prevented or flagged
- inventory movements should be traceable by source transaction

### 6.3 Production Management
Track manufacturing cost and output.

**Features**
- production date
- model/product
- material cost
- labor cost
- packaging cost
- other cost
- total production cost
- production quantity
- unit production cost
- linked stock increase

**Rules**
- total production cost = material + labor + packaging + other
- unit cost should be calculated from total production cost / quantity
- production should update inventory automatically

### 6.4 Sales & Profit Management
Track orders, invoices, and profit/loss.

**Features**
- invoice number
- date
- customer name
- customer mobile
- product model
- quantity
- selling price
- total sale
- production cost/unit
- courier cost
- Facebook ads cost
- packaging cost
- total cost
- net profit/loss
- payment status
- return courier fee (customer)
- return courier fee (company)

**Rules**
- total sale = selling price × quantity
- total cost should include:
  - production cost
  - courier cost
  - ads cost
  - packaging cost
  - return-related charges when applicable
- net profit/loss = total sale - total cost + applicable return adjustments
- payment status must support at least:
  - paid
  - unpaid
  - partial
  - returned/cancelled

### 6.5 Courier Management
Track shipment charges and delivery status.

**Features**
- courier date
- courier name
- tracking ID
- customer
- delivery charge
- COD charge
- return charge
- status
- net courier cost

**Rules**
- net courier cost = delivery + COD + return charge
- courier charges must be linkable to sales orders
- status should track delivery lifecycle

### 6.6 Office Expense Management
Track operational business expenses.

**Features**
- expense date
- category
- description
- amount

**Rules**
- office expenses should be excluded from product COGS
- expenses should appear in dashboard summaries and reports

### 6.7 Dashboard & Reporting
Provide summary KPIs for management.

**Core metrics**
- total sales
- total cost
- net profit
- office expenses
- total stock value
- courier cost

**Additional reports**
- sales by date range
- product-wise sales
- customer-wise sales
- courier-wise delivery cost
- production cost summary
- investor profit share summary
- low stock alerts

## 7. Missing but Required Assumptions
These are not visible in the workbook but should be included for a usable system.

### Master Data
- users
- customers
- suppliers
- product categories
- product models
- courier providers
- expense categories

### Operational Workflows
- purchase/procurement entries
- returns and refunds
- payment collection tracking
- partial payments
- invoice numbering rules
- audit log/history

### Business Controls
- role-based access control
- approval for sensitive edits
- duplicate invoice prevention
- stock conflict handling
- date range filtering and export

## 8. Data Model Requirements

### Core entities
- **Company**
- **Investor**
- **User**
- **Role/Permission**
- **Product Category**
- **Product Variant**
- **Stock Ledger**
- **Production Batch**
- **Sales Order / Invoice**
- **Courier Shipment**
- **Expense**
- **Customer**
- **Payment**
- **Return**
- **Profit Distribution**

### Recommended accounting approach
Use a **transaction-ledger model** rather than storing only final totals.

This means:
- every stock change is a stock movement
- every cost is a line item or linked record
- dashboards are calculated from transactions
- summary fields may be cached, but source-of-truth should be transactional

## 9. Business Rules

### Inventory rules
- stock cannot go below zero unless admin override is allowed
- stock must update when production or sales are posted
- returns should increase stock when items are restockable

### Sales rules
- invoice numbers must be unique
- quantities must be positive integers
- product price and cost must be recorded at transaction time
- profit must support negative values

### Courier rules
- every shipment may have delivery, COD, and return costs
- courier cost must be tied to either the sale or shipment record

### Expense rules
- each expense must have a category and amount
- expense entries should support attachments later if needed

### Investor rules
- ownership percentages should sum to 100% or be explicitly managed
- profit share can mirror ownership or be configured separately

## 10. User Roles

### Admin
- full control over system settings, users, master data, and all records

### Manager
- can manage production, stock, sales, courier, and expenses

### Accounts/Finance
- can manage sales status, expenses, payment tracking, profit reports

### Operator
- can create production, stock, and sales entries with limited permissions

### Viewer
- read-only access to dashboards and reports

## 11. Suggested Technology Stack

### Frontend
- **Next.js** or **React**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** or a similar component library
- **TanStack Table** for listing/filtering/report tables

### Backend
- **Node.js**
- **NestJS** or **Next.js API routes** for smaller scope
- **TypeScript**
- **REST API** initially; GraphQL optional later

### Database
- **PostgreSQL**
- use migrations from day one

### ORM
- **Prisma** or **Drizzle**

### Authentication
- email/password login
- session-based or JWT auth
- role-based authorization

### File/Document Storage
- object storage for invoices, receipts, and attachments

### Deployment
- Dockerized deployment
- cloud hosting on VPS or managed platform

### Reporting/Analytics
- server-side aggregation queries
- export to Excel/PDF for business reports

## 12. Non-Functional Requirements

### Performance
- dashboard should load quickly with aggregated data
- table views should support pagination and filtering

### Reliability
- transactional integrity for stock and sales updates
- no silent data loss

### Security
- role-based access control
- secure password storage
- audit logs for important actions

### Maintainability
- modular codebase by business domain
- reusable calculation utilities
- schema-first thinking for future expansion

### Usability
- simple business-friendly UI
- localized currency/date formatting if required
- mobile-friendly admin views where practical

## 13. Validation and Calculation Requirements

### Formula equivalents from workbook
- **Current Stock** = Opening Stock + Production Qty - Sold Qty + Returned Qty
- **Production Total Cost** = Material Cost + Labor Cost + Packaging Cost + Other Cost
- **Sales Total** = Qty × Selling Price
- **Courier Net Cost** = Delivery Charge + COD Charge + Return Charge
- **Total Cost** = Production Cost + Courier Cost + Facebook Ads Cost + Packaging Cost + return-related adjustments
- **Net Profit/Loss** = Total Sale - Total Cost

### Validation rules
- required fields must be enforced
- quantities and amounts must be numeric and non-negative where appropriate
- date fields must be valid
- references must exist before linking records

## 14. Reporting Requirements

The system should support:
- daily, weekly, monthly, yearly reports
- date range filters
- product-wise profit report
- customer-wise invoice history
- courier performance/cost report
- production cost report
- office expense breakdown
- investor profit distribution report
- stock valuation report

## 15. Suggested MVP Delivery

### Phase 1
- authentication and roles
- product/inventory
- production entries
- sales/invoice entries
- expenses
- dashboard totals

### Phase 2
- courier module
- returns/refunds
- investor/profit share reporting
- export features

### Phase 3
- advanced analytics
- attachments
- approvals
- multi-branch expansion

## 16. Acceptance Criteria
The system is acceptable when:
- all workbook concepts are represented in the application
- stock and profit calculations are automatic and correct
- dashboard totals match the underlying records
- users can manage sales, production, courier, and expenses in one place
- investor information and profit share are stored and reportable
- the system can scale beyond the spreadsheet structure

## 17. Notes
- This document intentionally assumes missing business details so development can start without waiting for a perfect spec.
- Final UI labels, workflows, and edge cases should be confirmed with the client during discovery.
- If the business has multiple branches, warehouses, or product families, the data model should be extended rather than rebuilt.

