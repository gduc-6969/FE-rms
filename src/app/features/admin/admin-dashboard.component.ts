import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MockDataService } from '../../core/services/mock-data.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [MatCardModule, MatTableModule, MatChipsModule],
  template: `
    <h2>Dashboard Admin</h2>

    <section class="kpi-grid">
      @for (metric of kpis; track metric.label) {
        <mat-card>
          <mat-card-content>
            <p class="label">{{ metric.label }}</p>
            <h3>{{ metric.value }}</h3>
            <mat-chip color="primary">{{ metric.trend }}</mat-chip>
          </mat-card-content>
        </mat-card>
      }
    </section>

    <mat-card>
      <mat-card-header>
        <mat-card-title>Bàn realtime</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <table mat-table [dataSource]="tables" class="full-width">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Bàn</th>
            <td mat-cell *matCellDef="let row">{{ row.name }}</td>
          </ng-container>

          <ng-container matColumnDef="area">
            <th mat-header-cell *matHeaderCellDef>Khu vực</th>
            <td mat-cell *matCellDef="let row">{{ row.area }}</td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Trạng thái</th>
            <td mat-cell *matCellDef="let row">{{ row.status }}</td>
          </ng-container>

          <ng-container matColumnDef="guests">
            <th mat-header-cell *matHeaderCellDef>Khách</th>
            <td mat-cell *matCellDef="let row">{{ row.guests ?? '-' }}</td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
        </table>
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      .kpi-grid {
        display: grid;
        gap: 16px;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        margin-bottom: 16px;
      }

      .label {
        color: #6b7280;
        margin-bottom: 8px;
      }

      h3 {
        margin: 0 0 8px;
        font-size: 28px;
      }

      .full-width {
        width: 100%;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDashboardComponent {
  private readonly mockData = inject(MockDataService);

  readonly kpis = this.mockData.getAdminKpis();
  readonly tables = this.mockData.getDiningTables();
  readonly displayedColumns = ['name', 'area', 'status', 'guests'];
}
