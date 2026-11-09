import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { BannerComponent } from '@shared/ui/banner/banner.component';
import { ButtonDirective } from '@shared/ui/button/button.directive';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { RatingStarsComponent } from '@shared/ui/rating-stars/rating-stars.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { StatusBadgeComponent } from '@shared/ui/status-badge/status-badge.component';
import { TabsComponent, type TabItem } from '@shared/ui/tabs/tabs.component';
import { ValidationBadgeComponent } from '@shared/ui/validation-badge/validation-badge.component';
import { DialogService } from '@shared/ui/dialog/dialog.service';
import {
  ReasonDialogComponent,
  type ReasonDialogData,
} from '@shared/ui/dialog/reason-dialog.component';
import { RelativeDatePipe } from '@shared/pipes/relative-date.pipe';
import { DateTimePipe } from '@shared/pipes/date-time.pipe';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { SessionStore } from '@core/auth/session.store';
import { NotificationService } from '@core/ui/notification.service';
import { TeamsStore } from '@features/teams/state/teams.store';
import { UserDirectoryStore } from '@features/users/state/user-directory.store';
import { IdeaTreeStore } from '@features/ideas/state/idea-tree.store';
import { HypothesisStore } from '@features/hypotheses/state/hypothesis.store';
import { FeedbackStore } from '@features/feedbacks/state/feedback.store';
import { HypothesisFormDialogComponent } from '@features/hypotheses/ui/hypothesis-form-dialog/hypothesis-form-dialog.component';
import {
  HypothesisResultDialogComponent,
  type HypothesisResultDialogData,
} from '@features/hypotheses/ui/hypothesis-result-dialog/hypothesis-result-dialog.component';
import { FeedbackFormDialogComponent } from '@features/feedbacks/ui/feedback-form-dialog/feedback-form-dialog.component';
import type { LinkResult, LinkValidationName, SelectLinkRequest } from '@shared/models/link.model';
import type {
  CreateHypothesisRequest,
  HypothesisResult,
  RegisterHypothesisResultRequest,
} from '@shared/models/hypothesis.model';
import type { CreateFeedbackRequest } from '@shared/models/feedback.model';
import { countDiscardedBySelection } from '@shared/utils/tree.util';
import { I18nService } from '@core/i18n/i18n.service';
import { linkTypeLabel } from '@shared/utils/enum.util';

const EMPTY_STATE = { items: [], loading: false, error: null } as const;

