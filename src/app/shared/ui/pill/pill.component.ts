import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type PillTone =
  | 'open'
  | 'selected'
  | 'discarded'
  | 'final'
  | 'neutral'
  | 'soft'
  | 'danger';

@Component({
  selector: 'app-pill',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: {
    class: 'pill',
    '[class.pill--open]': 'tone() === "open"',
    '[class.pill--selected]': 'tone() === "selected"',
    '[class.pill--discarded]': 'tone() === "discarded"',
    '[class.pill--final]': 'tone() === "final"',
    '[class.pill--neutral]': 'tone() === "neutral"',
    '[class.pill--soft]': 'tone() === "soft"',
    '[class.pill--danger]': 'tone() === "danger"',
  },
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 3px 10px;
        border: 1px solid transparent;
        border-radius: var(--radius-pill);
        font-family: var(--font-sans);
        font-size: var(--text-xs);
        font-weight: 500;
        line-height: 1.4;
        white-space: nowrap;
      }

      :host(.pill--open) {
        border-color: var(--teal);
        color: var(--teal);
      }

      :host(.pill--selected) {
        background: var(--soft);
        color: var(--tink);
      }

      :host(.pill--discarded) {
        border-color: var(--line);
        color: var(--muted);
      }

      :host(.pill--final) {
        background: var(--action-bg);
        color: var(--on-solid);
      }

      :host(.pill--neutral) {
        border-color: var(--line);
        color: var(--muted);
      }

      :host(.pill--soft) {
        background: var(--soft);
        color: var(--tink);
      }

      :host(.pill--danger) {
        border-color: var(--danger);
        color: var(--danger);
      }
    `,
  ],
})
export class PillComponent {
  readonly tone = input<PillTone>('neutral');
}
