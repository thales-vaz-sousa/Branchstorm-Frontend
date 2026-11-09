import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (label()) {
      <label class="field__label" [attr.for]="controlId()">
        {{ label() }}
        @if (required()) {
          <span class="field__required" aria-hidden="true">*</span>
        }
      </label>
    }
    <ng-content />
    @if (error()) {
      <p class="field__error" [id]="controlId() + '-error'">{{ error() }}</p>
    } @else if (hint()) {
      <p class="field__hint" [id]="controlId() + '-hint'">{{ hint() }}</p>
    }
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .field__label {
        display: inline-flex;
        align-items: baseline;
        gap: 4px;
        font-size: var(--text-sm);
        font-weight: 500;
        color: var(--ink);
      }

      .field__required {
        color: var(--danger);
      }

      .field__hint,
      .field__error {
        font-size: var(--text-xs);
        line-height: 1.4;
      }

      .field__hint {
        color: var(--muted);
      }

      .field__error {
        color: var(--danger);
      }
    `,
  ],
})
export class FieldComponent {
  readonly label = input('');
  readonly controlId = input.required<string>();
  readonly hint = input('');
  readonly error = input('');
  readonly required = input(false, { transform: booleanAttribute });
}
