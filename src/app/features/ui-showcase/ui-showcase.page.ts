import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DialogRef } from '@angular/cdk/dialog';
import { DialogShellComponent } from '@shared/ui/dialog/dialog-shell.component';
import { DialogService } from '@shared/ui/dialog/dialog.service';
import { ButtonDirective } from '@shared/ui/button/button.directive';
import { CardComponent } from '@shared/ui/card/card.component';
import { PillComponent } from '@shared/ui/pill/pill.component';
import { FieldComponent } from '@shared/ui/field/field.component';
import { BannerComponent } from '@shared/ui/banner/banner.component';
import { EmptyStateComponent } from '@shared/ui/empty-state/empty-state.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { TabsComponent, type TabItem } from '@shared/ui/tabs/tabs.component';
import { TooltipDirective } from '@shared/ui/tooltip/tooltip.directive';
import { BS_MENU } from '@shared/ui/menu/menu';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { I18nService } from '@core/i18n/i18n.service';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { PageHeaderComponent } from '@shared/ui/page-header/page-header.component';
import { NotificationService } from '@core/ui/notification.service';

@Component({
  selector: 'app-ui-showcase-page',
  imports: [
    PageHeaderComponent,
    ButtonDirective,
    CardComponent,
    PillComponent,
    FieldComponent,
    BannerComponent,
    EmptyStateComponent,
    SpinnerComponent,
    TabsComponent,
    TooltipDirective,
    IconComponent,
    ...BS_MENU,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ui-showcase.page.html',
  styleUrl: './ui-showcase.page.scss',
})
export class UiShowcasePage {
  private readonly dialogs = inject(DialogService);
  private readonly i18n = inject(I18nService);
  private readonly notifications = inject(NotificationService);

  protected readonly tab = signal('detalhes');
  protected readonly tabs = computed<TabItem[]>(() => [
    { id: 'detalhes', label: this.i18n.t('tab.details') },
    { id: 'historico', label: this.i18n.t('tab.history') },
    { id: 'hipoteses', label: this.i18n.t('tab.hypotheses'), count: 2 },
    { id: 'feedback', label: this.i18n.t('tab.feedback'), count: 4 },
  ]);

  protected readonly name = signal('Branchstorm');

  protected async confirm(): Promise<void> {
    const ok = await this.dialogs.confirm({
      title: this.i18n.t('ui.dialog.confirmTitle'),
      message: this.i18n.t('ui.dialog.confirmMessage'),
      confirmLabel: this.i18n.t('ui.dialog.confirmOk'),
      destructive: true,
    });
    this.notifications.info(this.i18n.t(ok ? 'ui.dialog.confirmed' : 'ui.dialog.cancelled'));
  }

  protected openInfoDialog(): void {
    this.dialogs.open(DemoDialogComponent);
  }

  protected openReasonDialog(): void {
    this.dialogs.open(DemoReasonTargetComponent);
  }

  protected toast(tone: 'success' | 'info' | 'error'): void {
    const message = {
      success: this.i18n.t('ui.toast.ok'),
      info: this.i18n.t('ui.toast.info'),
      error: this.i18n.t('ui.toast.errorMsg'),
    }[tone];

    if (tone === 'success') {
      this.notifications.success(message);
    } else if (tone === 'error') {
      this.notifications.error(message);
    } else {
      this.notifications.info(message);
    }
  }

  protected onNameInput(event: Event): void {
    this.name.set((event.target as HTMLInputElement).value);
  }
}

@Component({
  selector: 'app-demo-dialog',
  imports: [DialogShellComponent, ButtonDirective, FieldComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog-shell
      [title]="'ui.dialog.demoTitle' | translate"
      [description]="'ui.dialog.proposeDesc' | translate"
      (closed)="close()"
    >
      <app-field
        controlId="demo-title"
        [label]="'link.titleLabel' | translate"
        [hint]="'ui.field.hint' | translate">
        <input id="demo-title" class="bs-input" value="Fila única por equipe" />
      </app-field>
      <div dialogFooter class="demo-dialog__actions">
        <button appButton variant="outline" type="button" (click)="close()">
          {{ 'common.cancel' | translate }}
        </button>
        <button appButton variant="filled" type="button" (click)="close()">
          {{ 'ui.dialog.propose' | translate }}
        </button>
      </div>
    </app-dialog-shell>
  `,
  styles: [
    `
      .demo-dialog__actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--space-2);
      }
    `,
  ],
})
export class DemoDialogComponent {
  private readonly ref = inject<DialogRef<unknown>>(DialogRef);

  protected close(): void {
    this.ref.close();
  }
}

@Component({
  selector: 'app-demo-reason-target',
  imports: [DialogShellComponent, ButtonDirective, FieldComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog-shell
      [title]="'panel.selectTitle' | translate"
      [description]="'ui.dialog.confirmMessage' | translate"
      (closed)="close()"
    >
      <app-field
        controlId="demo-reason"
        [label]="'link.reasonLabel' | translate"
        [hint]="'link.reasonHint' | translate">
        <textarea id="demo-reason" class="bs-textarea" rows="3"></textarea>
      </app-field>
      <div dialogFooter class="demo-dialog__actions">
        <button appButton variant="outline" type="button" (click)="close()">
          {{ 'common.cancel' | translate }}
        </button>
        <button appButton variant="filled" type="button" (click)="close()">
          {{ 'panel.select' | translate }}
        </button>
      </div>
    </app-dialog-shell>
  `,
  styles: [
    `
      .demo-dialog__actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--space-2);
      }
    `,
  ],
})
export class DemoReasonTargetComponent {
  private readonly ref = inject<DialogRef<string | undefined>>(DialogRef);

  protected close(): void {
    this.ref.close();
  }
}
