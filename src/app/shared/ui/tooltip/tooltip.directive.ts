import { Overlay, type OverlayRef } from '@angular/cdk/overlay';
import { Directive, ElementRef, inject, input, type OnDestroy } from '@angular/core';

/**
 * Tooltip do kit. Usa overlay do CDK e aparece no hover e no foco.
 */
@Directive({
  selector: '[appTooltip]',
  host: {
    '(mouseenter)': 'show()',
    '(focusin)': 'show()',
    '(mouseleave)': 'hide()',
    '(focusout)': 'hide()',
    '(keydown.escape)': 'hide()',
  },
})
export class TooltipDirective implements OnDestroy {
  private readonly overlay = inject(Overlay);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private ref: OverlayRef | null = null;

  readonly appTooltip = input.required<string>();

  show(): void {
    const text = this.appTooltip();

    if (!text || this.ref) {
      return;
    }

    const position = this.overlay.position().flexibleConnectedTo(this.elementRef).withPositions([
      { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: 8 },
      { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -8 },
    ]);

    this.ref = this.overlay.create({
      positionStrategy: position,
      scrollStrategy: this.overlay.scrollStrategies.close(),
    });

    const node = document.createElement('div');
    node.className = 'bs-tooltip';
    node.setAttribute('role', 'tooltip');
    node.textContent = text;
    this.ref.overlayElement.appendChild(node);
    this.ref.updatePosition();
  }

  hide(): void {
    this.ref?.dispose();
    this.ref = null;
  }

  ngOnDestroy(): void {
    this.hide();
  }
}
