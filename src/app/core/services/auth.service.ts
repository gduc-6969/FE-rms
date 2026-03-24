import { Injectable, signal } from '@angular/core';
import { UserAccount, UserRole } from '../models/app.models';

const TOKEN_KEY = 'rms-token';
const ROLE_KEY = 'rms-role';
const USER_KEY = 'rms-user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly accounts: UserAccount[] = [
    { email: 'admin@restaurant.com', password: 'password123', role: 'admin', fullName: 'Admin User' },
    { email: 'waiter@restaurant.com', password: 'password123', role: 'staff', fullName: 'Waiter User' },
    { email: 'cashier@restaurant.com', password: 'password123', role: 'staff', fullName: 'Cashier User' },
    { email: 'staff@restaurant.com', password: 'password123', role: 'staff', fullName: 'Staff User' },
    { email: 'customer@restaurant.com', password: 'password123', role: 'customer', fullName: 'Customer User' }
  ];

  readonly role = signal<UserRole | null>((localStorage.getItem(ROLE_KEY) as UserRole | null) ?? null);
  readonly fullName = signal<string | null>(localStorage.getItem(USER_KEY));

  login(email: string, password: string): UserRole | null {
    const account = this.accounts.find(item => item.email === email && item.password === password);

    if (!account) {
      return null;
    }

    localStorage.setItem(TOKEN_KEY, `mock-token-${account.role}`);
    localStorage.setItem(ROLE_KEY, account.role);
    localStorage.setItem(USER_KEY, account.fullName);

    this.role.set(account.role);
    this.fullName.set(account.fullName);

    return account.role;
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(USER_KEY);
    this.role.set(null);
    this.fullName.set(null);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  }
}
