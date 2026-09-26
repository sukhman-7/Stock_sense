# Project Specification: Full-Stack Inventory Management System (ERP-Lite)

Act as a Principal Full-Stack Engineer and Software Architect. Your task is to implement a robust, production-grade Inventory Management System based on the provided wireframes, user journeys, data validation rules, and lifecycle states.

---

## 1. System Overview & Technology Stack

Build a responsive, modern web application with:

* **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS, Lucide Icons, Shadcn UI / Radix primitives.
* **Backend**: Next.js Server Actions / Route Handlers or a modular Node.js/Express API with TypeScript.
* **Database & ORM**: PostgreSQL with Prisma ORM (or Drizzle ORM).
* **State Management & Data Fetching**: TanStack Query (React Query) or Server Components with optimistic UI updates.
* **Authentication**: JWT/Session-based auth (e.g., NextAuth.js or custom bcrypt + HTTP-only cookies).

---

## 2. Authentication & Authorization

### 2.1 UI Layout

* Modal-driven or dedicated dual-tab interface for **Login** and **Sign Up**.
* Header displays the app logo and title.

### 2.2 Functional & Validation Rules

* **Login**:
  * Fields: `Login ID`, `Password`.
  * Actions: "SIGN IN", "Forgot Password?", "Sign Up" toggle.
  * Validation: Verify credentials against the DB. Return explicit error message on failure: `"Invalid Login Id or Password"`.
* **Sign Up**:
  * Fields: `Login ID`, `Email ID`, `Password`, `Re-Enter Password`.
  * Rules:
    1. `Login ID`: Must be unique, alphanumeric, between 6 and 12 characters.
    2. `Email ID`: Must be valid format and unique across the database.
    3. `Password`: Minimum 8 characters; must contain at least 1 uppercase letter, 1 lowercase letter, and 1 special character.
    4. Confirm password match validation.

---

## 3. Global Navigation & Layout

* **Top Navigation Bar**:
  * Logo / Brand identity on the left.
  * Navigation links:
    * `Dashboard`
    * `Operations` (Dropdown: Receipts, Delivery Orders, Physical Adjustments)
    * `Products / Stock`
    * `Move History`
    * `Settings` (Dropdown: Warehouses, Locations)
  * Right utility area: Logged-in user badge (displays user initial, e.g., "A").

---

## 4. Main Dashboard (KPI Hub)

### 4.1 Cards & Metrics

1. **Receipts Card**:
   * Metrics:
     * `[X] to receive` (Count of receipts in `Ready` or `Draft` state)
     * `[X] Late` (Receipts where `scheduled_date < CURRENT_DATE` and state is not `Done`)
     * `[X] operations` (Total active operations where `scheduled_date >= CURRENT_DATE`)
   * Quick action button linking to the Receipts List view.
2. **Delivery Card**:
   * Metrics:
     * `[X] to Deliver` (Deliveries ready for dispatch)
     * `[X] Late` (Deliveries where `scheduled_date < CURRENT_DATE` and state is not `Done`)
     * `[X] waiting` (Deliveries blocked in `Waiting` state due to lack of stock)
     * `[X] operations` (Total scheduled operations)
   * Quick action button linking to the Delivery List view.

---

## 5. Warehouse & Location Management (Settings)

### 5.1 Warehouse Form

* Fields:
  * `Name` (String, e.g., "Central Warehouse")
  * `Short Code` (String, e.g., "WH", unique, max 5 chars)
  * `Address` (Text)

### 5.2 Location Form

* Fields:
  * `Name` (String, e.g., "Stock 1")
  * `Short Code` (String, e.g., "Stock1")
  * `Warehouse` (Foreign Key / Dropdown selecting from configured warehouses)
  * Computed Location Path: `<Warehouse.Short_Code>/<Location.Short_Code>` (e.g., `WH/Stock1`, `WH/Stock2`).

---

## 6. Stock & Inventory Management

### 6.1 Stock Table View

