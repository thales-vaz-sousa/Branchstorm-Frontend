import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import type { LinkStatus } from '@shared/models/link.model';
import { linkStatusLabel } from '@shared/utils/enum.util';
import { I18nService } from '@core/i18n/i18n.service';
import { PillComponent, type PillTone } from '@shared/ui/pill/pill.component';

@Component({
  selector: 'app-status-badge',
  imports: [PillComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-pill [tone]="tone()">{{ label() }}</app-pill>`,
})
export class StatusBadgeComponent {
  private readonly i18n = inject(I18nService);

  readonly status = input.required<LinkStatus>();
  protected readonly label = computed(() => linkStatusLabel(this.status(), this.i18n.lang()));
  protected readonly tone = computed<PillTone>(() => {
    switch (this.status()) {
      case 'Open':
        return 'open';
      case 'Selected':
        return 'selected';
      case 'Discarded':
        return 'discarded';
      default:
        return 'final';
    }
  });
}
