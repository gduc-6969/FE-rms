import { Injectable, computed, signal } from '@angular/core';
import { DiningTable, MenuItem, OrderLineItem, PaymentHistoryItem, PaymentMethod, ShiftRecord, TableSession } from '../models/app.models';
import { MockDataService } from './mock-data.service';

@Injectable({
  providedIn: 'root'
})
export class TableSessionService {
  readonly tables = signal<DiningTable[]>([]);
  readonly sessions = signal<TableSession[]>([]);
  readonly menuItems = signal<MenuItem[]>([]);
  readonly paymentHistory = signal<PaymentHistoryItem[]>([]);
  readonly shiftHistory = signal<ShiftRecord[]>([]);
  readonly isShiftOpen = signal(false);

  private readonly shiftStartedAt = signal<Date | null>(null);
  private shiftBaseline = {
    closedSessionCount: 0,
    orderQuantity: 0,
    paidAmount: 0
  };

  constructor(private readonly mockData: MockDataService) {
    this.tables.set(
      this.mockData.getDiningTables().map(table => ({
        ...table,
        status: 'available',
        guests: undefined,
        elapsedMinutes: undefined
      }))
    );
    this.menuItems.set(this.mockData.getMenuItems().filter(item => item.status === 'available'));
    this.paymentHistory.set(this.mockData.getPaymentHistory());
    this.shiftHistory.set(this.mockData.getShiftRecords());
  }

  readonly activeSessions = computed(() => this.sessions().filter(session => session.status === 'open'));
  readonly closedSessions = computed(() => this.sessions().filter(session => session.status === 'closed'));

  readonly totalTablesServed = computed(() => this.closedSessions().length);
  readonly totalOrdersPerformed = computed(() =>
    this.closedSessions().reduce(
      (sum, session) => sum + session.orders.reduce((orderSum, order) => orderSum + order.quantity, 0),
      0
    )
  );
  readonly totalPaidAmount = computed(() => this.paymentHistory().reduce((sum, item) => sum + item.total, 0));

  getTableById(tableId: number): DiningTable | undefined {
    return this.tables().find(item => item.id === tableId);
  }

  getSessionByTable(tableId: number): TableSession | undefined {
    return this.activeSessions().find(session => session.tableId === tableId);
  }

  openTable(tableId: number, guests: number): TableSession | null {
    const table = this.tables().find(item => item.id === tableId);
    if (!table || table.status !== 'available') {
      return null;
    }

    const now = new Date();
    const nextSessionId = Math.max(...this.sessions().map(item => item.id), 0) + 1;
    const billCode = `HD-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(nextSessionId).padStart(3, '0')}`;

    const session: TableSession = {
      id: nextSessionId,
      billCode,
      tableId,
      tableName: table.name,
      guests,
      openedAt: now.toISOString(),
      status: 'open',
      orders: []
    };

    this.sessions.update(items => [session, ...items]);
    this.tables.update(items =>
      items.map(item =>
        item.id === tableId
          ? {
              ...item,
              status: 'serving',
              guests,
              elapsedMinutes: 0
            }
          : item
      )
    );

    return session;
  }

  closeTable(tableId: number, paymentMethod?: PaymentMethod, staffName = 'Staff User'): void {
    const now = new Date().toISOString();
    const currentSession = this.getSessionByTable(tableId);
    const total = this.getBillTotal(currentSession);
    const tax = this.getBillTax(currentSession);

    this.sessions.update(items =>
      items.map(item =>
        item.tableId === tableId && item.status === 'open'
          ? {
              ...item,
              status: 'closed',
              closedAt: now
            }
          : item
      )
    );

    this.tables.update(items =>
      items.map(item =>
        item.id === tableId
          ? {
              ...item,
              status: 'available',
              guests: undefined,
              elapsedMinutes: undefined
            }
          : item
      )
    );

    if (currentSession && paymentMethod) {
      this.paymentHistory.update(items => [
        {
          billCode: currentSession.billCode,
          tableName: currentSession.tableName,
          total: total + tax,
          method: paymentMethod,
          paidAt: this.formatDateTime(new Date()),
          staffName
        },
        ...items
      ]);
    }
  }

  markPendingPayment(tableId: number): void {
    this.tables.update(items =>
      items.map(item =>
        item.id === tableId
          ? {
              ...item,
              status: 'pending-payment'
            }
          : item
      )
    );
  }

  addOrder(tableId: number, menuItemId: number, quantity: number, note?: string): void {
    const menuItem = this.menuItems().find(item => item.id === menuItemId);
    if (!menuItem || quantity <= 0) {
      return;
    }

    this.sessions.update(items =>
      items.map(session => {
        if (session.tableId !== tableId || session.status !== 'open') {
          return session;
        }

        const existing = session.orders.find(order => order.menuItemId === menuItemId && order.note === (note ?? ''));
        if (existing) {
          return {
            ...session,
            orders: session.orders.map(order =>
              order.id === existing.id
                ? {
                    ...order,
                    quantity: order.quantity + quantity
                  }
                : order
            )
          };
        }

        const nextOrderId = Math.max(...session.orders.map(order => order.id), 0) + 1;
        const order: OrderLineItem = {
          id: nextOrderId,
          menuItemId,
          name: menuItem.name,
          price: menuItem.price,
          quantity,
          note
        };

        return {
          ...session,
          orders: [...session.orders, order]
        };
      })
    );
  }

  getBillTotal(session: TableSession | undefined): number {
    if (!session) {
      return 0;
    }

    return session.orders.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  getBillTax(session: TableSession | undefined, taxRate = 0.1): number {
    return Math.round(this.getBillTotal(session) * taxRate);
  }

  openShift(): void {
    this.isShiftOpen.set(true);
    this.shiftStartedAt.set(new Date());
    this.shiftBaseline = {
      closedSessionCount: this.totalTablesServed(),
      orderQuantity: this.totalOrdersPerformed(),
      paidAmount: this.totalPaidAmount()
    };
  }

  closeShift(): void {
    const now = new Date();
    const startedAt = this.shiftStartedAt();

    const closedSessionsDelta = this.totalTablesServed() - this.shiftBaseline.closedSessionCount;
    const paidAmountDelta = this.totalPaidAmount() - this.shiftBaseline.paidAmount;

    const nextId = Math.max(...this.shiftHistory().map(item => item.id), 0) + 1;
    this.shiftHistory.update(items => [
      {
        id: nextId,
        date: now.toISOString().slice(0, 10),
        startTime: startedAt ? this.formatTime(startedAt) : this.formatTime(now),
        endTime: this.formatTime(now),
        totalBills: Math.max(0, closedSessionsDelta),
        revenue: Math.max(0, paidAmountDelta),
        status: 'closed'
      },
      ...items
    ]);

    this.isShiftOpen.set(false);
    this.shiftStartedAt.set(null);
    this.shiftBaseline = {
      closedSessionCount: this.totalTablesServed(),
      orderQuantity: this.totalOrdersPerformed(),
      paidAmount: this.totalPaidAmount()
    };
  }

  private formatDateTime(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  private formatTime(date: Date): string {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
}
