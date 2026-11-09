import { booleanAttribute, Directive, ElementRef, inject, input } from '@angular/core';

export type ButtonVariant = 'filled' | 'outline' | 'text';
export type ButtonSize = 'sm' | 'md';

/**
 * Botão do kit. Funciona em <button> e <a> (quando o alvo é navegação).
 * Foco visível herdado de :focus-visible na base.
 */
@Directive({
  selector: 'button[appButton], a[appButton]',
  host: {
    class: 'bs-button',
    '[class.bs-button--filled]': 'variant() === "filled"',
    '[class.bs-button--outline]': 'variant() === "outline"',
    '[class.bs-button--text]': 'variant() === "text"',
    '[class.bs-button--sm]': 'size() === "sm"',
    '[class.bs-button--block]': 'block()',
    '[class.bs-button--loading]': 'loading()',
    '[attr.aria-busy]': 'loading() ? "true" : null',
    '[attr.aria-disabled]': 'disabled() || loading() ? "true" : null',
    '[attr.disabled]': 'isNative && (disabled() || loading()) ? "" : null',
    '[attr.tabindex]': '!isNative && (disabled() || loading()) ? -1 : null',
  },
})
export class ButtonDirective {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly variant = input<ButtonVariant>('filled');
  readonly size = input<ButtonSize>('md');
  readonly block = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });

  protected readonly isNative = this.elementRef.nativeElement.tagName === 'BUTTON';
}
