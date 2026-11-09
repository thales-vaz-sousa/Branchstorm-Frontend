import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import type { TeamMemberRoleName } from '@shared/models/team.model';
import { roleLabel } from '@shared/utils/enum.util';
import { I18nService } from '@core/i18n/i18n.service';
import { PillComponent, type PillTone } from '@shared/ui/pill/pill.component';

@Component({
  selector: 'app-role-badge',
  imports: [PillComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-pill [tone]="tone()">{{ label() }}</app-pill>`,
})
export class RoleBadgeComponent {
  private readonly i18n = inject(I18nService);

  readonly role = input.required<TeamMemberRoleName>();
  protected readonly label = computed(() => roleLabel(this.role(), this.i18n.lang()));
  protected readonly tone = computed<PillTone>(() => {
    switch (this.role()) {
      case 'Admin':
      case 'Owner':
        return 'soft';
      default:
        return 'neutral';
    }
  });
}
