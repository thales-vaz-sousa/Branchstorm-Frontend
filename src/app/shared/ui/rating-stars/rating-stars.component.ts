import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-rating-stars',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="stars" [attr.aria-label]="ariaLabel()" role="img">
      @for (star of stars(); track $index) {
        <span class="star" [class.star--filled]="star" aria-hidden="true">★</span>
      }
      @if (showValue()) {
        <span class="stars__value">{{ valueLabel() }}</span>
      }
    </span>
  `,
  styles: [
    `
      .stars {
        display: inline-flex;
        align-items: center;
        gap: 1px;
        color: var(--line);
        line-height: 1;
      }

      .star {
        font-size: 15px;
      }

      .star--filled {
        color: var(--teal);
      }

      .stars__value {
        margin-left: 6px;
        font-size: var(--text-xs);
        font-weight: 700;
        color: var(--muted);
      }
    `,
  ],
})
export class RatingStarsComponent {
  readonly value = input.required<number>();
  readonly showValue = input(false);

  protected readonly stars = computed(() => {
    const rounded = Math.round(this.value());
    return Array.from({ length: 5 }, (_, index) => index < rounded);
  });

  protected readonly ariaLabel = computed(() => `Nota ${this.value()} de 5`);
  protected readonly valueLabel = computed(() => this.value().toFixed(1));
}
