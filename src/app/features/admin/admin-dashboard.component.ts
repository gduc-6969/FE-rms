import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  AfterViewInit,
  OnDestroy,
  DestroyRef,
  ElementRef,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DecimalPipe } from '@angular/common';
import { DashboardService } from '../../core/services/dashboard.service';
import { catchError, of } from 'rxjs';


declare const Chart: any;

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [MatIconModule, MatProgressSpinnerModule, DecimalPipe],
  template: `
    <section class="rms-page">

      <!-- Stats Row -->
      <div class="stats-row">

        <div class="stat-card">
          <div class="stat-top">
            <div class="stat-icon"><mat-icon>attach_money</mat-icon></div>
            <mat-icon class="trend-icon">trending_up</mat-icon>
          </div>
          <div class="stat-label">Revenue Today</div>
          <div class="stat-value">
            @if (loading()) { <mat-spinner diameter="24"/> }
            @else { {{ '$' + (summary().revenueToday | number:'1.0-0') }} }
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-top">
            <div class="stat-icon"><mat-icon>receipt_long</mat-icon></div>
            <mat-icon class="trend-icon">trending_up</mat-icon>
          </div>
          <div class="stat-label">Invoices Today</div>
          <div class="stat-value">
            @if (loading()) { <mat-spinner diameter="24"/> }
            @else { {{ summary().customersToday }} }
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-top">
            <div class="stat-icon"><mat-icon>table_restaurant</mat-icon></div>
          </div>
          <div class="stat-label">Table Occupancy</div>
          <div class="stat-value">
            @if (loading()) { <mat-spinner diameter="24"/> }
            @else { {{ summary().occupancyRate }}% }
          </div>
          <div class="occupancy-bar">
            <div class="occupancy-fill"
              [style.width]="summary().occupancyRate + '%'"></div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-top">
            <div class="stat-icon"><mat-icon>event</mat-icon></div>
          </div>
          <div class="stat-label">Active Reservations</div>
          <div class="stat-value">
            @if (loading()) { <mat-spinner diameter="24"/> }
            @else { {{ summary().activeReservations }} }
          </div>
          <div class="stat-note">For today</div>
        </div>

      </div>

      <!-- Charts Row -->
      <div class="charts-row">
        <div class="chart-card">
          <h3 class="chart-title">Revenue Trends</h3>
          <div class="chart-wrap">
            <canvas #lineCanvas></canvas>
          </div>
        </div>
        <div class="chart-card">
          <h3 class="chart-title">Peak Hours</h3>
          <div class="chart-wrap">
            <canvas #barCanvas></canvas>
          </div>
        </div>
      </div>

      <!-- Inventory Alerts -->
      <div class="alert-section">
        <div class="alert-header">
          <mat-icon class="alert-icon">warning_amber</mat-icon>
          <span class="alert-title">Inventory Alerts</span>
          <span class="alert-count">{{ inventoryAlerts().length }} items</span>
        </div>

        @if (inventoryAlerts().length === 0 && !loading()) {
          <div class="no-alerts">All ingredients are at safe levels</div>
        } @else {
          <div class="alert-grid">
            @for (alert of inventoryAlerts(); track alert.id) {
              <div class="alert-card">
                <div class="alert-row">
                  <span class="alert-name">{{ alert.name }}</span>
                  <span class="alert-badge" [class]="alert.level">
                    {{ alert.level === 'critical' ? 'Critical' : 'Low' }}
                  </span>
                </div>
                <div class="alert-remaining">
                  Remaining: {{ alert.stockQuantity }} {{ alert.unit }}
                  (min: {{ alert.minStockQuantity }})
                </div>
              </div>
            }
          </div>
        }
      </div>

    </section>
  `,
  styles: [`
    :host {
      --accent:   #ff5f2e;
      --green:    #22c55e;
      --yellow:   #f59e0b;
      --red:      #ef4444;
      --border:   #ebebeb;
      --text:     #111827;
      --muted:    #6b7280;
      --bg:       #ffffff;
      --surface:  #ffffff;
    }
    .rms-page { display: grid; gap: 24px; padding: 28px 32px; background: var(--bg); min-height: 100%; }
    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 22px 24px; box-shadow: 0 2px 12px rgba(0,0,0,.06); }
    .stat-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
    .stat-icon { width: 46px; height: 46px; border-radius: 14px; background: #fff3f0; color: var(--accent); display: flex; align-items: center; justify-content: center; }
    .stat-icon mat-icon { font-size: 22px; width: 22px; height: 22px; line-height: 1; }
    .trend-icon { color: var(--green); font-size: 20px; width: 20px; height: 20px; line-height: 1; margin-top: 4px; }
    .stat-label { font-size: 13px; color: var(--muted); font-weight: 400; margin-bottom: 6px; }
    .stat-value { font-size: 28px; font-weight: 700; color: var(--text); margin-bottom: 8px; letter-spacing: -.5px; min-height: 40px; display: flex; align-items: center; }
    .stat-note { font-size: 12.5px; color: var(--muted); }
    .occupancy-bar { height: 7px; background: #f3f4f6; border-radius: 10px; overflow: hidden; margin-top: 4px; }
    .occupancy-fill { height: 100%; background: var(--accent); border-radius: 10px; transition: width .4s ease; }
    .charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .chart-card { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,.06); }
    .chart-title { font-size: 16px; font-weight: 700; color: var(--text); margin: 0 0 20px; }
    .chart-wrap { position: relative; height: 270px; }
    .alert-section { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 22px 24px; box-shadow: 0 2px 12px rgba(0,0,0,.06); }
    .alert-header { display: flex; align-items: center; gap: 8px; margin-bottom: 18px; }
    .alert-icon { color: var(--yellow); font-size: 22px; width: 22px; height: 22px; line-height: 1; }
    .alert-title { font-size: 16px; font-weight: 700; color: var(--text); }
    .alert-count { margin-left: auto; font-size: 12px; color: var(--muted); background: #f3f4f6; padding: 2px 10px; border-radius: 20px; }
    .alert-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
    .alert-card { border: 1px solid #e9e9e9; border-left: 4px solid var(--yellow); border-radius: 14px; padding: 14px 16px; background: #fafafa; }
    .alert-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
    .alert-name { font-size: 14px; font-weight: 600; color: var(--text); }
    .alert-remaining { font-size: 12.5px; color: var(--muted); }
    .alert-badge { display: inline-block; padding: 3px 12px; border-radius: 20px; font-size: 11.5px; font-weight: 700; }
    .alert-badge.low      { background: #fef08a; color: #713f12; }
    .alert-badge.critical { background: var(--red); color: #fff; }
    .no-alerts { text-align: center; color: var(--muted); padding: 20px; font-size: 14px; }
    @media (max-width: 900px) {
      .stats-row  { grid-template-columns: repeat(2, 1fr); }
      .charts-row { grid-template-columns: 1fr; }
      .alert-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 600px) {
      .rms-page { padding: 16px; }
      .stats-row { grid-template-columns: 1fr; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDashboardComponent implements AfterViewInit, OnDestroy {
  private readonly dashboardService = inject(DashboardService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('lineCanvas') lineCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('barCanvas')  barCanvas!:  ElementRef<HTMLCanvasElement>;

  private lineChart: any;
  private barChart:  any;

  readonly loading = signal(true);

  readonly summary = signal({
    revenueToday: 0,
    customersToday: 0,
    totalTables: 0,
    occupiedTables: 0,
    occupancyRate: 0,
    activeReservations: 0
  });

  readonly inventoryAlerts = signal<{
    id: number;
    name: string;
    unit: string;
    stockQuantity: number;
    minStockQuantity: number;
    level: 'low' | 'critical';
  }[]>([]);

  ngAfterViewInit(): void {
    this.loadChartJs().then(() => {
      this.loadDashboardData();
    });
  }

  ngOnDestroy(): void {
    this.lineChart?.destroy();
    this.barChart?.destroy();
  }

  private loadDashboardData(): void {
    this.loading.set(true);

    forkJoin({
    summary:     this.dashboardService.getSummary().pipe(
                   catchError(() => of({
                     revenueToday: 0, customersToday: 0,
                     totalTables: 0, occupiedTables: 0,
                     occupancyRate: 0, activeReservations: 0
                   }))),
    weeklyTrend: this.dashboardService.getWeeklyTrend().pipe(
                   catchError(() => of([]))),
    peakHours:   this.dashboardService.getPeakHours().pipe(
                   catchError(() => of([]))),
    ingredients: this.dashboardService.getIngredients().pipe(
                   catchError(() => of([])))
  })
  .pipe(takeUntilDestroyed(this.destroyRef))
  .subscribe({
    next: ({ summary, weeklyTrend, peakHours, ingredients }) => {
      this.summary.set(summary);

        // Inventory alerts — lọc nguyên liệu sắp hết
        const alerts = ingredients
          .filter(i => i.status === 'hoat_dong' && i.stockQuantity <= i.minStockQuantity)
          .map(i => ({
            id: i.id,
            name: i.name,
            unit: i.unit,
            stockQuantity: Number(i.stockQuantity),
            minStockQuantity: Number(i.minStockQuantity),
            // Critical nếu stockQuantity = 0, Low nếu còn ít
            level: Number(i.stockQuantity) === 0 ? 'critical' as const : 'low' as const
          }));
        this.inventoryAlerts.set(alerts);

        // Build charts
        this.buildLineChart(
          weeklyTrend.map(d => d.date),
          weeklyTrend.map(d => Number(d.revenue))
        );
        this.buildBarChart(
          peakHours.map(d => d.hour),
          peakHours.map(d => Number(d.count))
        );

        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
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

  private buildLineChart(labels: string[], data: number[]): void {
    if (this.lineChart) this.lineChart.destroy();
    const ctx = this.lineCanvas.nativeElement.getContext('2d')!;
    this.lineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data,
          borderColor: '#ff5f2e',
          backgroundColor: 'rgba(255,95,46,0.08)',
          borderWidth: 2.5,
          pointBackgroundColor: '#ff5f2e',
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.35
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: { color: '#f0f0f0' },
            ticks: { color: '#9ca3af', font: { size: 11 } }
          },
          y: {
            grid: { color: '#f0f0f0' },
            ticks: {
              color: '#9ca3af', font: { size: 11 },
              callback: (v: number) => v >= 1000000
                ? (v / 1000000).toFixed(1) + 'M'
                : v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v
            },
            min: 0,
            border: { dash: [4, 4] }
          }
        }
      }
    });
  }

  private buildBarChart(labels: string[], data: number[]): void {
    if (this.barChart) this.barChart.destroy();
    const ctx = this.barCanvas.nativeElement.getContext('2d')!;
    this.barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: '#ff5f2e',
          borderRadius: 6,
          barThickness: 28
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#9ca3af', font: { size: 11 } }
          },
          y: {
            grid: { color: '#f0f0f0' },
            ticks: { color: '#9ca3af', font: { size: 11 } },
            min: 0,
            border: { dash: [4, 4] }
          }
        }
      }
    });
  }
}