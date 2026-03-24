# RMS Requirements Analysis (Version 1.0)

## 1) Scope from `angular_ui_prompt.md`

The requirement describes a full Restaurant Management System UI for 4 user roles:

- Admin/Manager
- Waiter/Waitress
- Cashier
- Customer

Main expectation:

- Angular 17+ SPA, responsive UI, role-based navigation
- CRUD heavy modules (menu, table, inventory, staff)
- Payment workflows
- Reports, charts, and real-time notifications
- Public customer experience (menu + reservation)

## 2) Implementation Strategy

Because the requirement is very large for one iteration, implementation is split into phases.

### Phase A (implemented in current codebase)

- Angular 17 app setup
- Angular Material setup
- Routing foundation for all 4 roles
- Login page + mock role-based authentication
- Shared shell layout (sidebar/topbar/logout)
- Core mock services/models for bootstrapping screens
- Initial pages:
  - Admin dashboard
  - Admin menu management list
  - Admin table management
  - Waiter table layout
  - Cashier pending checkout list
  - Customer home/menu/reservation

### Phase B (next priority)

- Complete CRUD dialogs and data forms (menu/table/inventory/staff)
- Role guards enhancement with unauthorized page
- Form validation messages and reusable form components
- Pagination/filtering/sorting for all tables

### Phase C

- Real-time notifications (Socket.IO)
- Payment details modal, discount handling, split/merge bill
- Charts for KPI/report pages
- Audit log page with export

### Phase D

- API integration (replace mock services)
- Unit tests and E2E tests
- Accessibility hardening (WCAG 2.1 AA)
- Performance optimization and production hardening

## 3) Current Gap vs Prompt

Still not implemented yet in this iteration:

- Full inventory, staff, reports, audit-log module UI
- Full waiter order workflow (open table, add/edit/cancel items)
- Full cashier payment transaction flow
- Full customer reservation history/edit/cancel flow
- Export/print/email, chart suite, advanced filters
- PWA and offline support

## 4) Acceptance for this iteration

This iteration delivers a running Angular baseline with:

- role-based navigation
- reusable architecture skeleton
- representative screens per role

This creates a production-ready structure to continue feature-by-feature implementation.
