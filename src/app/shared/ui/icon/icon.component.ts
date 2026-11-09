import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type IconName =
  | 'chevron'
  | 'plus'
  | 'x'
  | 'check'
  | 'arrow'
  | 'history'
  | 'flask'
  | 'message'
  | 'home'
  | 'fullscreen'
  | 'target'
  | 'sliders'
  | 'tree'
  | 'translate';

/**
 * Conjunto fechado de ícones do produto (PLANO-FRONTEND.md §2).
 * Traço 1.75, pontas redondas, currentColor.
 */
@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.--icon-size.px]': 'size()',
    '[style.transform]': 'rotate() ? "rotate(" + rotate() + "deg)" : null',
  },
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
      [attr.role]="label() ? 'img' : null"
      [attr.aria-label]="label() || null"
      [attr.aria-hidden]="label() ? null : 'true'"
      focusable="false">
      @switch (name()) {
        @case ('chevron') {
          <polyline points="9 6 15 12 9 18" />
        }
        @case ('plus') {
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        }
        @case ('x') {
          <line x1="6" y1="6" x2="18" y2="18" />
          <line x1="18" y1="6" x2="6" y2="18" />
        }
        @case ('check') {
          <polyline points="4 12.5 9.5 18 20 6.5" />
        }
        @case ('arrow') {
          <line x1="4" y1="12" x2="19" y2="12" />
          <polyline points="13 6 19 12 13 18" />
        }
        @case ('history') {
          <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" />
          <polyline points="3 4 3 10 9 10" />
          <polyline points="12 8 12 12.4 15.4 14.2" />
        }
        @case ('flask') {
          <path d="M9.5 3h5" />
          <path d="M10 3v6.2L5.4 17a2.4 2.4 0 0 0 2.1 3.5h9a2.4 2.4 0 0 0 2.1-3.5L14 9.2V3" />
          <line x1="7.6" y1="14" x2="16.4" y2="14" />
        }
        @case ('message') {
          <path
            d="M20 15.5a2.5 2.5 0 0 1-2.5 2.5H8.4L4 21v-4.2A2.5 2.5 0 0 1 3 15.5v-9A2.5 2.5 0 0 1 5.5 4h12A2.5 2.5 0 0 1 20 6.5Z" />
        }
        @case ('home') {
          <path d="M3.5 10.5 12 3l8.5 7.5" />
          <path d="M5.5 9.5V20h13V9.5" />
          <path d="M9.5 20v-5.5h5V20" />
        }
        @case ('fullscreen') {
          <path d="M4 9V4h5" />
          <path d="M20 9V4h-5" />
          <path d="M4 15v5h5" />
          <path d="M20 15v5h-5" />
        }
        @case ('target') {
          <circle cx="12" cy="12" r="7.5" />
          <circle cx="12" cy="12" r="2.5" />
          <line x1="12" y1="1.5" x2="12" y2="4.5" />
          <line x1="12" y1="19.5" x2="12" y2="22.5" />
          <line x1="1.5" y1="12" x2="4.5" y2="12" />
          <line x1="19.5" y1="12" x2="22.5" y2="12" />
        }
        @case ('sliders') {
          <line x1="4" y1="7" x2="14" y2="7" />
          <line x1="18" y1="7" x2="20" y2="7" />
          <circle cx="16" cy="7" r="2.2" />
          <line x1="4" y1="17" x2="6" y2="17" />
          <line x1="10" y1="17" x2="20" y2="17" />
          <circle cx="8" cy="17" r="2.2" />
        }
        @case ('tree') {
          <circle cx="6" cy="5" r="2.2" />
          <circle cx="18" cy="5" r="2.2" />
          <circle cx="12" cy="19" r="2.2" />
          <path d="M6 7.2v3.3a3 3 0 0 0 3 3h.8" />
          <path d="M18 7.2v3.3a3 3 0 0 1-3 3h-.8" />
          <line x1="12" y1="13.5" x2="12" y2="16.8" />
        }
        @case ('translate') {
          <path d="M4 6h9" />
          <path d="M8.5 4.5c.8 2.8-1.5 5.8-4 7.2" />
          <path d="M5.8 8c1 2.5 2.7 4.5 5.2 5.8" />
          <path d="M12.5 19.5 16.2 9l3.7 10.5" />
          <path d="M13.8 15.8h4.8" />
        }
      }
    </svg>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        line-height: 0;
      }

      svg {
        display: block;
      }
    `,
  ],
})
export class IconComponent {
  readonly name = input.required<IconName>();
  readonly size = input(18);
  readonly rotate = input(0);
  readonly label = input('');
}
