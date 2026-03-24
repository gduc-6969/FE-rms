import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, MatButtonModule],
  template: `
    <section class="not-found">
      <h1>404</h1>
      <p>Trang bạn truy cập không tồn tại.</p>
      <button mat-flat-button color="primary" routerLink="/login">Về trang đăng nhập</button>
    </section>
  `,
  styles: [
    `
      .not-found {
        min-height: 100dvh;
        display: grid;
        place-content: center;
        text-align: center;
        gap: 8px;
      }

      h1 {
        font-size: 64px;
        margin: 0;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotFoundComponent {}
