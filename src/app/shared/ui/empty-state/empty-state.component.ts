import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent, type IconName } from '../icon/icon.component';

@Component({
  selector: 'app-empty-state',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty">
      <app-icon [name]="icon()" [size]="26" class="empty__icon" />
      <h3 class="empty__title">{{ title() }}</h3>
      @if (description()) {
        <p class="empty__description">{{ description() }}</p>
      }
      <div class="empty__actions">
        <ng-content />
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-10) var(--space-6);
        border: 1px dashed var(--line);
        border-radius: var(--radius-card);
        text-align: center;
      }

      .empty__icon {
        color: var(--muted);
        margin-bottom: var(--space-2);
      }

      .empty__title {
        font-size: var(--text-lg);
        font-weight: 500;
        color: var(--ink);
      }

      .empty__description {
        max-width: 44ch;
        font-size: var(--text-sm);
        color: var(--muted);
      }

      .empty__actions:not(:empty) {
        display: flex;
        gap: var(--space-2);
        margin-top: var(--space-3);
      }
    `,
  ],
})
export class EmptyStateComponent {
  readonly icon = input<IconName>('message');
  readonly title = input.required<string>();
  readonly description = input('');
}
