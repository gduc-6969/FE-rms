import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MockDataService } from '../../core/services/mock-data.service';

@Component({
  selector: 'app-customer-menu',
  standalone: true,
  imports: [MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, FormsModule, CurrencyPipe],
  template: `
    <section class="menu-page">
      <header class="section-title">Our Menu</header>

      <mat-form-field appearance="outline" class="search-field">
        <mat-label>Tìm món ăn</mat-label>
        <input matInput [(ngModel)]="keyword" placeholder="Nhập tên món..." />
      </mat-form-field>

      <div class="category-pills">
        @for (category of categories; track category) {
          <button
            type="button"
            [class.active]="selectedCategory === category"
            (click)="selectedCategory = category"
          >
            {{ category }}
          </button>
        }
      </div>

      <section class="menu-grid">
        @for (item of filteredItems; track item.id) {
          <mat-card>
            <div class="dish-image"></div>
            <mat-card-content>
              <h3>{{ item.name }}</h3>
              <p>{{ item.price | currency : 'USD' : 'symbol' : '1.0-0' }}</p>
            </mat-card-content>
          </mat-card>
        }
      </section>
    </section>
  `,
  styles: [
    `
      .menu-page {
        display: grid;
        gap: 14px;
      }

      .section-title {
        background: #f8fafc;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 16px;
        font-size: 30px;
      }

      .search-field {
        width: 100%;
      }

      .category-pills {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .category-pills button {
        border: none;
        border-radius: 999px;
        padding: 8px 16px;
        background: #e5e7eb;
        cursor: pointer;
      }

      .category-pills button.active {
        background: #ff6a33;
        color: #fff;
      }

      .menu-grid {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .dish-image {
        height: 180px;
        background: linear-gradient(120deg, #475569 0%, #0f172a 100%);
        border-radius: 14px 14px 0 0;
      }

      h3 {
        margin: 0;
      }

      mat-card p {
        margin: 6px 0 0;
        font-weight: 600;
        color: #ff6a33;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomerMenuComponent {
  keyword = '';
  selectedCategory = 'All';
  readonly categories = ['All', 'Appetizers', 'Mains', 'Desserts'];
  private readonly menuItems = this.mockData.getMenuItems();

  get filteredItems() {
    const keyword = this.keyword.trim().toLowerCase();
    const mappedItems = this.menuItems.map(item => ({
      ...item,
      uiCategory:
        item.category === 'Khai vị' ? 'Appetizers' : item.category === 'Món chính' ? 'Mains' : 'Desserts'
    }));

    const byCategory =
      this.selectedCategory === 'All'
        ? mappedItems
        : mappedItems.filter(item => item.uiCategory === this.selectedCategory);

    if (!keyword) {
      return byCategory;
    }

    return byCategory.filter(item => item.name.toLowerCase().includes(keyword));
  }

  constructor(private readonly mockData: MockDataService) {}
}
