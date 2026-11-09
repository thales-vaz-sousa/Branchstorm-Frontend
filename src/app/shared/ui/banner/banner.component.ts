import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ButtonDirective } from '../button/button.directive';
import { IconComponent } from '../icon/icon.component';

export type BannerTone = 'info' | 'error' | 'demo' | 'success';

@Component({
  selector: 'app-banner',
  imports: [ButtonDirective, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="banner" [class]="'banner--' + tone()" role="status">
      <div class="banner__text">
        @if (title()) {
          <strong class="banner__title">{{ title() }}</strong>
        }
        <span class="banner__message"><ng-content /></span>
      </div>

      <div class="banner__side">
        <ng-content select="[bannerAction]" />
        @if (dismissible()) {
          <button
            appButton
            variant="text"
            size="sm"
            type="button"
            class="banner__close"
            aria-label="Fechar aviso"
            (click)="dismiss.emit()"
          >
            <app-icon name="x" [size]="16" />
          </button>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .banner {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--space-4);
        padding: 12px 16px;
        border: 1px solid var(--line);
        border-radius: var(--radius-control);
        background: var(--card);
      }

      .banner--info {
        background: var(--soft);
        border-color: var(--soft);
      }

      .banner--demo {
        background: var(--soft);
        border-color: var(--teal);
      }

      .banner--error {
        background: var(--card);
        border-color: var(--danger);
      }

      .banner--success {
        background: var(--card);
        border-color: var(--teal);
      }

      .banner__text {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
        font-size: var(--text-sm);
        color: var(--ink);
      }

      .banner--error .banner__text {
        color: var(--danger);
      }

      .banner__title {
        font-weight: 500;
      }

      .banner__message {
        color: var(--muted);
      }

      .banner--error .banner__message {
        color: var(--danger);
      }

      .banner__side {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        flex-shrink: 0;
      }

      .banner__close {
        color: inherit;
      }
    `,
  ],
})
export class BannerComponent {
  readonly tone = input<BannerTone>('info');
  readonly title = input('');
  readonly dismissible = input(false);
  readonly dismiss = output<void>();
}
