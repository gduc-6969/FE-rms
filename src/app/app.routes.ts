import { Routes } from '@angular/router';
import { authGuard, roleGuard, loginGuard } from './core/guards/auth.guards';
import { AdminDashboardComponent } from './features/admin/admin-dashboard.component';

import { InventoryManagementComponent } from './features/admin/inventory-management.component';
import { MenuManagementComponent } from './features/admin/menu-management.component';
import { ReportsComponent } from './features/admin/reports.component';
import { StaffManagementComponent } from './features/admin/staff-management.component';
import { TableManagementComponent } from './features/admin/table-management.component';
import { CustomerHomeComponent } from './features/customer/customer-home.component';
import { CustomerMenuComponent } from './features/customer/customer-menu.component';
import { CustomerProfileComponent } from './features/customer/customer-profile.component';
import { CustomerReservationComponent } from './features/customer/customer-reservation.component';
import { CustomerSecureReservationComponent } from './features/customer/customer-secure-reservation.component';
import { NotFoundComponent } from './features/not-found.component';
import { LoginPageComponent } from './features/auth/login-page.component';
import { StaffPaymentHistoryComponent } from './features/staff/staff-payment-history.component';
import { StaffShiftComponent } from './features/staff/staff-shift.component';
import { StaffTableWorkspaceComponent } from './features/staff/staff-table-workspace.component';
import { WaiterTablesComponent } from './features/waiter/waiter-tables.component';
import { MainShellComponent } from './layout/main-shell.component';
import { PublicHomeComponent } from './features/public/public-home.component';
import { PublicMenuComponent } from './features/public/public-menu.component';

export const routes: Routes = [
	{ path: '', pathMatch: 'full', component: PublicHomeComponent },
	{ path: 'menu', component: PublicMenuComponent },
	{ path: 'login', component: LoginPageComponent, canActivate: [loginGuard] },
	{
		path: 'admin',
		component: MainShellComponent,
		canActivate: [authGuard, roleGuard(['admin'])],
		children: [
			{ path: '', pathMatch: 'full', redirectTo: 'dashboard' },
			{ path: 'dashboard', component: AdminDashboardComponent },
			{ path: 'menu', component: MenuManagementComponent },
			{ path: 'tables', component: TableManagementComponent },
			{ path: 'inventory', component: InventoryManagementComponent },
			
			{ path: 'staff', component: StaffManagementComponent },
			{ path: 'reports', component: ReportsComponent }
		]
	},
	{
		path: 'staff',
		component: MainShellComponent,
		canActivate: [authGuard, roleGuard(['staff'])],
		children: [
			{ path: '', pathMatch: 'full', redirectTo: 'tables' },
			{ path: 'tables', component: WaiterTablesComponent },
			{ path: 'tables/:tableId', component: StaffTableWorkspaceComponent },
			{ path: 'checkout', pathMatch: 'full', redirectTo: 'tables' },
			{ path: 'payment-history', component: StaffPaymentHistoryComponent },
			{ path: 'shift', component: StaffShiftComponent }
		]
	},
	{ path: 'waiter', pathMatch: 'full', redirectTo: 'staff/tables' },
	{ path: 'cashier', pathMatch: 'full', redirectTo: 'staff/checkout' },
	{
		path: 'customer',
		component: MainShellComponent,
		canActivate: [authGuard, roleGuard(['customer'])],
		children: [
			{ path: '', pathMatch: 'full', redirectTo: 'home' },
			{ path: 'home', component: CustomerHomeComponent },
			{ path: 'menu', component: CustomerMenuComponent },
			{ path: 'reservation', component: CustomerReservationComponent },
			{ path: 'reservation/secure', component: CustomerSecureReservationComponent },
			{ path: 'profile', component: CustomerProfileComponent }
		]
	},
	{ path: '**', component: NotFoundComponent }
];
