import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';
import { TableStatus } from '../../core/models/app.models';
import { TableSessionService } from '../../core/services/table-session.service';

@Component({
  selector: 'app-waiter-tables',
  standalone: true,
  imports: [MatCardModule, MatButtonModule],
  template: `
    <section class="rms-page">
      <div class="page-header">
        <h2>Sơ đồ bàn</h2>
        <p>Chọn bàn để mở trang xử lý gọi món & thanh toán.</p>
      </div>

      <section class="table-grid">
        @for (table of tables(); track table.id) {
          <mat-card [class]="table.status" (click)="openWorkspace(table.id)">
            <mat-card-content>
              <h3>{{ table.name }}</h3>
              <p>{{ table.capacity }} chỗ • {{ table.area }}</p>
              <p>Trạng thái: {{ statusLabel(table.status) }}</p>
              @if (table.guests) {
                <p>{{ table.guests }} khách</p>
              }
              <button mat-stroked-button>Mở workspace</button>
            </mat-card-content>
          </mat-card>
        }
      </section>
    </section>
  `,
  styles: [
    `
      .rms-page {
        display: grid;
        gap: 16px;
      }

      .page-header p {
        margin: 4px 0 0;
        color: #6b7280;
      }

      .table-grid {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      }

      mat-card {
        cursor: pointer;
      }

      mat-card.available {
        border: 2px solid #10b981;
      }

      mat-card.serving {
        border: 2px solid #f59e0b;
      }

      mat-card.pending-payment {
        border: 2px solid #ef4444;
      }

      mat-card.disabled {
        border: 2px solid #9ca3af;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WaiterTablesComponent {
  private readonly tableSessionService = inject(TableSessionService);
  private readonly router = inject(Router);

  readonly tables = this.tableSessionService.tables;

  openWorkspace(tableId: number): void {
    this.router.navigate(['/staff/tables', tableId]);
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

    return 'Hủy';
  }
}
