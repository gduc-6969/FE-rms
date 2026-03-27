export interface ApiResponse<T> {
  success: boolean;
  status: number;
  message: string;
  data: T;
  errorCode?: string;
  errors?: Record<string, string>;
  timestamp?: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  user: {
    id: number;
    email: string;
    fullName: string;
    role: string;
  };
}

export type UserRole = 'admin' | 'staff' | 'customer';

export interface UserAccount {
  email: string;
  password: string;
  role: UserRole;
  fullName: string;
}

export type TableStatus = 'available' | 'serving' | 'pending-payment' | 'disabled';

export interface DiningTable {
  id: number;
  name: string;
  capacity: number;
  area: string;
  status: TableStatus;
  guests?: number;
  elapsedMinutes?: number;
}

export interface KpiMetric {
  label: string;
  value: string;
  trend: string;
}

export interface MenuItem {
  id: number;
  name: string;
  category: string;
  price: number;
  status: 'available' | 'out-of-stock';
}

export interface PendingPayment {
  billCode: string;
  tableName: string;
  waitingMinutes: number;
  total: number;
  waiter: string;
}

export interface ReservationItem {
  code: string;
  customerName: string;
  guests: number;
  dateTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

export interface InventoryItem {
  id: number;
  name: string;
  unit: string;
  stock: number;
  alertLevel: number;
  category?: string; // optional category for inventory grouping
}

export interface DiscountItem {
  id: number;
  code: string;
  type: 'percent' | 'amount';
  value: number;
  minOrder: number;
  expiresAt: string;
}

export interface StaffMember {
  id: number;
  name: string;
  role: 'Admin' | 'Phục Vụ' | 'Thu Ngân' | 'Nhân Viên';
  email: string;
  phone: string;
  status: 'active' | 'inactive';
}

export interface PaymentHistoryItem {
  billCode: string;
  tableName: string;
  total: number;
  method: 'Tiền mặt' | 'Thẻ' | 'Chuyển khoản' | 'Ví điện tử';
  paidAt: string;
  staffName: string;
}

export type PaymentMethod = PaymentHistoryItem['method'];

export interface ShiftRecord {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  totalBills: number;
  revenue: number;
  status: 'open' | 'closed';
}

export interface OrderLineItem {
  id: number;
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
  note?: string;
}

export interface TableSession {
  id: number;
  billCode: string;
  tableId: number;
  tableName: string;
  guests: number;
  openedAt: string;
  closedAt?: string;
  status: 'open' | 'closed';
  orders: OrderLineItem[];
}
