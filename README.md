# Restaurant Management UI (Angular 17)

UI nền tảng cho hệ thống quản lý nhà hàng (RMS) với 3 khu vực vai trò: Admin, Staff (gộp Phục vụ + Thu ngân), Customer.

## Tech stack

- Angular 17 (standalone components)
- Angular Material
- RxJS + TypeScript strict mode

## Run project

```bash
npm install
npm start
```

Truy cập: `http://localhost:4200`

## Tài khoản mock

- Admin: `admin@restaurant.com / password123`
- Staff: `staff@restaurant.com / password123`
- Waiter (mapped về Staff): `waiter@restaurant.com / password123`
- Cashier (mapped về Staff): `cashier@restaurant.com / password123`
- Customer: `customer@restaurant.com / password123`

## Routing hiện có

- `/login`
- `/admin/dashboard`, `/admin/menu`, `/admin/tables`, `/admin/inventory`, `/admin/discounts`, `/admin/staff`, `/admin/reports`
- `/staff/tables`, `/staff/checkout`, `/staff/payment-history`, `/staff/shift`
- `/customer/home`, `/customer/menu`, `/customer/reservation`

## Phân tích yêu cầu

Xem file: `src/docs/REQUIREMENTS_ANALYSIS.md`

## Build & test

```bash
npm run build
npm test
```
