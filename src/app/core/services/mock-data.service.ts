import { Injectable } from '@angular/core';
import {
  DiningTable,
  DiscountItem,
  InventoryItem,
  KpiMetric,
  MenuItem,
  PaymentHistoryItem,
  PendingPayment,
  ReservationItem,
  ShiftRecord,
  StaffMember
} from '../models/app.models';

@Injectable({
  providedIn: 'root'
})
export class MockDataService {
  getAdminKpis(): KpiMetric[] {
    return [
      { label: 'Doanh thu hôm nay', value: '42.800.000đ', trend: '+12.4%' },
      { label: 'Bàn đang phục vụ', value: '18 / 30', trend: '+3 bàn' },
      { label: 'Hóa đơn hôm nay', value: '126', trend: '+9.8%' },
      { label: 'Món bán chạy', value: 'Bò lúc lắc', trend: '94 suất' }
    ];
  }

  getDiningTables(): DiningTable[] {
    return [
      { id: 1, name: 'Bàn 01', capacity: 4, area: 'Tầng 1', status: 'available' },
      { id: 2, name: 'Bàn 02', capacity: 6, area: 'Tầng 1', status: 'serving', guests: 5, elapsedMinutes: 78 },
      { id: 3, name: 'Bàn 03', capacity: 4, area: 'VIP', status: 'pending-payment', guests: 4, elapsedMinutes: 102 },
      { id: 4, name: 'Bàn 04', capacity: 2, area: 'Ban công', status: 'disabled' },
      { id: 5, name: 'Bàn 05', capacity: 8, area: 'Tầng 2', status: 'serving', guests: 7, elapsedMinutes: 46 }
    ];
  }

  getMenuItems(): MenuItem[] {
    return [
      { id: 1, name: 'Bò lúc lắc', category: 'Món chính', price: 189000, status: 'available' },
      { id: 2, name: 'Gỏi cuốn tôm thịt', category: 'Khai vị', price: 79000, status: 'available' },
      { id: 3, name: 'Mì Ý sốt kem', category: 'Món chính', price: 149000, status: 'out-of-stock' },
      { id: 4, name: 'Tiramisu', category: 'Tráng miệng', price: 69000, status: 'available' }
    ];
  }

  getPendingPayments(): PendingPayment[] {
    return [
      { billCode: 'HD-240301', tableName: 'Bàn 03', waitingMinutes: 16, total: 1245000, waiter: 'Nguyễn Bình' },
      { billCode: 'HD-240302', tableName: 'Bàn 07', waitingMinutes: 12, total: 890000, waiter: 'Trần Anh' },
      { billCode: 'HD-240303', tableName: 'Bàn 11', waitingMinutes: 8, total: 1560000, waiter: 'Lê Phương' }
    ];
  }

  getReservations(): ReservationItem[] {
    return [
      { code: 'DAT001', customerName: 'Phạm Nam', guests: 4, dateTime: '2026-03-25 18:00', status: 'pending' },
      { code: 'DAT002', customerName: 'Lê Hoa', guests: 2, dateTime: '2026-03-25 19:30', status: 'confirmed' },
      { code: 'DAT003', customerName: 'Mai Linh', guests: 6, dateTime: '2026-03-24 20:00', status: 'completed' }
    ];
  }

  getInventoryItems(): InventoryItem[] {
    return [
      { id: 1, name: 'Thịt bò', unit: 'kg', stock: 22, alertLevel: 10 },
      { id: 2, name: 'Rau xà lách', unit: 'kg', stock: 8, alertLevel: 12 },
      { id: 3, name: 'Sữa tươi', unit: 'lít', stock: 16, alertLevel: 8 },
      { id: 4, name: 'Phô mai', unit: 'kg', stock: 5, alertLevel: 6 }
    ];
  }

  getDiscountItems(): DiscountItem[] {
    return [
      { id: 1, code: 'WEEKEND10', type: 'percent', value: 10, minOrder: 500000, expiresAt: '2026-04-30' },
      { id: 2, code: 'VIP100K', type: 'amount', value: 100000, minOrder: 1000000, expiresAt: '2026-05-15' }
    ];
  }

  getStaffMembers(): StaffMember[] {
    return [
      {
        id: 1,
        name: 'Nguyễn Bình',
        role: 'Phục Vụ',
        email: 'binh@restaurant.com',
        phone: '0901111222',
        status: 'active'
      },
      {
        id: 2,
        name: 'Trần Anh',
        role: 'Thu Ngân',
        email: 'anh@restaurant.com',
        phone: '0903333444',
        status: 'active'
      },
      {
        id: 3,
        name: 'Lê Phương',
        role: 'Nhân Viên',
        email: 'phuong@restaurant.com',
        phone: '0905555666',
        status: 'inactive'
      }
    ];
  }

  getPaymentHistory(): PaymentHistoryItem[] {
    return [
      {
        billCode: 'HD-240290',
        tableName: 'Bàn 06',
        total: 980000,
        method: 'Thẻ',
        paidAt: '2026-03-25 11:25',
        staffName: 'Trần Anh'
      },
      {
        billCode: 'HD-240291',
        tableName: 'Bàn 02',
        total: 1245000,
        method: 'Tiền mặt',
        paidAt: '2026-03-25 12:10',
        staffName: 'Nguyễn Bình'
      },
      {
        billCode: 'HD-240292',
        tableName: 'Bàn 09',
        total: 730000,
        method: 'Chuyển khoản',
        paidAt: '2026-03-25 13:42',
        staffName: 'Lê Phương'
      }
    ];
  }

  getShiftRecords(): ShiftRecord[] {
    return [
      {
        id: 1,
        date: '2026-03-23',
        startTime: '08:00',
        endTime: '16:00',
        totalBills: 45,
        revenue: 24800000,
        status: 'closed'
      },
      {
        id: 2,
        date: '2026-03-24',
        startTime: '16:00',
        endTime: '23:00',
        totalBills: 52,
        revenue: 31200000,
        status: 'closed'
      }
    ];
  }
}
