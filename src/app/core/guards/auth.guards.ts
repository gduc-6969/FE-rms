import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/app.models';

export const authGuard: CanActivateFn = (_route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) return true;
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return (_route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
    }

    const role = authService.role();
    if (role && allowedRoles.includes(role)) return true;

    // Redirect to the user's own role home instead of login
    const routeMap: Record<UserRole, string> = {
      admin: '/admin/dashboard',
      staff: '/staff/tables',
      customer: '/customer/home'
    };
    const target = role ? routeMap[role] : '/';
    return router.createUrlTree([target]);
  };
};

/** Prevents authenticated users from seeing the login page (browser back after login) */
export const loginGuard: CanActivateFn = (): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) return true;

  const role = authService.role();
  const routeMap: Record<UserRole, string> = {
    admin: '/admin/dashboard',
    staff: '/staff/tables',
    customer: '/customer/home'
  };
  const target = role ? routeMap[role] : '/';
  return router.createUrlTree([target]);
};
