import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MenuItem, PaymentMethod, TableStatus } from '../../core/models/app.models';
import { TableSessionService } from '../../core/services/table-session.service';

@Component({
  selector: 'app-staff-table-workspace',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    CurrencyPipe,
    DatePipe,
    RouterLink
  ],
  template: `
    @if (table(); as currentTable) {
      <section class="workspace">
        <aside class="left-panel">
          <div class="menu-head">
            <h3>Menu</h3>
            <p>Select Category</p>
          </div>

          @for (category of categories(); track category) {
            <button
              class="category-btn"
              [class.active]="selectedCategory() === category"
              type="button"
              (click)="selectedCategory.set(category)"
            >
              {{ category }}
            </button>
          }

          <button class="back-btn" routerLink="/staff/tables">← Back to Tables</button>
        </aside>

        <main class="center-panel">
          <div class="center-header">
            <h2>{{ selectedCategory() }}</h2>
            <span>{{ visibleItems().length }} items</span>
          </div>

          <div class="menu-grid">
            @for (item of visibleItems(); track item.id) {
              <article class="menu-card">
                <button type="button" class="plus-btn" (click)="addItem(item)">+</button>
                <h4>{{ item.name }}</h4>
                <p>{{ item.price | currency : 'USD' : 'symbol' : '1.0-0' }}</p>
              </article>
            }
          </div>
        </main>

        <aside class="bill-panel">
          <div class="bill-head">
            <div class="table-badge">{{ currentTable.name }}</div>
            <span class="status" [class.pending]="currentTable.status === 'pending-payment'">{{ statusLabel(currentTable.status) }}</span>
          </div>

          @if (session(); as currentSession) {
            <div class="session-meta">
              <span>👥 {{ currentSession.guests }}</span>
              <span>ID: {{ currentSession.billCode }}</span>
              <span>{{ currentSession.openedAt | date : 'HH:mm a' }}</span>
            </div>

            @if (currentSession.orders.length === 0) {
              <div class="empty-order">ADD MENU ITEMS</div>
            } @else {
              <div class="order-list">
                @for (order of currentSession.orders; track order.id) {
                  <div class="order-row">
                    <span>{{ order.name }} x{{ order.quantity }}</span>
                    <span>{{ order.price * order.quantity | currency : 'USD' : 'symbol' : '1.0-0' }}</span>
                  </div>
                }
              </div>
            }

            <div class="totals">
              <div><span>SUBTOTAL</span><span>{{ subtotal() | currency : 'USD' : 'symbol' : '1.0-0' }}</span></div>
              <div><span>TAX (10%)</span><span>{{ tax() | currency : 'USD' : 'symbol' : '1.0-0' }}</span></div>
              <div class="grand"><span>Total</span><span>{{ grandTotal() | currency : 'USD' : 'symbol' : '1.0-0' }}</span></div>
            </div>

            <div class="bill-actions">
              <button mat-stroked-button (click)="sendKitchen()">SEND</button>
              <button mat-flat-button color="primary" (click)="openCheckoutPopup()">CHECKOUT</button>
            </div>
          } @else {
            <div class="empty-order">Mở bàn để bắt đầu</div>
          }
        </aside>
      </section>

      @if (showOpenPopup()) {
        <div class="popup-backdrop" (click)="showOpenPopup.set(false)">
          <div class="open-popup" (click)="$event.stopPropagation()">
            <h3>Mở bàn {{ currentTable.name }}</h3>
            <p>Nhập số lượng khách để bắt đầu session.</p>
            <form [formGroup]="openForm" (ngSubmit)="openTable()" class="open-form">
              <mat-form-field appearance="outline">
                <mat-label>Số lượng khách</mat-label>
                <input matInput type="number" min="1" [max]="currentTable.capacity" formControlName="guests" />
              </mat-form-field>
              <div class="popup-actions">
                <button mat-stroked-button type="button" (click)="showOpenPopup.set(false)">Hủy</button>
                <button mat-flat-button color="primary" type="submit" [disabled]="openForm.invalid">Mở bàn</button>
              </div>
            </form>
          </div>
        </div>
      }

      @if (showCheckoutPopup()) {
        <div class="popup-backdrop" (click)="showCheckoutPopup.set(false)">
          <div class="open-popup" (click)="$event.stopPropagation()">
            <h3>Thanh toán hóa đơn</h3>
            <p>Chọn phương thức thanh toán để lưu vào lịch sử.</p>

            <div class="payment-options">
              @for (method of paymentMethods; track method) {
                <button
                  type="button"
                  class="payment-option"
                  [class.active]="selectedPaymentMethod() === method"
                  (click)="selectedPaymentMethod.set(method)"
                >
                  {{ method }}
                </button>
              }
            </div>

            <div class="popup-actions">
              <button mat-stroked-button type="button" (click)="showCheckoutPopup.set(false)">Hủy</button>
              <button mat-flat-button color="primary" type="button" (click)="checkout()">Xác nhận</button>
            </div>
          </div>
        </div>
      }
    } @else {
      <section class="fallback">
        <h2>Không tìm thấy bàn</h2>
        <button mat-flat-button color="primary" routerLink="/staff/tables">Quay lại sơ đồ bàn</button>
      </section>
    }
  `,
  styles: [
    `
      .workspace {
        display: grid;
        gap: 16px;
        grid-template-columns: 280px 1fr 460px;
      }

      .left-panel,
      .center-panel,
      .bill-panel {
        border-radius: 28px;
      }

      .left-panel {
        background: #f3f4f6;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .menu-head {
        padding: 18px;
        border-radius: 20px;
        background: #242528;
        color: white;
      }

      .menu-head p {
        margin: 6px 0 0;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-size: 12px;
        color: #cbd5e1;
      }

      .category-btn {
        border: none;
        border-radius: 16px;
        background: #ffffff;
        padding: 16px;
        text-align: left;
        font-size: 30px;
        font: inherit;
        cursor: pointer;
      }

      .category-btn.active {
        background: #ff6a33;
        color: white;
        font-weight: 600;
      }

      .back-btn {
        margin-top: auto;
        border: none;
        border-radius: 16px;
        background: #ffffff;
        padding: 16px;
        text-align: left;
        cursor: pointer;
        font: inherit;
      }

      .center-panel {
        background: #f3f4f6;
        padding: 24px;
      }

      .center-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }

      .center-header span {
        background: #e5e7eb;
        border-radius: 999px;
        padding: 6px 14px;
        color: #64748b;
        text-transform: uppercase;
        font-size: 12px;
        font-weight: 600;
      }

      .open-form {
        display: grid;
        gap: 10px;
      }

      .menu-grid {
        display: grid;
        gap: 14px;
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      }

      .menu-card {
        background: #ebedf0;
        border-radius: 20px;
        padding: 14px;
        text-align: center;
      }

      .menu-card h4 {
        margin: 14px 0 10px;
        font-size: 28px;
        font-size: 28px;
        font-size: 30px;
        font-size: 22px;
      }

      .menu-card p {
        margin: 0;
        color: #ff6a33;
        font-size: 22px;
        font-weight: 700;
      }

      .plus-btn {
        width: 60px;
        height: 60px;
        border-radius: 18px;
        border: 1px solid #d1d5db;
        font-size: 32px;
        background: #f8fafc;
        cursor: pointer;
      }

      .bill-panel {
        background: #16181d;
        color: #e5e7eb;
        overflow: hidden;
      }

      .bill-head {
        padding: 22px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }

      .table-badge {
        background: #ff6a33;
        color: white;
        border-radius: 999px;
        padding: 8px 14px;
        font-weight: 700;
      }

      .status {
        font-size: 12px;
        color: #94a3b8;
      }

      .status.pending {
        color: #fb923c;
      }

      .session-meta {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        padding: 12px 22px;
        font-size: 13px;
        color: #cbd5e1;
      }

      .empty-order {
        margin: 16px 22px;
        padding: 24px;
        border-radius: 16px;
        text-align: center;
        border: 1px dashed rgba(148, 163, 184, 0.4);
        color: #64748b;
        font-weight: 700;
        letter-spacing: 1px;
      }

      .order-list {
        max-height: 260px;
        overflow: auto;
        padding: 0 22px;
      }

      .order-row {
        display: flex;
        justify-content: space-between;
        border-bottom: 1px solid rgba(148, 163, 184, 0.2);
        padding: 10px 0;
      }

      .totals {
        padding: 18px 22px;
        border-top: 1px solid rgba(148, 163, 184, 0.2);
      }

      .totals > div {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
      }

      .totals .grand {
        margin-top: 14px;
        padding-top: 12px;
        border-top: 1px solid rgba(148, 163, 184, 0.2);
        font-size: 32px;
        font-weight: 800;
        color: #ff6a33;
      }

      .bill-actions {
        padding: 0 22px 22px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }

      .popup-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(2, 6, 23, 0.42);
        display: grid;
        place-items: center;
        z-index: 999;
      }

      .open-popup {
        width: min(92vw, 460px);
        border-radius: 20px;
        background: #ffffff;
        padding: 20px;
      }

      .open-popup p {
        color: #64748b;
        margin: 6px 0 12px;
      }

      .popup-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }

      .payment-options {
        display: grid;
        gap: 8px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        margin-bottom: 14px;
      }

      .payment-option {
        border: 1px solid #cbd5e1;
        border-radius: 12px;
        padding: 10px;
        background: #f8fafc;
        cursor: pointer;
      }

      .payment-option.active {
        border-color: #fb923c;
        background: #fff7ed;
        color: #ea580c;
        font-weight: 600;
      }

      .fallback {
        display: grid;
        gap: 10px;
        justify-content: center;
        padding: 40px;
      }

      @media (max-width: 1400px) {
        .workspace {
          grid-template-columns: 1fr;
        }
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StaffTableWorkspaceComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sessionService = inject(TableSessionService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly tableId = signal(Number(this.route.snapshot.paramMap.get('tableId')) || 0);
  readonly table = computed(() => this.sessionService.getTableById(this.tableId()));
  readonly session = computed(() => this.sessionService.getSessionByTable(this.tableId()));
  readonly menuItems = this.sessionService.menuItems;

  readonly categories = computed(() => {
    const cats = Array.from(new Set(this.menuItems().map(item => item.category)));
    return cats.length ? cats : ['Menu'];
  });

  readonly selectedCategory = signal('');
  readonly showOpenPopup = signal(false);
  readonly showCheckoutPopup = signal(false);
  readonly selectedPaymentMethod = signal<PaymentMethod>('Tiền mặt');
  readonly paymentMethods: PaymentMethod[] = ['Tiền mặt', 'Thẻ', 'Chuyển khoản', 'Ví điện tử'];

  readonly visibleItems = computed(() => {
    const category = this.selectedCategory();
    const items = this.menuItems();
    if (!category) {
      return items;
    }
    return items.filter(item => item.category === category);
  });

  readonly openForm = this.fb.nonNullable.group({
    guests: [2, [Validators.required, Validators.min(1), Validators.max(20)]]
  });

  readonly subtotal = computed(() => this.sessionService.getBillTotal(this.session()));
  readonly tax = computed(() => this.sessionService.getBillTax(this.session()));
  readonly grandTotal = computed(() => this.subtotal() + this.tax());

  constructor() {
    const firstCategory = this.categories()[0] ?? '';
    this.selectedCategory.set(firstCategory);

    if (!this.table()) {
      this.router.navigateByUrl('/staff/tables');
      return;
    }

    if (this.table()!.status === 'available' && !this.session()) {
      this.showOpenPopup.set(true);
    }
  }

  openTable(): void {
    if (this.openForm.invalid || !this.table()) {
      return;
    }
    const guests = this.openForm.getRawValue().guests;
    this.sessionService.openTable(this.table()!.id, guests);
    this.showOpenPopup.set(false);
  }

  addItem(item: MenuItem): void {
    if (!this.session()) {
      if (this.table()?.status === 'available') {
        this.showOpenPopup.set(true);
      }
      return;
    }
    this.sessionService.addOrder(this.tableId(), item.id, 1);
  }

  sendKitchen(): void {
    this.sessionService.markPendingPayment(this.tableId());
  }

  openCheckoutPopup(): void {
    if (!this.session()) {
      return;
    }
    this.showCheckoutPopup.set(true);
  }

  checkout(): void {
    this.sessionService.closeTable(
      this.tableId(),
      this.selectedPaymentMethod(),
      this.authService.fullName() ?? 'Staff User'
    );
    this.showCheckoutPopup.set(false);
    this.router.navigateByUrl('/staff/tables');
  }

  statusLabel(status: TableStatus): string {
    if (status === 'available') {
      return 'Đóng';
    }
    if (status === 'serving') {
      return 'Đang mở';
    }
    if (status === 'pending-payment') {
      return 'Chờ thanh toán';
    }
    return 'Không hoạt động';
  }
}
