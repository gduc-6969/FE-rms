import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, OnDestroy, OnInit,
  computed, inject, signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  ApiMenuItem, CategoryResponse,
  WorkspaceApiService
} from '../../core/services/workspace-api.service';
import { forkJoin, Observable, of } from 'rxjs';

interface CartItem {
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
}

type BackendPaymentMethod = 'tien_mat' | 'the' | 'chuyen_khoan' | 'vi_dien_tu';

const PAYMENT_METHODS: { label: string; value: BackendPaymentMethod; icon: string }[] = [
  { label: 'Cash', value: 'tien_mat', icon: 'payments' },
  { label: 'Card', value: 'the', icon: 'credit_card' },
  { label: 'Transfer', value: 'chuyen_khoan', icon: 'account_balance' },
  { label: 'E-Wallet', value: 'vi_dien_tu', icon: 'account_balance_wallet' },
];

@Component({
  selector: 'app-staff-table-workspace',
  standalone: true,
  imports: [MatIconModule, FormsModule, CurrencyPipe, RouterLink],
  template: `
    @if (tableInfo(); as t) {
      <section class="workspace">
        <!-- ═══ LEFT: Menu Browser ═══ -->
        <div class="menu-side">
          <!-- Category tabs -->
          <div class="cat-tabs">
            <button class="cat-tab" [class.active]="selectedCategoryId() === null"
              (click)="selectCategory(null)">All</button>
            @for (cat of categories(); track cat.id) {
              <button class="cat-tab"
                [class.active]="selectedCategoryId() === cat.id"
                (click)="selectCategory(cat.id)">{{ cat.name }}</button>
            }
          </div>

          <!-- Search -->
          <div class="search-bar">
            <mat-icon>search</mat-icon>
            <input type="text" placeholder="Search menu..."
              [value]="searchQuery()"
              (input)="onSearchChange(asStr($event))">
          </div>

          <!-- Loading menu -->
          @if (menuLoading()) {
            <div class="menu-loading">
              <mat-icon class="spin-icon">sync</mat-icon>
              <span>Loading menu...</span>
            </div>
          }

          <!-- Menu items grid -->
          @if (!menuLoading()) {
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
              @if (visibleItems().length === 0 && !menuLoading()) {
                <p class="no-items">No items found</p>
              }
            </div>
          }
        </div>

        <!-- ═══ RIGHT: Receipt / Cart ═══ -->
        <div class="bill-side">
          <!-- Bill Header -->
          <div class="bill-header">
            <div class="bill-title-row">
              <div class="table-badge">{{ t.tableCode }}</div>
              <span class="serving-chip">SERVING</span>
            </div>
            <div class="bill-meta">
              <span><mat-icon class="mi">people</mat-icon> {{ t.capacity }} seats</span>
              @if (invoiceId()) {
                <span><mat-icon class="mi">receipt</mat-icon> #{{ invoiceId() }}</span>
              }
            </div>
          </div>

          <!-- Invoice creating state -->
          @if (invoiceLoading()) {
            <div class="empty-cart full">
              <mat-icon class="spin-icon">sync</mat-icon>
              <p>Opening table...</p>
            </div>
          }

          @if (!invoiceLoading()) {
            <!-- Order items -->
            <div class="order-list">
              @if (cart().length === 0) {
                <div class="empty-cart">
                  <mat-icon>restaurant_menu</mat-icon>
                  <p>Add items from the menu</p>
                </div>
              } @else {
                @for (item of cart(); track item.menuItemId) {
                  <div class="order-row">
                    <div class="order-info">
                      <span class="order-name">{{ item.name }}</span>
                      <span class="order-price">{{ item.price | currency : 'VND' : 'symbol' : '1.0-0' }} each</span>
                    </div>
                    <div class="order-controls">
                      <button class="qty-btn" (click)="decreaseQty(item)"><mat-icon>remove</mat-icon></button>
                      <span class="qty-val">{{ item.quantity }}</span>
                      <button class="qty-btn" (click)="increaseQty(item)"><mat-icon>add</mat-icon></button>
                      <button class="remove-btn" (click)="removeItem(item)"><mat-icon>delete_outline</mat-icon></button>
                    </div>
                    <span class="order-subtotal">{{ item.price * item.quantity | currency : 'VND' : 'symbol' : '1.0-0' }}</span>
                  </div>
                }
              }
            </div>

            <!-- Notes -->
            <div class="notes-section">
              <mat-icon class="mi">notes</mat-icon>
              <input type="text" class="notes-input" placeholder="Special requests / notes..." [(ngModel)]="orderNote">
            </div>

            <!-- Discount Section -->
            <div class="discount-section">
              <div class="discount-row">
                <mat-icon class="mi">local_offer</mat-icon>
                <input type="number" class="discount-input" placeholder="Discount amount"
                  [value]="discountAmount()"
                  (input)="discountAmount.set(asNum($event))"
                  [min]="0" [max]="subtotal()">
              </div>
              @if (discount() > 0) {
                <input type="text" class="discount-reason-input" placeholder="Discount reason..."
                  [value]="discountReason()"
                  (input)="discountReason.set(asStr($event))">
              }
            </div>

            <!-- Totals -->
            <div class="totals">
              <div class="total-row"><span>Subtotal</span><span>{{ subtotal() | currency : 'VND' : 'symbol' : '1.0-0' }}</span></div>
              @if (discount() > 0) {
                <div class="total-row discount-row"><span>Discount</span><span>-{{ discount() | currency : 'VND' : 'symbol' : '1.0-0' }}</span></div>
              }
              <div class="total-row"><span>Tax (10%)</span><span>{{ tax() | currency : 'VND' : 'symbol' : '1.0-0' }}</span></div>
              <div class="total-row grand"><span>Total</span><span>{{ grandTotal() | currency : 'VND' : 'symbol' : '1.0-0' }}</span></div>
            </div>

            <!-- Checkout button -->
            <div class="bill-actions">
              <button class="action-checkout"
                [disabled]="cart().length === 0 || checkoutLoading()"
                (click)="showCheckoutPopup.set(true)">
                <mat-icon>point_of_sale</mat-icon>
                @if (checkoutLoading()) { Processing... } @else { Checkout }
              </button>
            </div>
          }

          <!-- Back button -->
          <a class="back-link" routerLink="/staff/tables">
            <mat-icon>arrow_back</mat-icon> Back to Tables
          </a>
        </div>
      </section>

      <!-- ═══ Checkout Popup ═══ -->
      @if (showCheckoutPopup()) {
        <div class="backdrop" (click)="showCheckoutPopup.set(false)">
          <div class="modal checkout-modal" (click)="$event.stopPropagation()">
            <h3>Payment</h3>
            <p class="modal-sub">Total: <strong>{{ grandTotal() | currency : 'VND' : 'symbol' : '1.0-0' }}</strong></p>

            <label class="modal-label">Payment Method</label>
            <div class="payment-grid">
              @for (method of paymentMethods; track method.value) {
                <button type="button" class="pay-option"
                  [class.active]="selectedPaymentMethod() === method.value"
                  (click)="selectedPaymentMethod.set(method.value)">
                  <mat-icon>{{ method.icon }}</mat-icon>
                  {{ method.label }}
                </button>
              }
            </div>

            @if (checkoutError()) {
              <p class="checkout-error">{{ checkoutError() }}</p>
            }

            <div class="modal-actions">
              <button type="button" class="cancel-btn" (click)="showCheckoutPopup.set(false)">Cancel</button>
              <button type="button" class="confirm-checkout-btn"
                [disabled]="!canConfirmPayment() || checkoutLoading()"
                (click)="checkout()">
                @if (checkoutLoading()) { Processing... } @else { Confirm Payment }
              </button>
            </div>
          </div>
        </div>
      }

    } @else {
      <!-- Table not found / load error -->
      <section class="fallback">
        @if (tableLoading()) {
          <mat-icon class="spin-icon">sync</mat-icon>
          <p>Loading table info...</p>
        } @else {
          <mat-icon>error_outline</mat-icon>
          <h2>Table not found</h2>
          <a class="action-primary" routerLink="/staff/tables">Back to Tables</a>
        }
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

    .cat-tabs { display: flex; gap: 8px; flex-wrap: wrap; }
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

    .menu-loading {
      display: flex; align-items: center; gap: 10px;
      color: #64748b; font-size: 14px; padding: 20px;
    }
    .menu-loading mat-icon { color: #ff6a33; }

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
    .serving-chip {
      background: rgba(234,179,8,0.15); color: #fbbf24;
      padding: 4px 12px; border-radius: 20px; font-size: 11px;
      font-weight: 700; letter-spacing: 0.5px;
    }
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

    /* ─── Discount Section ─── */
    .discount-section {
      padding: 10px 20px; border-top: 1px solid rgba(255,255,255,0.06);
      display: flex; flex-direction: column; gap: 8px;
    }
    .discount-row {
      display: flex; align-items: center; gap: 8px;
    }
    .discount-row .mi { color: #10b981; }
    .discount-input {
      flex: 1; border: 1px solid #374151; outline: none;
      background: rgba(255,255,255,0.03); color: #cbd5e1;
      font-size: 13px; padding: 8px 12px; border-radius: 8px;
    }
    .discount-input::placeholder { color: #475569; }
    .discount-input:focus { border-color: #10b981; }
    .discount-reason-input {
      border: 1px solid #374151; outline: none;
      background: rgba(255,255,255,0.03); color: #cbd5e1;
      font-size: 12px; padding: 6px 12px; border-radius: 6px;
    }
    .discount-reason-input::placeholder { color: #475569; }
    .discount-reason-input:focus { border-color: #10b981; }

    /* ─── Totals ─── */
    .totals { padding: 14px 20px; border-top: 1px solid rgba(255,255,255,0.06); }
    .total-row {
      display: flex; justify-content: space-between; font-size: 14px;
      color: #94a3b8; margin-bottom: 6px;
    }
    .total-row.discount-row { color: #10b981; }
    .total-row.grand {
      margin-top: 10px; padding-top: 10px;
      border-top: 1px solid rgba(255,255,255,0.1);
      font-size: 22px; font-weight: 800; color: #ff6a33;
    }

    /* ─── Checkout Button ─── */
    .bill-actions { padding: 14px 20px; }
    .action-checkout {
      width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
      padding: 14px; border-radius: 14px; border: none;
      background: #ff6a33; color: #fff; font-size: 15px; font-weight: 700;
      cursor: pointer; transition: all 0.2s;
    }
    .action-checkout:hover:not(:disabled) { background: #e85d2a; }
    .action-checkout:disabled { background: #374151; color: #64748b; cursor: not-allowed; }
    .action-checkout mat-icon { font-size: 20px; width: 20px; height: 20px; }

    .back-link {
      display: flex; align-items: center; gap: 6px; padding: 12px 20px;
      color: #64748b; font-size: 13px; text-decoration: none;
      border-top: 1px solid rgba(255,255,255,0.06);
    }
    .back-link:hover { color: #cbd5e1; }
    .back-link mat-icon { font-size: 18px; width: 18px; height: 18px; }

    /* ─── Backdrop + Modal ─── */
    .backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5);
      display: grid; place-items: center; z-index: 1000;
    }
    .modal {
      width: min(92vw, 440px); background: #fff; border-radius: 20px;
      padding: 28px; text-align: center; color: #1e293b;
    }
    .modal h3 { margin: 0 0 4px; font-size: 20px; font-weight: 700; }
    .modal-sub { margin: 0 0 20px; color: #64748b; font-size: 14px; }
    .modal-sub strong { color: #ff6a33; font-size: 18px; }
    .modal-label {
      display: block; text-align: left; font-size: 13px; font-weight: 600;
      color: #475569; margin-bottom: 8px;
    }

    .payment-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; }
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
      font-size: 16px; color: #1e293b; outline: none; box-sizing: border-box;
    }
    .cash-input:focus { border-color: #ff6a33; }
    .change-line { color: #10b981; font-weight: 600; font-size: 15px; margin: 0 0 12px; }

    .checkout-error {
      color: #dc2626; font-size: 13px; margin: 0 0 12px;
      padding: 8px 12px; background: #fef2f2; border-radius: 8px;
    }

    .modal-actions { display: flex; gap: 10px; margin-top: 8px; }
    .cancel-btn {
      flex: 1; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0;
      background: #fff; font-size: 15px; font-weight: 600; color: #64748b; cursor: pointer;
    }
    .confirm-checkout-btn {
      flex: 1; padding: 12px; border-radius: 12px; border: none;
      background: #ff6a33; font-size: 15px; font-weight: 600; color: #fff; cursor: pointer;
    }
    .confirm-checkout-btn:hover:not(:disabled) { background: #e85d2a; }
    .confirm-checkout-btn:disabled { background: #e2e8f0; color: #94a3b8; cursor: not-allowed; }

    /* Fallback */
    .fallback {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 12px; padding: 60px; text-align: center; color: #64748b;
    }
    .fallback mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .fallback h2 { margin: 0; color: #1e293b; }
    .action-primary {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 12px 24px; border-radius: 12px;
      background: #ff6a33; color: #fff; font-weight: 600; text-decoration: none;
    }

    /* Spinner */
    @keyframes spin { 100% { transform: rotate(360deg); } }
    .spin-icon { animation: spin 1s linear infinite; }

    @media (max-width: 900px) {
      .workspace { grid-template-columns: 1fr; }
      .bill-side { border-left: none; border-top: 1px solid #2d3039; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StaffTableWorkspaceComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(WorkspaceApiService);

  readonly tableId = signal(Number(this.route.snapshot.paramMap.get('tableId')) || 0);

  // ─── Data signals ───
  readonly tableInfo = signal<{ id: number; tableCode: string; capacity: number; status: string } | null>(null);
  readonly categories = signal<CategoryResponse[]>([]);
  readonly allMenuItems = signal<ApiMenuItem[]>([]);
  readonly invoiceId = signal<number | null>(null);

  // ─── Loading states ───
  readonly tableLoading = signal(true);
  readonly menuLoading = signal(true);
  readonly invoiceLoading = signal(true);
  readonly checkoutLoading = signal(false);

  // ─── Cart ───
  readonly cart = signal<CartItem[]>([]);

  // ─── Filter ───
  readonly selectedCategoryId = signal<number | null>(null);
  readonly searchQuery = signal('');
  orderNote = '';

  // ─── Discount fields ───
  readonly discountAmount = signal(0);
  readonly discountReason = signal('');

  // ─── Checkout ───
  readonly showCheckoutPopup = signal(false);
  readonly selectedPaymentMethod = signal<BackendPaymentMethod>('tien_mat');
  readonly checkoutError = signal<string | null>(null);

  readonly paymentMethods = PAYMENT_METHODS;

  readonly visibleItems = computed(() => {
    const catId = this.selectedCategoryId();
    const q = this.searchQuery().toLowerCase().trim();
    let items = this.allMenuItems();
    if (catId !== null) {
      items = items.filter(i => i.categoryId === catId);
    }
    if (q) {
      items = items.filter(i => i.name.toLowerCase().includes(q));
    }
    return items;
  });

  readonly subtotal = computed(() =>
    this.cart().reduce((sum, i) => sum + i.price * i.quantity, 0)
  );
  readonly discount = computed(() => Math.max(0, Number(this.discountAmount()) || 0));
  readonly tax = computed(() => Math.round((this.subtotal() - this.discount()) * 0.1));
  readonly grandTotal = computed(() => Math.max(0, this.subtotal() - this.discount() + this.tax()));

  readonly canConfirmPayment = computed(() => {
    return true;
  });

  ngOnInit(): void {
    const id = this.tableId();
    if (!id) {
      this.router.navigateByUrl('/staff/tables', { replaceUrl: true });
      return;
    }

    // Load table info + categories + menu items in parallel
    forkJoin({
      table: this.api.getTableById(id),
      categories: this.api.getCategories(),
      menuItems: this.api.getAllAvailableMenuItems()
    }).subscribe({
      next: ({ table, categories, menuItems }) => {
        this.tableInfo.set(table);
        this.categories.set(categories);
        this.allMenuItems.set(menuItems);
        this.tableLoading.set(false);
        this.menuLoading.set(false);

        // Try finding an existing open invoice first (bàn đang phục vụ)
        // If none found, create a new one (bàn vừa được mở)
        this.api.getOpenInvoiceByTable(id).subscribe({
          next: (inv) => {
            this.invoiceId.set(inv.id);
            this.invoiceLoading.set(false);
          },
          error: () => {
            // No open invoice → create a new one
            this.api.createInvoice(id).subscribe({
              next: (inv) => {
                this.invoiceId.set(inv.id);
                this.invoiceLoading.set(false);
              },
              error: (err) => {
                console.error('Failed to create invoice:', err);
                this.invoiceLoading.set(false);
              }
            });
          }
        });
      },
      error: (err) => {
        console.error('Failed to load workspace data:', err);
        this.tableLoading.set(false);
        this.menuLoading.set(false);
        this.invoiceLoading.set(false);
      }
    });
  }

  ngOnDestroy(): void {}

  selectCategory(id: number | null): void {
    this.selectedCategoryId.set(id);
  }

  asStr(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  asNum(event: Event): number {
    return Number((event.target as HTMLInputElement).value) || 0;
  }

  onSearchChange(q: string): void {
    this.searchQuery.set(q);
  }

  addItem(item: ApiMenuItem): void {
    const existing = this.cart().find(c => c.menuItemId === item.id);
    if (existing) {
      this.cart.update(cart =>
        cart.map(c => c.menuItemId === item.id
          ? { ...c, quantity: c.quantity + 1 }
          : c
        )
      );
    } else {
      this.cart.update(cart => [
        ...cart,
        { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 }
      ]);
    }
  }

  increaseQty(item: CartItem): void {
    this.cart.update(cart =>
      cart.map(c => c.menuItemId === item.menuItemId
        ? { ...c, quantity: c.quantity + 1 }
        : c
      )
    );
  }

  decreaseQty(item: CartItem): void {
    if (item.quantity <= 1) {
      this.removeItem(item);
      return;
    }
    this.cart.update(cart =>
      cart.map(c => c.menuItemId === item.menuItemId
        ? { ...c, quantity: c.quantity - 1 }
        : c
      )
    );
  }

  removeItem(item: CartItem): void {
    this.cart.update(cart => cart.filter(c => c.menuItemId !== item.menuItemId));
  }

  checkout(): void {
    const invId = this.invoiceId();
    const tableId = this.tableId();
    if (!invId || this.cart().length === 0 || this.checkoutLoading()) return;

    this.checkoutLoading.set(true);
    this.checkoutError.set(null);

    const items = this.cart().map(c => ({
      menuItemId: c.menuItemId,
      quantity: c.quantity
    }));

    // Step 1: Create order
    this.api.createOrder(invId, items).subscribe({
      next: () => {
        // Step 2: Always update invoice to calculate correct tong_tien (includes tax)
        this.createPaymentAndFinish(invId, tableId);
      },
      error: (err: any) => {
        console.error('Order creation failed:', err);
        this.checkoutLoading.set(false);
        this.checkoutError.set('Failed to save order. Please try again.');
      }
    });
  }

  private createPaymentAndFinish(invId: number, tableId: number): void {
    // QUAN TRỌNG: Phải reload invoice để lấy tam_tinh (subtotal) chính xác từ backend
    // Vì backend trigger tự động tính tam_tinh từ tất cả order items, không khớp với cart frontend
    this.api.getInvoiceById(invId).subscribe({
      next: (invoice) => {
        const realSubtotal = invoice.subtotal;  // tam_tinh từ backend
        const discount = this.discount();
        const taxAmount = Math.round((realSubtotal - discount) * 0.1);  // Tính tax dựa trên subtotal thực
        const correctTotal = realSubtotal - discount + taxAmount;  // Total chính xác
        
        // Workaround: Backend không có field tax, nên ta phải:
        // adjustedDiscount = discount - tax để backend tính: tong_tien = subtotal - (discount - tax) = subtotal - discount + tax
        const adjustedDiscount = discount - taxAmount;
        const discountReason = discount > 0 
          ? (this.discountReason() || `Discount: ${discount}, Tax: ${taxAmount}`)
          : `Tax 10%: ${taxAmount}`;
        
        // Update invoice with adjusted discount that includes tax calculation
        this.api.updateInvoiceDiscount(invId, tableId, adjustedDiscount, discountReason).subscribe({
          next: () => {
            // Step 3: Create payment with correct total
            this.api.createPayment(
              invId,
              correctTotal,  // Dùng total tính từ backend subtotal
              this.selectedPaymentMethod()
            ).subscribe({
              next: () => {
                // Step 4: Reset table to trong
                this.api.updateTableStatus(tableId, 'trong').subscribe({
                  next: () => {
                    this.checkoutLoading.set(false);
                    this.showCheckoutPopup.set(false);
                    this.router.navigateByUrl('/staff/tables', { replaceUrl: true });
                  },
                  error: (err: any) => {
                    console.error('Failed to reset table status:', err);
                    this.checkoutLoading.set(false);
                    this.showCheckoutPopup.set(false);
                    // Payment was successful so still navigate back
                    this.router.navigateByUrl('/staff/tables', { replaceUrl: true });
                  }
                });
              },
              error: (err: any) => {
                console.error('Payment failed:', err);
                this.checkoutLoading.set(false);
                this.checkoutError.set('Payment failed. Please try again.');
              }
            });
          },
          error: (err: any) => {
            console.error('Discount update failed:', err);
            this.checkoutLoading.set(false);
            this.checkoutError.set('Failed to apply discount. Please try again.');
          }
        });
      },
      error: (err: any) => {
        console.error('Failed to load invoice:', err);
        this.checkoutLoading.set(false);
        this.checkoutError.set('Failed to load invoice data. Please try again.');
      }
    });
  }
}