import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NotificationService, type Toast } from '@core/ui/notification.service';
import { BannerComponent, type BannerTone } from '../banner/banner.component';

@Component({
  selector: 'app-toast-stack',
  imports: [BannerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toasts" aria-live="polite" aria-atomic="false">
      @for (toast of notifications.toasts(); track toast.id) {
        <app-banner
          [tone]="toneOf(toast)"
          [dismissible]="true"
          (dismiss)="notifications.dismiss(toast.id)"
        >
          {{ toast.message }}
        </app-banner>
      }
    </div>
  `,
  styles: [
    `
      .toasts {
        position: fixed;
        right: var(--space-5);
        bottom: var(--space-5);
        z-index: 1200;
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        width: min(360px, calc(100vw - 32px));
        pointer-events: none;
      }

      .toasts app-banner {
        pointer-events: auto;
      }
    `,
  ],
})
export class ToastStackComponent {
  protected readonly notifications = inject(NotificationService);

  protected toneOf(toast: Toast): BannerTone {
    return toast.tone;
  }
}
