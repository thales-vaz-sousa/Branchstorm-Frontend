import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

export interface TabItem {
  readonly id: string;
  readonly label: string;
  readonly count?: number;
}

@Component({
  selector: 'app-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tabs" role="tablist">
      @for (tab of tabs(); track tab.id; let index = $index) {
        <button
          class="tabs__tab"
          type="button"
          role="tab"
          [id]="'tab-' + tab.id"
          [attr.aria-selected]="tab.id === active()"
          [attr.aria-controls]="'panel-' + tab.id"
          [attr.tabindex]="tab.id === active() ? 0 : -1"
          (click)="select(tab.id)"
          (keydown)="onKeydown($event, index)">
          {{ tab.label }}
          @if (tab.count !== undefined && tab.count > 0) {
            <span class="tabs__count">{{ tab.count }}</span>
          }
        </button>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .tabs {
        display: flex;
        gap: var(--space-4);
        border-bottom: 1px solid var(--line);
        overflow-x: auto;
        scrollbar-width: none;
      }

      .tabs::-webkit-scrollbar {
        display: none;
      }

      .tabs__tab {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 0 0 14px;
        background: transparent;
        border: 0;
        border-bottom: 2px solid transparent;
        margin-bottom: -1px;
        color: var(--muted);
        font-size: var(--text-sm);
        font-weight: 500;
        white-space: nowrap;
        transition:
          color var(--duration-fast) var(--ease),
          border-color var(--duration-fast) var(--ease);
      }

      .tabs__tab:hover {
        color: var(--ink);
      }

      .tabs__tab[aria-selected='true'] {
        color: var(--tink);
        border-bottom-color: var(--teal);
      }

      .tabs__count {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 18px;
        height: 18px;
        padding: 0 5px;
        border-radius: var(--radius-pill);
        background: var(--soft);
        color: var(--tink);
        font-size: 11px;
        font-weight: 700;
        line-height: 1;
        text-align: center;
      }
    `,
  ],
})
export class TabsComponent {
  readonly tabs = input.required<readonly TabItem[]>();
  readonly active = model.required<string>();

  protected select(id: string): void {
    this.active.set(id);
  }

  protected onKeydown(event: KeyboardEvent, index: number): void {
    const tabs = this.tabs();
    let next: number;

    if (event.key === 'ArrowRight') {
      next = (index + 1) % tabs.length;
    } else if (event.key === 'ArrowLeft') {
      next = (index - 1 + tabs.length) % tabs.length;
    } else if (event.key === 'Home') {
      next = 0;
    } else if (event.key === 'End') {
      next = tabs.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    const tab = tabs[next];

    if (!tab) {
      return;
    }

    this.active.set(tab.id);
    document.getElementById('tab-' + tab.id)?.focus();
  }
}