@Component({
  selector: 'app-node-detail-panel',
  imports: [
    BannerComponent,
    ButtonDirective,
    IconComponent,
    RatingStarsComponent,
    SpinnerComponent,
    StatusBadgeComponent,
    TabsComponent,
    ValidationBadgeComponent,
    RelativeDatePipe,
    DateTimePipe,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './node-detail-panel.component.html',
  styleUrl: './node-detail-panel.component.scss',
})
export class NodeDetailPanelComponent {
  readonly node = input<LinkResult | null>(null);
  readonly path = input<readonly LinkResult[]>([]);
  readonly children = input<readonly LinkResult[]>([]);
  readonly allNodes = input<readonly LinkResult[]>([]);
  readonly saving = input(false);

  readonly nodeSelected = output<string>();
  readonly createChild = output<LinkResult>();
  readonly treeChanged = output<void>();
  readonly closed = output<void>();

  private readonly session = inject(SessionStore);
  private readonly i18n = inject(I18nService);
  private readonly notifications = inject(NotificationService);
  private readonly dialogs = inject(DialogService);
  private readonly ideaTree = inject(IdeaTreeStore);
  private readonly hypotheses = inject(HypothesisStore);
  private readonly feedbacks = inject(FeedbackStore);
  private readonly teams = inject(TeamsStore);
  private readonly users = inject(UserDirectoryStore);

  protected readonly activeTab = signal('details');

  protected readonly hypothesesState = computed(() => {
    const code = this.node()?.code;
    return code ? (this.hypotheses.states()[code] ?? EMPTY_STATE) : EMPTY_STATE;
  });

  protected readonly feedbackState = computed(() => {
    const code = this.node()?.code;
    return code ? (this.feedbacks.states()[code] ?? EMPTY_STATE) : EMPTY_STATE;
  });

  protected readonly feedbackAverage = computed(() => {
    const items = this.feedbackState().items;
    return items.length === 0
      ? 0
      : items.reduce((sum, item) => sum + item.rating, 0) / items.length;
  });

  protected readonly canFeedback = computed(() => this.node()?.status === 'Open');
  protected readonly canSelect = computed(() => {
    const status = this.node()?.status;
    return status !== undefined && status !== 'Selected' && status !== 'Final';
  });
  protected readonly canFinal = computed(() => this.node()?.status === 'Selected');
  protected readonly childLabel = computed(() =>
    this.i18n.t(
      this.node()?.type === 'Problem' ? 'panel.createChildSolution' : 'panel.createChildBranch',
    ),
  );

  protected readonly discardMessage = computed(() => {
    const node = this.node();

    if (!node) {
      return '';
    }

    const total = countDiscardedBySelection(this.allNodes(), node.code);

    if (total === 0) {
      return this.i18n.t('panel.selectMessageNone');
    }

    return this.i18n.t('panel.selectMessage', {
      count: total,
      noun: this.i18n.t(total === 1 ? 'panel.selectMessageOne' : 'panel.selectMessageMany'),
    });
  });

  protected readonly tabs = computed<TabItem[]>(() => {
    const node = this.node();

    if (!node) {
      return [];
    }

    return [
      { id: 'details', label: this.i18n.t('tab.details') },
      { id: 'history', label: this.i18n.t('tab.history'), count: node.history.length },
      {
        id: 'hypotheses',
        label: this.i18n.t('tab.hypotheses'),
        count: this.hypothesesState().items.length,
      },
      {
        id: 'feedback',
        label: this.i18n.t('tab.feedback'),
        count: this.feedbackState().items.length,
      },
    ];
  });

  constructor() {
    effect(() => {
      const node = this.node();

      if (node) {
        void this.loadRelated(node);
      }
    });
  }

  protected typeLabel(node: LinkResult): string {
    return linkTypeLabel(node.type, this.i18n.lang());
  }

  protected authorName(code: string | null): string {
    if (!code) {
      return this.i18n.t('panel.authorUnknown');
    }

    return this.users.usersByCode().get(code)?.name ?? this.i18n.t('canvas.authorFallback');
  }

  protected teamName(code: string | null): string {
    if (!code) {
      return this.i18n.t('panel.teamUnknown');
    }

    return (
      this.teams.teams().find((team) => team.code === code)?.name ?? this.i18n.t('canvas.team')
    );
  }

  protected resultBadge(hypothesis: HypothesisResult): LinkValidationName {
    return hypothesis.result ?? 'NotTested';
  }

  protected initials(name: string): string {
    return name.slice(0, 1).toUpperCase();
  }

  protected async selectNode(): Promise<void> {
    const node = this.node();

    if (!node || !this.canSelect()) {
      return;
    }

    const reason = await this.openReason({
      title: this.i18n.t('panel.selectTitle'),
      message: this.discardMessage(),
      confirmLabel: this.i18n.t('panel.selectOk'),
      placeholder: this.i18n.t('panel.selectPlaceholder'),
    });

    if (reason === undefined) {
      return;
    }

    const request: SelectLinkRequest = { reason: reason || null };

    try {
      await this.ideaTree.select(node.code, request);
      this.notifications.success(this.i18n.t('panel.selectedOk'));
      this.treeChanged.emit();
    } catch {
      this.notifications.error(this.i18n.t('panel.selectFailed'));
    }
  }

  protected async markFinal(): Promise<void> {
    const node = this.node();

    if (!node || !this.canFinal()) {
      return;
    }

    const reason = await this.openReason({
      title: this.i18n.t('panel.finalTitle'),
      message: this.i18n.t('panel.finalMessage'),
      confirmLabel: this.i18n.t('panel.finalConfirm'),
      requireReason: true,
      placeholder: this.i18n.t('panel.finalPlaceholder'),
    });

    if (reason === undefined) {
      return;
    }

    try {
      await this.ideaTree.markFinal(node.code, { reason: reason || null });
      this.notifications.success(this.i18n.t('panel.finalOk'));
      this.treeChanged.emit();
    } catch {
      this.notifications.error(this.i18n.t('panel.finalFailed'));
    }
  }

  protected async createHypothesis(): Promise<void> {
    const node = this.node();

    if (!node) {
      return;
    }

    const ref = this.dialogs.open<CreateHypothesisRequest, { linkCode: string; linkTitle: string }>(
      HypothesisFormDialogComponent,
      {
        data: { linkCode: node.code, linkTitle: node.title },
        width: '520px',
      },
    );
    const request = await firstValueFrom(ref.closed);

    if (!request) {
      return;
    }

    try {
      await this.hypotheses.create(request);
      this.notifications.success(this.i18n.t('panel.hypoCreated'));
    } catch {
      this.notifications.error(this.i18n.t('panel.hypoCreateFailed'));
    }
  }

  protected async registerResult(hypothesis: HypothesisResult): Promise<void> {
    const ref = this.dialogs.open<RegisterHypothesisResultRequest, HypothesisResultDialogData>(
      HypothesisResultDialogComponent,
      {
        data: { hypothesis },
        width: '520px',
      },
    );
    const request = await firstValueFrom(ref.closed);

    if (!request) {
      return;
    }

    try {
      await this.hypotheses.registerResult(hypothesis.linkCode, hypothesis.code, request);
      this.notifications.success(this.i18n.t('panel.hypoResultOk'));
      this.treeChanged.emit();
    } catch {
      this.notifications.error(this.i18n.t('panel.hypoResultFailed'));
    }
  }

  protected async createFeedback(): Promise<void> {
    const node = this.node();
    const autorCode = this.session.userCode();

    if (!node || !autorCode || !this.canFeedback()) {
      return;
    }

    const ref = this.dialogs.open<
      CreateFeedbackRequest,
      { linkCode: string; linkTitle: string; autorCode: string }
    >(FeedbackFormDialogComponent, {
      data: { linkCode: node.code, linkTitle: node.title, autorCode },
      width: '520px',
    });
    const request = await firstValueFrom(ref.closed);

    if (!request) {
      return;
    }

    try {
      await this.feedbacks.create(request);
      this.notifications.success(this.i18n.t('panel.feedbackSent'));
    } catch {
      this.notifications.error(this.i18n.t('panel.feedbackFailed'));
    }
  }

  protected reloadHypotheses(): void {
    const node = this.node();

    if (node) {
      void this.hypotheses.load(node.code);
    }
  }

  protected reloadFeedback(): void {
    const node = this.node();

    if (node) {
      void this.feedbacks.load(node.code);
    }
  }

  private async openReason(data: ReasonDialogData): Promise<string | undefined> {
    const ref = this.dialogs.open<string, ReasonDialogData>(ReasonDialogComponent, {
      data,
      width: '480px',
    });

    return firstValueFrom(ref.closed);
  }

  private async loadRelated(node: LinkResult): Promise<void> {
    await Promise.all([this.hypotheses.load(node.code), this.feedbacks.load(node.code)]);

    const codes = [
      node.autorCode,
      ...this.feedbackState().items.map((feedback) => feedback.autorCode),
    ].filter((code): code is string => Boolean(code));

    await this.users.ensureLoaded(codes);
  }
}
