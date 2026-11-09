import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import type { LinkValidationName } from '@shared/models/link.model';
import { linkValidationLabel } from '@shared/utils/enum.util';
import { I18nService } from '@core/i18n/i18n.service';
import { PillComponent, type PillTone } from '@shared/ui/pill/pill.component';

@Component({
  selector: 'app-validation-badge',
  imports: [PillComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-pill [tone]="tone()">{{ label() }}</app-pill>`,
})
export class ValidationBadgeComponent {
  private readonly i18n = inject(I18nService);

  readonly validation = input.required<LinkValidationName>();
  protected readonly label = computed(() =>
    linkValidationLabel(this.validation(), this.i18n.lang()),
  );
  protected readonly tone = computed<PillTone>(() => {
    switch (this.validation()) {
      case 'Validated':
        return 'soft';
      case 'Refuted':
        return 'danger';
      default:
        return 'neutral';
    }
  });
}