* Columns:
  * `Product Name / Code`
  * `Per Unit Cost` (Currency formatted)
  * `On Hand` (Physical total in warehouse)
  * `Free to Use` (Available: `On Hand - Allocated to Deliveries`)
* Capabilities:
  * Direct inline editing or modal to update stock levels.
  * Search and filter by product name or SKU.

---

## 7. Receipts Operation (`WH/IN`)

### 7.1 Reference Structure

* Format: `<Warehouse_Code>/IN/<Auto_Increment_ID>` (padded to 4 digits, e.g., `WH/IN/0001`).

### 7.2 Views

* **List View (Default)**:
  * Columns: `Reference`, `From (Vendor)`, `To (Destination Location)`, `Contact`, `Schedule Date`, `Status`.
  * Search bar: Filter dynamically by `Reference` or `Contact`.
  * Multi-view toggle: Switch between **List View** and **Kanban View** (grouped by status).
* **Detailed Form View**:
  * Action Buttons:
    * `TODO`: Active in `Draft` state; advances status to `Ready`.
    * `Validate`: Active in `Ready` state; advances status to `Done`. Updates physical stock `On Hand` and `Free to Use`.
    * `Print`: Enabled only once status is `Done`. Generates printable receipt slip.
    * `Cancel`: Cancels the receipt order.
  * Header Meta:
    * `Receive From` (Vendor/Supplier)
    * `Schedule Date` (Date picker)
    * `Responsible` (Auto-filled with the active logged-in user profile)
    * Status Breadcrumb / Pill: `Draft > Ready > Done`.
  * Line Items Table:
    * Columns: `Product` (Selector), `Quantity` (Number).
    * `+ New Product` row adder.

---

## 8. Delivery Orders Operation (`WH/OUT`)

### 8.1 Reference Structure

* Format: `<Warehouse_Code>/OUT/<Auto_Increment_ID>` (padded to 4 digits, e.g., `WH/OUT/0001`).

### 8.2 Views & Lifecycle

* **Status Lifecycle**: `Draft > Waiting > Ready > Done`.
* **State & Stock Reservation Rules**:
  * When validating demand, if `Requested Quantity > Free to Use Quantity`:
    * Delivery moves to `Waiting`.
    * The insufficient item row is **highlighted in Red**.
    * Show an alert notification: *"Product is not in stock. Waiting for replenishment."*
  * Once inventory is available, transition to `Ready`.
  * Clicking `Validate` in `Ready` sets state to `Done` and deducts stock.
* **Form View Metadata**:
  * Fields: `Delivery Address / Customer`, `Schedule Date`, `Operation Type`, `Responsible` (auto-filled).
  * Line items with Product, Demand Qty, Reserved Qty.

---

## 9. Move History (Stock Audit Log)

### 9.1 Data & Display Specifications

* Audit trail capturing every finalized inventory transaction.
* Table Columns:
  * `Reference`
  * `Date`
  * `Contact`
  * `From Location`
  * `To Location`
  * `Quantity`
  * `Status`
* Display Rules:
  * If a single reference order contains multiple products, display each product as an **individual row**.
  * **Visual Highlighting**:
    * Incoming moves (`IN`): Text / badge styled in **Green**.
    * Outgoing moves (`OUT`): Text / badge styled in **Red**.

---

## 10. Implementation Deliverables

1. **Prisma Database Schema**: Complete models for User, Warehouse, Location, Product, StockMove, StockReceipt, DeliveryOrder, and OrderLineItem.
2. **API Routes / Server Actions**: CRUD operations, transactional state transitions (`Draft -> Ready -> Done`), auto-increment reference generators, and stock adjustment logic.
3. **Frontend UI Components**: Responsive dashboard cards, data tables with search/filter, Kanban board view, modal forms, and notification banners.
4. **Mock Data Seed File**: Seed file containing sample warehouses, stock items (Desk, Table), and operations to test all states immediately.
