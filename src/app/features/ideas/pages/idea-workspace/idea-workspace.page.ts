import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ButtonDirective } from '@shared/ui/button/button.directive';
import { EmptyStateComponent } from '@shared/ui/empty-state/empty-state.component';
import { BrandLoaderComponent } from '@shared/ui/brand-loader/brand-loader.component';
import { DialogService } from '@shared/ui/dialog/dialog.service';
import { I18nService } from '@core/i18n/i18n.service';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { NotificationService } from '@core/ui/notification.service';
import { TeamsStore } from '@features/teams/state/teams.store';
import { UserDirectoryStore } from '@features/users/state/user-directory.store';
import { IdeaTreeStore } from '@features/ideas/state/idea-tree.store';
import {
  IdeaTreeCanvasComponent,
  type TreeLayoutMode,
} from '@features/ideas/ui/idea-tree-canvas/idea-tree-canvas.component';
import { NodeDetailPanelComponent } from '@features/ideas/ui/node-detail-panel/node-detail-panel.component';
import { LinkFormDialogComponent } from '@features/ideas/ui/link-form-dialog/link-form-dialog.component';
import type { CreateLinkRequest, LinkResult } from '@shared/models/link.model';

@Component({
  selector: 'app-idea-workspace-page',
  imports: [
    RouterLink,
    ButtonDirective,
    EmptyStateComponent,
    BrandLoaderComponent,
    TranslatePipe,
    IdeaTreeCanvasComponent,
    NodeDetailPanelComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './idea-workspace.page.html',
  styleUrl: './idea-workspace.page.scss',
})
export class IdeaWorkspacePage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly tree = inject(IdeaTreeStore);
  private readonly teams = inject(TeamsStore);
  private readonly users = inject(UserDirectoryStore);
  private readonly dialogs = inject(DialogService);
  private readonly i18n = inject(I18nService);
  private readonly notifications = inject(NotificationService);

  protected readonly root = this.tree.root;
  protected readonly nodes = this.tree.nodes;
  protected readonly loading = this.tree.loading;
  protected readonly saving = this.tree.saving;
  protected readonly error = this.tree.error;
  protected readonly selectedNode = this.tree.selectedNode;
  protected readonly selectedPath = this.tree.selectedPath;
  protected readonly selectedChildren = this.tree.selectedChildren;
  protected readonly collapsedCodes = this.tree.collapsedCodes;
  protected readonly showDiscarded = this.tree.showDiscarded;
  protected readonly stats = this.tree.stats;
  protected readonly visible = this.tree.visible;
  protected readonly childCounts = computed(() => this.visible().childCounts);

  protected readonly code = signal<string>('');
  protected readonly drawerOpen = signal(false);
  // Telas finas abrem em Retrato (a árvore desce, sem rolagem lateral).
  protected readonly layoutMode = signal<TreeLayoutMode>(
    typeof window !== 'undefined' && window.innerWidth <= 640 ? 'portrait' : 'landscape',
  );

  protected readonly authors = computed(() => {
    const map = new Map<string, string>();
    for (const [code, user] of this.users.usersByCode()) {
      map.set(code, user.name);
    }
    return map;
  });

  /** Nós exibidos no canvas (filtros de colapso/descartados do store). */
  protected readonly displayed = computed(() => this.visible().visibleNodes);

  protected readonly displayedChildrenByFather = computed(() => {
    const map = new Map<string, LinkResult[]>();
    for (const node of this.displayed()) {
      if (!node.fatherCode) {
        continue;
      }
      const list = map.get(node.fatherCode);
      if (list) {
        list.push(node);
      } else {
        map.set(node.fatherCode, [node]);
      }
    }
    return map;
  });

  protected readonly teamName = computed(() => {
    const teamCode = this.root()?.teamCode;

    if (!teamCode) {
      return this.i18n.t('canvas.noTeam');
    }

    return (
      this.teams.teams().find((team) => team.code === teamCode)?.name ?? this.i18n.t('panel.team')
    );
  });

  protected readonly authorName = computed(() => {
    const code = this.root()?.autorCode;

    if (!code) {
      return this.i18n.t('canvas.noAuthor');
    }

    return this.users.usersByCode().get(code)?.name ?? this.i18n.t('canvas.authorFallback');
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const code = params.get('rootCode');

      if (!code) {
        return;
      }

      this.code.set(code);
      this.tree.reset();
      this.drawerOpen.set(false);
      void this.load(code);
    });

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const requested = params.get('no');
      const nodes = this.tree.nodes();

      if (nodes.length === 0) {
        return;
      }

      if (!requested) {
        if (this.tree.selectedCode()) {
          this.tree.selectNode(null);
          this.drawerOpen.set(false);
        }
        return;
      }

      if (nodes.some((node) => node.code === requested)) {
        this.tree.selectNode(requested);
        this.drawerOpen.set(true);
      }
    });
  }

  protected async load(code: string): Promise<void> {
    await this.tree.load(code);

    const root = this.root();

    if (!root) {
      return;
    }

    const requested = this.route.snapshot.queryParamMap.get('no');
    const selected =
      requested && this.tree.nodes().some((node) => node.code === requested)
        ? requested
        : root.code;

    this.tree.selectNode(selected);
    this.drawerOpen.set(selected !== root.code || Boolean(requested));

    if (root.teamCode && !this.teams.teams().some((team) => team.code === root.teamCode)) {
      void this.teams.load(root.teamCode).catch(() => undefined);
    }

    await this.users.ensureLoaded(
      [root.autorCode].filter((value): value is string => Boolean(value)),
    );
  }

  protected async refresh(): Promise<void> {
    await this.tree.refresh();
  }

  protected selectNode(code: string): void {
    this.tree.selectNode(code);
    this.drawerOpen.set(true);

    if (this.route.snapshot.queryParamMap.get('no') !== code) {
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { no: code },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }
  }

  protected closePanel(): void {
    this.tree.selectNode(null);
    this.drawerOpen.set(false);

    if (this.route.snapshot.queryParamMap.has('no')) {
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { no: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }
  }

  protected goHome(): void {
    const root = this.root();
    if (!root) {
      return;
    }
    this.tree.selectNode(root.code);
    this.drawerOpen.set(false);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { no: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected onLayoutChange(mode: TreeLayoutMode): void {
    this.layoutMode.set(mode);
  }

  protected goTeam(): void {
    const teamCode = this.root()?.teamCode;
    void this.router.navigate(teamCode ? ['/equipes', teamCode] : ['/equipes']);
  }

  protected onCreateChildRequested(code: string): void {
    const father = this.nodes().find((node) => node.code === code);
    if (father) {
      void this.createChild(father);
    }
  }

  protected toggleCollapse(code: string): void {
    this.tree.toggleCollapsed(code);
  }

  protected setShowDiscarded(value: boolean): void {
    this.tree.setShowDiscarded(value);
  }

  protected expandAll(): void {
    this.tree.expandAll();
  }

  protected collapseAll(): void {
    this.tree.collapseAll();
  }

  protected async createChild(father: LinkResult | null): Promise<void> {
    const parent = father ?? this.selectedNode() ?? this.root();

    if (!parent) {
      return;
    }

    const ref = this.dialogs.open<
      CreateLinkRequest,
      { mode: 'child'; father: LinkResult; teamCode: string | null }
    >(LinkFormDialogComponent, {
      data: { mode: 'child', father: parent, teamCode: parent.teamCode },
      width: '560px',
    });
    const request = await firstValueFrom(ref.closed);

    if (!request) {
      return;
    }

    try {
      if (this.collapsedCodes().has(parent.code)) {
        this.tree.toggleCollapsed(parent.code);
      }

      const created = await this.tree.create(request);
      this.notifications.success(this.i18n.t('ws.nodeCreated'));
      this.selectNode(created.code);
    } catch {
      this.notifications.error(this.i18n.t('ws.nodeCreateFailed'));
    }
  }
}
