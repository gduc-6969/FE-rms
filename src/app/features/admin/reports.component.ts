import {
  ChangeDetectionStrategy,
  Component,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  inject,
  computed
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MockDataService } from '../../core/services/mock-data.service';

declare const Chart: any;

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <section class="rms-page">

      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h2 class="page-title">Reports &amp; Analytics</h2>
          <p class="page-sub">Analyze restaurant performance</p>
        </div>
        <div class="header-actions">
          <button class="btn-quarter">
            <mat-icon>calendar_today</mat-icon>
            This Quarter
          </button>
          <button class="btn-export">
            <mat-icon>download</mat-icon>
            Export
          </button>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-label">Total Revenue (Q1)</div>
          <div class="stat-value">\$142,000</div>
          <div class="stat-trend up">
            <mat-icon>trending_up</mat-icon> +15%
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Avg Order Value</div>
          <div class="stat-value">\$74.50</div>
          <div class="stat-trend up">
            <mat-icon>trending_up</mat-icon> +8%
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Orders</div>
          <div class="stat-value">1,410</div>
          <div class="stat-trend up">
            <mat-icon>trending_up</mat-icon> +12%
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Customer Satisfaction</div>
          <div class="stat-value">4.8/5</div>
          <div class="stat-trend up">
            <mat-icon>trending_up</mat-icon> +0.2
          </div>
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
            <span class="legend-dot" style="background:#ff5f2e"></span> revenue
            <span class="legend-dot" style="background:#f59e0b; margin-left:14px"></span> orders
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
            @for (dish of bestSellers; track dish.rank) {
              <tr>
                <td><span class="rank">#{{ dish.rank }}</span></td>
                <td class="td-name">{{ dish.name }}</td>
                <td class="td-sales">{{ dish.sales }} orders</td>
                <td class="td-revenue">\${{ dish.revenue.toLocaleString() }}</td>
                <td>
                  <div class="contrib-cell">
                    <div class="progress-bar">
                      <div class="progress-fill" [style.width]="dish.pct + '%'"></div>
                    </div>
                    <span class="contrib-pct">{{ dish.pct }}%</span>
                  </div>
                </td>
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

    /* ── Header ── */
    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between;
    }
    .page-title { font-size: 18px; font-weight: 700; color: var(--text); margin: 0; }
    .page-sub   { font-size: 12.5px; color: var(--muted); margin: 4px 0 0; }
    .header-actions { display: flex; gap: 10px; align-items: center; }

    .btn-quarter {
      display: inline-flex; align-items: center; gap: 6px;
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 10px; padding: 9px 16px;
      font-size: 13px; font-weight: 500; cursor: pointer;
      font-family: inherit; color: var(--text);
      transition: border-color .15s;
    }
    .btn-quarter mat-icon { font-size: 16px; width: 16px; height: 16px; line-height: 1; color: var(--accent); }
    .btn-quarter:hover { border-color: #d1d5db; }

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
export class ReportsComponent implements AfterViewInit, OnDestroy {
  private readonly mockData = inject(MockDataService);

  @ViewChild('barCanvas') barCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pieCanvas') pieCanvas!: ElementRef<HTMLCanvasElement>;

  private barChart: any;
  private pieChart: any;

  readonly bestSellers = [
    { rank: 1, name: 'Truffle Pasta',  sales: 245, revenue: 6860,  pct: 23.4 },
    { rank: 2, name: 'Wagyu Steak',    sales: 189, revenue: 12285, pct: 42.0 },
    { rank: 3, name: 'Grilled Salmon', sales: 167, revenue: 5845,  pct: 20.0 },
    { rank: 4, name: 'Chocolate Lava', sales: 156, revenue: 1872,  pct: 6.4  },
    { rank: 5, name: 'Lobster Bisque', sales: 134, revenue: 2412,  pct: 8.2  },
  ];

  ngAfterViewInit(): void {
    this.loadChartJs().then(() => {
      this.buildBarChart();
      this.buildPieChart();
    });
  }

  ngOnDestroy(): void {
    this.barChart?.destroy();
    this.pieChart?.destroy();
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

  private buildBarChart(): void {
    const ctx = this.barCanvas.nativeElement.getContext('2d')!;
    this.barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Jan', 'Feb', 'Mar'],
        datasets: [
          {
            label: 'revenue',
            data: [40000, 47000, 50000],
            backgroundColor: '#ff5f2e',
            borderRadius: 6,
            barThickness: 32
          },
          {
            label: 'orders',
            data: [420, 480, 510],
            backgroundColor: '#f59e0b',
            borderRadius: 6,
            barThickness: 32,
            yAxisID: 'y2'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#9ca3af', font: { size: 12 } } },
          y: {
            grid: { color: '#f3f4f6' },
            ticks: { color: '#9ca3af', font: { size: 11 },
              callback: (v: number) => v >= 1000 ? v / 1000 * 10 + 'k' : v
            },
            min: 0, max: 60000
          },
          y2: { display: false, min: 0, max: 700 }
        }
      }
    });
  }

  private buildPieChart(): void {
    const ctx = this.pieCanvas.nativeElement.getContext('2d')!;
    this.pieChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Mains', 'Appetizers', 'Desserts', 'Drinks'],
        datasets: [{
          data: [42, 28, 18, 12],
          backgroundColor: ['#ff5f2e', '#f59e0b', '#2dd4bf', '#a3e635'],
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
            labels: { color: '#6b7280', font: { size: 12 }, padding: 16 }
          }
        }
      }
    });
  }

  exportExcel(): void {
    alert('Exporting Excel report...');
  }

  exportPdf(): void {
    alert('Exporting PDF report...');
  }
}