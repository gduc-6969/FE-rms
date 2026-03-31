import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  AfterViewInit,
  OnDestroy,
  OnInit,
  ElementRef,
  ViewChild,
  inject,
  signal,
  DestroyRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { ReportService } from '../../core/services/report.service';
import {
  ReportSummaryResponse,
  MonthlyReportResponse,
  CategoryReportResponse,
  BestSellerResponse
} from '../../core/models/report.models';

declare const Chart: any;

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    CurrencyPipe,
    DecimalPipe
  ],
  template: `
    <section class="rms-page">

      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h2 class="page-title">Reports &amp; Analytics</h2>
          <p class="page-sub">Analyze restaurant performance</p>
        </div>
        <div class="header-actions">
          <mat-form-field appearance="outline" class="year-select">
            <mat-label>Year</mat-label>
            <mat-select [value]="selectedYear()" (selectionChange)="onYearChange($event.value)">
              @for (year of availableYears; track year) {
                <mat-option [value]="year">{{ year }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <button class="btn-export" (click)="exportExcel()">
            <mat-icon>download</mat-icon>
            Export
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="48"></mat-spinner>
          <span>Loading report data...</span>
        </div>
      } @else {
        <!-- Stats Row -->
        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-label">Total Revenue ({{ selectedYear() }})</div>
            <div class="stat-value">{{ summary()?.totalRevenue | currency:'VND':'symbol':'1.0-0' }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Avg Order Value</div>
            <div class="stat-value">{{ summary()?.avgOrderValue | currency:'VND':'symbol':'1.0-0' }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Total Orders</div>
            <div class="stat-value">{{ summary()?.totalOrders | number }}</div>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="charts-row">
          <!-- Bar Chart -->
          <div class="chart-card">
            <h3 class="chart-title">Monthly Revenue &amp; Orders</h3>
            <div class="chart-wrap">
              <canvas #barCanvas></canvas>
            </div>
            <div class="chart-legend">
              <span class="legend-dot" style="background:#ff5f2e"></span> Revenue
              <span class="legend-dot" style="background:#f59e0b; margin-left:14px"></span> Orders
            </div>
          </div>

          <!-- Pie Chart -->
          <div class="chart-card">
            <h3 class="chart-title">Sales by Category</h3>
            <div class="chart-wrap pie-wrap">
              <canvas #pieCanvas></canvas>
            </div>
          </div>
        </div>

        <!-- Best-Selling Dishes -->
        <div class="section-title">Best-Selling Dishes</div>
        <div class="table-card">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Dish</th>
                <th>Sales</th>
                <th>Revenue</th>
                <th>Contribution</th>
              </tr>
            </thead>
            <tbody>
              @for (dish of bestSellers(); track dish.rank) {
                <tr>
                  <td><span class="rank">#{{ dish.rank }}</span></td>
                  <td class="td-name">{{ dish.name }}</td>
                  <td class="td-sales">{{ dish.sales }} orders</td>
                  <td class="td-revenue">{{ dish.revenue | currency:'VND':'symbol':'1.0-0' }}</td>
                  <td>
                    <div class="contrib-cell">
                      <div class="progress-bar">
                        <div class="progress-fill" [style.width]="dish.percentage + '%'"></div>
                      </div>
                      <span class="contrib-pct">{{ dish.percentage | number:'1.1-1' }}%</span>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="no-data">No data available</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Export Cards -->
        <div class="export-row">
          <div class="export-card" (click)="exportExcel()">
            <div class="export-icon">
              <mat-icon>download</mat-icon>
            </div>
            <div>
              <div class="export-title">Export as Excel</div>
              <div class="export-sub">Download full report (.xlsx)</div>
            </div>
          </div>
          <div class="export-card" (click)="exportPdf()">
            <div class="export-icon">
              <mat-icon>download</mat-icon>
            </div>
            <div>
              <div class="export-title">Export as PDF</div>
              <div class="export-sub">Download printable report (.pdf)</div>
            </div>
          </div>
        </div>
      }

    </section>
  `,
  styles: [`
    :host {
      --accent:   #ff5f2e;
      --accent-h: #e04e20;
      --green:    #22c55e;
      --border:   #e5e7eb;
      --text:     #111827;
      --muted:    #6b7280;
      --bg:       #f4f5f7;
      --surface:  #ffffff;
    }

    .rms-page {
      display: grid; gap: 20px;
      padding: 28px 32px;
      background: var(--bg); min-height: 100%;
    }

    /* ── Loading ── */
    .loading-container {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 16px; padding: 60px 0; color: var(--muted);
    }

    /* ── Header ── */
    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between;
    }
    .page-title { font-size: 18px; font-weight: 700; color: var(--text); margin: 0; }
    .page-sub   { font-size: 12.5px; color: var(--muted); margin: 4px 0 0; }
    .header-actions { display: flex; gap: 10px; align-items: center; }

    .year-select {
      width: 100px;
    }
    .year-select ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }

    .btn-export {
      display: inline-flex; align-items: center; gap: 6px;
      background: var(--accent); color: #fff;
      border: none; border-radius: 10px; padding: 10px 20px;
      font-size: 13.5px; font-weight: 600; cursor: pointer;
      font-family: inherit; transition: background .18s;
    }
    .btn-export mat-icon { font-size: 17px; width: 17px; height: 17px; line-height: 1; }
    .btn-export:hover { background: var(--accent-h); }

    /* ── Stats Row ── */
    .stats-row {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;
    }
    .stat-card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 14px; padding: 18px 22px;
      box-shadow: 0 1px 4px rgba(0,0,0,.04);
    }
    .stat-label { font-size: 12px; color: var(--muted); font-weight: 500; }
    .stat-value { font-size: 26px; font-weight: 700; color: var(--text); margin: 6px 0 4px; }
    .stat-trend {
      display: flex; align-items: center; gap: 3px;
      font-size: 12.5px; font-weight: 600;
    }
    .stat-trend mat-icon { font-size: 14px; width: 14px; height: 14px; line-height: 1; }
    .stat-trend.up { color: var(--green); }

    /* ── Charts Row ── */
    .charts-row {
      display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
    }
    .chart-card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 14px; padding: 22px;
      box-shadow: 0 1px 4px rgba(0,0,0,.04);
    }
    .chart-title { font-size: 14px; font-weight: 700; color: var(--text); margin: 0 0 16px; }
    .chart-wrap { position: relative; height: 240px; }
    .pie-wrap   { display: flex; align-items: center; justify-content: center; }
    .chart-legend {
      display: flex; align-items: center; gap: 6px;
      margin-top: 12px; font-size: 12px; color: var(--muted);
    }
    .legend-dot {
      display: inline-block; width: 12px; height: 12px; border-radius: 3px;
    }

    /* ── Section title ── */
    .section-title {
      font-size: 16px; font-weight: 700; color: var(--text);
      margin-bottom: -8px;
    }

    /* ── Best-Selling Table ── */
    .table-card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 14px; overflow: hidden;
      box-shadow: 0 1px 6px rgba(0,0,0,.05);
    }
    table { width: 100%; border-collapse: collapse; }
    thead tr { border-bottom: 1px solid var(--border); }
    th {
      text-align: left; padding: 12px 20px;
      font-size: 11.5px; font-weight: 600; color: var(--muted);
      text-transform: uppercase; letter-spacing: .05em;
    }
    tbody tr { border-bottom: 1px solid var(--border); transition: background .12s; }
    tbody tr:last-child { border-bottom: none; }
    tbody tr:hover { background: #fafafa; }
    td { padding: 16px 20px; font-size: 13.5px; }

    .rank { font-weight: 700; color: var(--accent); font-size: 13px; }
    .td-name    { font-weight: 500; color: var(--text); }
    .td-sales   { color: var(--muted); }
    .td-revenue { font-weight: 600; color: var(--accent); }

    .contrib-cell {
      display: flex; align-items: center; gap: 10px;
    }
    .progress-bar {
      flex: 1; height: 6px; background: #f3f4f6; border-radius: 10px; overflow: hidden;
      max-width: 120px;
    }
    .progress-fill {
      height: 100%; background: var(--accent); border-radius: 10px;
      transition: width .4s ease;
    }
    .contrib-pct { font-size: 12.5px; color: var(--muted); font-weight: 500; min-width: 36px; }

    .no-data {
      text-align: center;
      color: var(--muted);
      padding: 32px !important;
    }

    /* ── Export Cards ── */
    .export-row {
      display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
    }
    .export-card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 14px; padding: 18px 22px;
      display: flex; align-items: center; gap: 16px; cursor: pointer;
      box-shadow: 0 1px 4px rgba(0,0,0,.04);
      transition: box-shadow .18s, transform .15s;
    }
    .export-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,.09); transform: translateY(-2px); }
    .export-icon {
      width: 44px; height: 44px; border-radius: 12px;
      background: #fff3f0; color: var(--accent);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .export-icon mat-icon { font-size: 22px; width: 22px; height: 22px; line-height: 1; }
    .export-title { font-size: 14px; font-weight: 700; color: var(--text); }
    .export-sub   { font-size: 12px; color: var(--muted); margin-top: 2px; }

    /* ── Responsive ── */
    @media (max-width: 800px) {
      .rms-page  { padding: 16px; }
      .stats-row { grid-template-columns: repeat(2, 1fr); }
      .charts-row, .export-row { grid-template-columns: 1fr; }
      .page-header { flex-direction: column; gap: 12px; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportsComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly reportService = inject(ReportService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('barCanvas') barCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pieCanvas') pieCanvas!: ElementRef<HTMLCanvasElement>;

  private barChart: any;
  private pieChart: any;

  // State signals
  readonly loading = signal(true);
  readonly selectedYear = signal(new Date().getFullYear());
  readonly summary = signal<ReportSummaryResponse | null>(null);
  readonly bestSellers = signal<BestSellerResponse[]>([]);
  readonly monthlyData = signal<MonthlyReportResponse[]>([]);
  readonly categoryData = signal<CategoryReportResponse[]>([]);

  // Year dropdown options
  readonly availableYears = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.loadChartJs().then(() => {
      if (!this.loading()) {
        this.buildCharts();
      }
    });
  }

  ngOnDestroy(): void {
    this.barChart?.destroy();
    this.pieChart?.destroy();
  }

  onYearChange(year: number): void {
    this.selectedYear.set(year);
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    const year = this.selectedYear();

    forkJoin({
      summary: this.reportService.getSummary(year),
      monthly: this.reportService.getMonthlyReport(year),
      category: this.reportService.getCategoryReport(year),
      bestSellers: this.reportService.getBestSellers(year, 5)
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.summary.set(data.summary);
          this.monthlyData.set(data.monthly || []);
          this.categoryData.set(data.category || []);
          this.bestSellers.set(data.bestSellers || []);
          this.loading.set(false);
          this.cdr.markForCheck();

          // Rebuild charts after data loaded
          setTimeout(() => this.buildCharts(), 100);
        },
        error: (err) => {
          console.error('Error loading report data:', err);
          this.loading.set(false);
          this.cdr.markForCheck();
        }
      });
  }

  private loadChartJs(): Promise<void> {
    return new Promise(resolve => {
      if (typeof Chart !== 'undefined') { resolve(); return; }
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js';
      s.onload = () => resolve();
      document.head.appendChild(s);
    });
  }

  private buildCharts(): void {
    this.buildBarChart();
    this.buildPieChart();
  }

  private buildBarChart(): void {
    if (!this.barCanvas?.nativeElement) return;

    // Destroy existing chart
    this.barChart?.destroy();

    const monthlyData = this.monthlyData();
    if (!monthlyData.length) return;

    const ctx = this.barCanvas.nativeElement.getContext('2d')!;
    const labels = monthlyData.map(m => m.month);
    const revenues = monthlyData.map(m => m.revenue || 0);
    const orders = monthlyData.map(m => m.orders || 0);

    const maxRevenue = Math.max(...revenues) * 1.2 || 100000;
    const maxOrders = Math.max(...orders) * 1.2 || 100;

    this.barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Revenue',
            data: revenues,
            backgroundColor: '#ff5f2e',
            borderRadius: 6,
            barThickness: 24
          },
          {
            label: 'Orders',
            data: orders,
            backgroundColor: '#f59e0b',
            borderRadius: 6,
            barThickness: 24,
            yAxisID: 'y2'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#9ca3af', font: { size: 11 } } },
          y: {
            grid: { color: '#f3f4f6' },
            ticks: {
              color: '#9ca3af',
              font: { size: 10 },
              callback: (v: number) => {
                if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M';
                if (v >= 1000) return (v / 1000).toFixed(0) + 'K';
                return v;
              }
            },
            min: 0,
            max: maxRevenue
          },
          y2: { display: false, min: 0, max: maxOrders }
        }
      }
    });
  }

  private buildPieChart(): void {
    if (!this.pieCanvas?.nativeElement) return;

    // Destroy existing chart
    this.pieChart?.destroy();

    const categoryData = this.categoryData();
    if (!categoryData.length) return;

    const ctx = this.pieCanvas.nativeElement.getContext('2d')!;
    const labels = categoryData.map(c => c.categoryName);
    const values = categoryData.map(c => c.percentage || 0);

    // Color palette
    const colors = ['#ff5f2e', '#f59e0b', '#2dd4bf', '#a3e635', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

    this.pieChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: colors.slice(0, categoryData.length),
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#6b7280', font: { size: 11 }, padding: 12 }
          }
        }
      }
    });
  }

  exportExcel(): void {
  const year = this.selectedYear();
  this.reportService.exportExcel(year).subscribe({
    next: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${year}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    },
    error: () => alert('Export Excel failed')
  });
}

exportPdf(): void {
  const year = this.selectedYear();
  this.reportService.exportPdf(year).subscribe({
    next: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${year}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    },
    error: () => alert('Export PDF failed')
  });
}
}