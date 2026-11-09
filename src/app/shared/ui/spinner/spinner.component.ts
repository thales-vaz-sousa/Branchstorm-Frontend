import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="spinner" role="status" [attr.aria-label]="label()"></span>`,
  styles: [
    `
      :host {
        display: inline-flex;
      }

      .spinner {
        display: block;
        width: var(--spinner-size, 18px);
        height: var(--spinner-size, 18px);
        border: 2px solid var(--line);
        border-top-color: var(--teal);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
  host: {
    '[style.--spinner-size.px]': 'size()',
  },
})
export class SpinnerComponent {
  readonly size = input(18);
  readonly label = input('Carregando');
}
