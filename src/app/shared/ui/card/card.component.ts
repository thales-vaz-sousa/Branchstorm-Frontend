import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: {
    class: 'card',
    '[class.card--none]': 'padding() === "none"',
    '[class.card--sm]': 'padding() === "sm"',
    '[class.card--md]': 'padding() === "md"',
    '[class.card--lg]': 'padding() === "lg"',
    '[class.card--link]': 'interactive()',
  },
  styles: [
    `
      :host {
        display: block;
        background: var(--card);
        border: 1px solid var(--line);
        border-radius: var(--radius-card);
      }

      :host(.card--sm) {
        padding: var(--space-3);
      }

      :host(.card--md) {
        padding: var(--space-5);
      }

      :host(.card--lg) {
        padding: var(--space-6);
      }

      :host(.card--link) {
        color: inherit;
        transition:
          border-color var(--duration-fast) var(--ease),
          background-color var(--duration-fast) var(--ease);
      }

      :host(.card--link:hover) {
        border-color: var(--teal);
        background: var(--soft);
      }
    `,
  ],
})
export class CardComponent {
  readonly padding = input<CardPadding>('md');
  readonly interactive = input(false);
}
