import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
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
    MatCardModule, MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, ReactiveFormsModule, FormsModule,
    CurrencyPipe, DatePipe, RouterLink
  ],
  template: `
    @if (table(); as currentTable) {
      <section class="workspace">
        <!-- ═══ LEFT: Menu Browser ═══ -->
        <div class="menu-side">
          <!-- Category tabs -->
          <div class="cat-tabs">
            @for (cat of categories(); track cat) {
              <button class="cat-tab" [class.active]="selectedCategory() === cat" (click)="selectedCategory.set(cat)">
                {{ cat }}
              </button>
            }
          </div>

          <!-- Search -->
          <div class="search-bar">
            <mat-icon>search</mat-icon>
            <input type="text" placeholder="Search menu..." [value]="searchQuery()" (input)="searchQuery.set(asInputValue($event))">
          </div>

          <!-- Menu items grid -->
          <div class="menu-grid">
            @for (item of visibleItems(); track item.id) {
              <button class="menu-item" (click)="addItem(item)">
                <div class="item-info">
                  <span class="item-name">{{ item.name }}</span>
                  <span class="item-price">{{ item.price | currency : 'VND' : 'symbol' : '1.0-0' }}</span>
                </div>
                <div class="add-icon"><mat-icon>add</mat-icon></div>
              </button>
            }
            @if (visibleItems().length === 0) {
              <p class="no-items">No items found</p>
            }
          </div>
        </div>

        <!-- ═══ RIGHT: Receipt / Cart ═══ -->
        <div class="bill-side">
          <!-- Bill Header -->
          <div class="bill-header">
            <div class="bill-title-row">
              <div class="table-badge">{{ currentTable.name }}</div>
              <span class="status-chip" [class]="currentTable.status">{{ statusLabel(currentTable.status) }}</span>
            </div>
            @if (session(); as s) {
              <div class="bill-meta">
                <span><mat-icon class="mi">people</mat-icon> {{ s.guests }} guests</span>
                <span><mat-icon class="mi">receipt</mat-icon> {{ s.billCode }}</span>
                <span><mat-icon class="mi">schedule</mat-icon> {{ s.openedAt | date : 'HH:mm' }}</span>
              </div>
            }
          </div>

          @if (session(); as currentSession) {
            <!-- Order items -->
            <div class="order-list">
              @if (currentSession.orders.length === 0) {
                <div class="empty-cart">
                  <mat-icon>restaurant_menu</mat-icon>
                  <p>Add items from the menu</p>
                </div>
              } @else {
                @for (order of currentSession.orders; track order.id) {
                  <div class="order-row">
                    <div class="order-info">
                      <span class="order-name">{{ order.name }}</span>
                      <span class="order-price">{{ order.price | currency : 'VND' : 'symbol' : '1.0-0' }} each</span>
                    </div>
                    <div class="order-controls">
                      <button class="qty-btn" (click)="updateQty(order.id, order.quantity - 1)"><mat-icon>remove</mat-icon></button>
                      <span class="qty-val">{{ order.quantity }}</span>
                      <button class="qty-btn" (click)="updateQty(order.id, order.quantity + 1)"><mat-icon>add</mat-icon></button>
                      <button class="remove-btn" (click)="removeItem(order.id)"><mat-icon>delete_outline</mat-icon></button>
                    </div>
                    <span class="order-subtotal">{{ order.price * order.quantity | currency : 'VND' : 'symbol' : '1.0-0' }}</span>
                  </div>
                }
              }
            </div>

            <!-- Notes -->
            <div class="notes-section">
              <mat-icon class="mi">notes</mat-icon>
              <input type="text" class="notes-input" placeholder="Special requests / notes..." [(ngModel)]="orderNote">
            </div>

            <!-- Totals -->
            <div class="totals">
              <div class="total-row"><span>Subtotal</span><span>{{ subtotal() | currency : 'VND' : 'symbol' : '1.0-0' }}</span></div>
              <div class="total-row"><span>Tax (10%)</span><span>{{ tax() | currency : 'VND' : 'symbol' : '1.0-0' }}</span></div>
              <div class="total-row grand"><span>Total</span><span>{{ grandTotal() | currency : 'VND' : 'symbol' : '1.0-0' }}</span></div>
            </div>

            <!-- Action Buttons -->
            <div class="bill-actions">
              <button class="action-secondary" (click)="sendKitchen()">
                <mat-icon>kitchen</mat-icon> Send to Kitchen
              </button>
              <button class="action-primary" [disabled]="currentSession.orders.length === 0" (click)="openCheckoutPopup()">
                <mat-icon>point_of_sale</mat-icon> Checkout
              </button>
            </div>
          } @else {
            <div class="empty-cart full">
              <mat-icon>table_restaurant</mat-icon>
              <p>Open the table to start taking orders</p>
              <button class="action-primary" (click)="showOpenPopup.set(true)">
                <mat-icon>add_circle</mat-icon> Open Table
              </button>
            </div>
          }

          <!-- Back button -->
          <a class="back-link" routerLink="/staff/tables" [replaceUrl]="true">
            <mat-icon>arrow_back</mat-icon> Back to Tables
          </a>
        </div>
      </section>

      <!-- ═══ Guest Count Popup ═══ -->
      @if (showOpenPopup()) {
        <div class="backdrop" (click)="showOpenPopup.set(false)">
          <div class="modal" (click)="$event.stopPropagation()">
            <h3>Open {{ currentTable.name }}</h3>
            <p class="modal-sub">Enter the number of guests to begin.</p>
            <form [formGroup]="openForm" (ngSubmit)="openTable()" class="modal-form">
              <div class="guest-grid">
                @for (n of guestOptions; track n) {
                  @if (n <= currentTable.capacity) {
                    <button type="button" class="guest-btn" [class.active]="openForm.controls.guests.value === n"
                      (click)="openForm.controls.guests.setValue(n)">{{ n }}</button>
                  }
                }
              </div>
              <div class="modal-actions">
                <button type="button" class="cancel-btn" (click)="showOpenPopup.set(false)">Cancel</button>
                <button type="submit" class="confirm-btn" [disabled]="openForm.invalid">Continue</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- ═══ Checkout Popup ═══ -->
      @if (showCheckoutPopup()) {
        <div class="backdrop" (click)="showCheckoutPopup.set(false)">
          <div class="modal checkout-modal" (click)="$event.stopPropagation()">
            <h3>Payment</h3>
            <p class="modal-sub">Total: {{ grandTotal() | currency : 'VND' : 'symbol' : '1.0-0' }}</p>

            <label class="modal-label">Payment Method</label>
            <div class="payment-grid">
              @for (method of paymentMethods; track method) {
                <button type="button" class="pay-option" [class.active]="selectedPaymentMethod() === method"
                  (click)="selectedPaymentMethod.set(method)">
                  <mat-icon>{{ paymentIcon(method) }}</mat-icon>
                  {{ method }}
                </button>
              }
            </div>

            @if (selectedPaymentMethod() === 'Cash') {
              <label class="modal-label">Amount Received</label>
              <div class="cash-input-row">
                <input type="number" class="cash-input" [min]="grandTotal()" [(ngModel)]="receivedAmount" placeholder="0">
              </div>
              @if (receivedAmount >= grandTotal()) {
                <p class="change-line">Change: {{ receivedAmount - grandTotal() | currency : 'VND' : 'symbol' : '1.0-0' }}</p>
              }
            }

            <div class="modal-actions">
              <button type="button" class="cancel-btn" (click)="showCheckoutPopup.set(false)">Cancel</button>
              <button type="button" class="confirm-btn" [disabled]="selectedPaymentMethod() === 'Cash' && receivedAmount < grandTotal()" (click)="checkout()">
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      }
    } @else {
      <section class="fallback">
        <mat-icon>error_outline</mat-icon>
        <h2>Table not found</h2>
        <a class="action-primary" routerLink="/staff/tables" [replaceUrl]="true">Back to Tables</a>
      </section>
    }
  `,
  styles: [`
    /* ─── Layout ─── */
    .workspace {
      display: grid; gap: 0;
      grid-template-columns: 1fr 420px;
      min-height: calc(100vh - 80px);
    }

    /* ─── Menu Side ─── */
    .menu-side {
      display: flex; flex-direction: column; gap: 16px;
      padding: 20px; background: #f8fafc; overflow-y: auto;
    }

    .cat-tabs {
      display: flex; gap: 8px; flex-wrap: wrap;
    }
    .cat-tab {
      padding: 8px 18px; border-radius: 20px; border: 1px solid #e2e8f0;
      background: #fff; font-size: 14px; font-weight: 500; color: #475569;
      cursor: pointer; transition: all 0.15s;
    }
    .cat-tab:hover { border-color: #ff6a33; color: #ff6a33; }
    .cat-tab.active { background: #ff6a33; color: #fff; border-color: #ff6a33; }

    .search-bar {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 14px; background: #fff; border-radius: 12px;
      border: 1px solid #e2e8f0;
    }
    .search-bar mat-icon { color: #94a3b8; font-size: 20px; width: 20px; height: 20px; }
    .search-bar input {
      flex: 1; border: none; outline: none; font-size: 14px; color: #1e293b;
      background: transparent;
    }

    .menu-grid {
      display: grid; gap: 10px;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    }

    .menu-item {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px; background: #fff; border: 1px solid #e2e8f0;
      border-radius: 14px; cursor: pointer; transition: all 0.15s; text-align: left;
    }
    .menu-item:hover { border-color: #ff6a33; box-shadow: 0 2px 8px rgba(255,106,51,0.1); }
    .item-info { display: flex; flex-direction: column; gap: 2px; }
    .item-name { font-size: 14px; font-weight: 600; color: #1e293b; }
    .item-price { font-size: 13px; color: #ff6a33; font-weight: 700; }
    .add-icon {
      width: 36px; height: 36px; border-radius: 10px; border: 1px solid #e2e8f0;
      display: grid; place-items: center; color: #64748b; flex-shrink: 0;
    }
    .menu-item:hover .add-icon { background: #ff6a33; border-color: #ff6a33; color: #fff; }
    .no-items { color: #94a3b8; text-align: center; grid-column: 1/-1; padding: 40px 0; }

    /* ─── Bill Side ─── */
    .bill-side {
      display: flex; flex-direction: column;
      background: #1a1d24; color: #e2e8f0;
      border-left: 1px solid #2d3039;
    }

    .bill-header {
      padding: 18px 20px; border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .bill-title-row {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;
    }
    .table-badge {
      background: #ff6a33; color: #fff; padding: 6px 14px;
      border-radius: 20px; font-weight: 700; font-size: 14px;
    }
    .status-chip {
      padding: 4px 12px; border-radius: 20px; font-size: 11px;
      font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .status-chip.available { background: rgba(16,185,129,0.15); color: #34d399; }
    .status-chip.serving { background: rgba(245,158,11,0.15); color: #fbbf24; }
    .status-chip.pending-payment { background: rgba(239,68,68,0.15); color: #f87171; }

    .bill-meta {
      display: flex; gap: 14px; flex-wrap: wrap; font-size: 12px; color: #94a3b8;
    }
    .bill-meta span { display: flex; align-items: center; gap: 4px; }
    .mi { font-size: 15px; width: 15px; height: 15px; }

    /* ─── Order List ─── */
    .order-list {
      flex: 1; overflow-y: auto; padding: 12px 20px;
    }
    .empty-cart {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 8px; padding: 40px 0; color: #475569;
    }
    .empty-cart.full { flex: 1; }
    .empty-cart mat-icon { font-size: 48px; width: 48px; height: 48px; color: #334155; }
    .empty-cart p { margin: 0; font-size: 14px; }

    .order-row {
      display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
      padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .order-info { flex: 1; min-width: 100px; }
    .order-name { display: block; font-size: 14px; font-weight: 600; color: #f1f5f9; }
    .order-price { font-size: 12px; color: #64748b; }
    .order-controls { display: flex; align-items: center; gap: 6px; }
    .qty-btn {
      width: 28px; height: 28px; border-radius: 8px; border: 1px solid #374151;
      background: transparent; color: #94a3b8; cursor: pointer;
      display: grid; place-items: center;
    }
    .qty-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .qty-btn:hover { border-color: #ff6a33; color: #ff6a33; }
    .qty-val { font-size: 14px; font-weight: 700; color: #f1f5f9; min-width: 20px; text-align: center; }
    .remove-btn {
      width: 28px; height: 28px; border-radius: 8px; border: none;
      background: rgba(239,68,68,0.1); color: #f87171; cursor: pointer;
      display: grid; place-items: center;
    }
    .remove-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .remove-btn:hover { background: rgba(239,68,68,0.25); }
    .order-subtotal { font-size: 14px; font-weight: 700; color: #ff6a33; min-width: 90px; text-align: right; }

    /* ─── Notes ─── */
    .notes-section {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 20px; border-top: 1px solid rgba(255,255,255,0.06);
    }
    .notes-section .mi { color: #64748b; }
    .notes-input {
      flex: 1; border: none; outline: none; background: transparent;
      color: #cbd5e1; font-size: 13px;
    }
    .notes-input::placeholder { color: #475569; }

    /* ─── Totals ─── */
    .totals {
      padding: 14px 20px; border-top: 1px solid rgba(255,255,255,0.06);
    }
    .total-row {
      display: flex; justify-content: space-between; font-size: 14px;
      color: #94a3b8; margin-bottom: 6px;
    }
    .total-row.grand {
      margin-top: 10px; padding-top: 10px;
      border-top: 1px solid rgba(255,255,255,0.1);
      font-size: 22px; font-weight: 800; color: #ff6a33;
    }

    /* ─── Actions ─── */
    .bill-actions {
      display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
      padding: 14px 20px;
    }
    .action-secondary, .action-primary {
      display: flex; align-items: center; justify-content: center; gap: 6px;
      padding: 12px; border-radius: 12px; font-size: 14px; font-weight: 600;
      cursor: pointer; transition: all 0.15s; border: none;
    }
    .action-secondary {
      background: #2d3039; color: #e2e8f0;
    }
    .action-secondary:hover { background: #3b3f4a; }
    .action-primary {
      background: #ff6a33; color: #fff;
    }
    .action-primary:hover { background: #e85d2a; }
    .action-primary:disabled { background: #374151; color: #64748b; cursor: not-allowed; }
    .action-primary mat-icon, .action-secondary mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .back-link {
      display: flex; align-items: center; gap: 6px; padding: 12px 20px;
      color: #64748b; font-size: 13px; text-decoration: none; border-top: 1px solid rgba(255,255,255,0.06);
    }
    .back-link:hover { color: #cbd5e1; }
    .back-link mat-icon { font-size: 18px; width: 18px; height: 18px; }

    /* ─── Backdrop + Modal ─── */
    .backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5);
      display: grid; place-items: center; z-index: 1000;
    }
    .modal {
      width: min(92vw, 420px); background: #fff; border-radius: 20px;
      padding: 28px; text-align: center; color: #1e293b;
    }
    .modal h3 { margin: 0 0 4px; font-size: 20px; font-weight: 700; }
    .modal-sub { margin: 0 0 20px; color: #64748b; font-size: 14px; }
    .modal-label {
      display: block; text-align: left; font-size: 13px; font-weight: 600;
      color: #475569; margin-bottom: 8px;
    }
    .modal-form { display: flex; flex-direction: column; gap: 16px; }

    .guest-grid {
      display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px;
    }
    .guest-btn {
      width: 100%; aspect-ratio: 1; border-radius: 12px; border: 1px solid #e2e8f0;
      background: #f8fafc; font-size: 18px; font-weight: 700; color: #475569;
      cursor: pointer; transition: all 0.15s; display: grid; place-items: center;
    }
    .guest-btn:hover { border-color: #ff6a33; color: #ff6a33; }
    .guest-btn.active { background: #ff6a33; color: #fff; border-color: #ff6a33; }

    .modal-actions { display: flex; gap: 10px; margin-top: 8px; }
    .cancel-btn {
      flex: 1; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0;
      background: #fff; font-size: 15px; font-weight: 600; color: #64748b; cursor: pointer;
    }
    .confirm-btn {
      flex: 1; padding: 12px; border-radius: 12px; border: none;
      background: #ff6a33; font-size: 15px; font-weight: 600; color: #fff; cursor: pointer;
    }
    .confirm-btn:hover { background: #e85d2a; }
    .confirm-btn:disabled { background: #e2e8f0; color: #94a3b8; cursor: not-allowed; }

    /* Checkout modal */
    .checkout-modal { text-align: left; }
    .checkout-modal h3, .checkout-modal .modal-sub { text-align: center; }
    .payment-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px;
    }
    .pay-option {
      display: flex; align-items: center; gap: 8px;
      padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0;
      background: #f8fafc; font-size: 14px; color: #475569; cursor: pointer;
    }
    .pay-option mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .pay-option:hover { border-color: #ff6a33; }
    .pay-option.active { border-color: #ff6a33; background: #fff7ed; color: #ea580c; font-weight: 600; }
    .cash-input-row { margin-bottom: 12px; }
    .cash-input {
      width: 100%; padding: 12px; border: 1px solid #e2e8f0; border-radius: 12px;
      font-size: 16px; color: #1e293b; outline: none;
    }
    .cash-input:focus { border-color: #ff6a33; }
    .change-line { color: #10b981; font-weight: 600; font-size: 15px; margin: 0 0 12px; }

    /* Fallback */
    .fallback {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 12px; padding: 60px; text-align: center; color: #64748b;
    }
    .fallback mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .fallback h2 { margin: 0; color: #1e293b; }

    @media (max-width: 900px) {
      .workspace { grid-template-columns: 1fr; }
      .bill-side { border-left: none; border-top: 1px solid #2d3039; }
    }
  `],
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
  readonly searchQuery = signal('');
  readonly showOpenPopup = signal(false);
  readonly showCheckoutPopup = signal(false);
  readonly selectedPaymentMethod = signal<PaymentMethod>('Cash');
  readonly paymentMethods: PaymentMethod[] = ['Cash', 'Card', 'Transfer', 'E-Wallet'];
  readonly guestOptions = Array.from({ length: 10 }, (_, i) => i + 1);
  orderNote = '';
  receivedAmount = 0;

  readonly visibleItems = computed(() => {
    const category = this.selectedCategory();
    const query = this.searchQuery().toLowerCase().trim();
    let items = this.menuItems();
    if (category) {
      items = items.filter(item => item.category === category);
    }
    if (query) {
      items = items.filter(item => item.name.toLowerCase().includes(query));
    }
    return items;
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
      this.router.navigateByUrl('/staff/tables', { replaceUrl: true });
      return;
    }

    if (this.table()!.status === 'available' && !this.session()) {
      this.showOpenPopup.set(true);
    }
  }

  asInputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  openTable(): void {
    if (this.openForm.invalid || !this.table()) return;
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

  updateQty(orderId: number, newQty: number): void {
    this.sessionService.updateOrderQuantity(this.tableId(), orderId, newQty);
  }

  removeItem(orderId: number): void {
    this.sessionService.removeOrder(this.tableId(), orderId);
  }

  sendKitchen(): void {
    this.sessionService.markPendingPayment(this.tableId());
  }

  openCheckoutPopup(): void {
    if (!this.session()) return;
    this.receivedAmount = 0;
    this.showCheckoutPopup.set(true);
  }

  checkout(): void {
    this.sessionService.closeTable(
      this.tableId(),
      this.selectedPaymentMethod(),
      this.authService.fullName() ?? 'Staff User'
    );
    this.showCheckoutPopup.set(false);
    this.router.navigateByUrl('/staff/tables', { replaceUrl: true });
  }

  paymentIcon(method: PaymentMethod): string {
    switch (method) {
      case 'Cash': return 'payments';
      case 'Card': return 'credit_card';
      case 'Transfer': return 'account_balance';
      case 'E-Wallet': return 'account_balance_wallet';
      default: return 'payment';
    }
  }

  statusLabel(status: TableStatus): string {
    if (status === 'available') return 'Free';
    if (status === 'serving') return 'Serving';
    if (status === 'pending-payment') return 'Pending Payment';
    return 'Disabled';
  }
}
