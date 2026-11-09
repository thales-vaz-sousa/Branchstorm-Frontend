import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { toApiError, type ApiError } from '@core/api/api-error';
import { RecentStore } from '@core/storage/recent.store';
import type {
  CreateLinkRequest,
  LinkResult,
  MarkLinkFinalRequest,
  SelectLinkRequest,
} from '@shared/models/link.model';
import { buildVisibleTree, findPathToNode, findRoot } from '@shared/utils/tree.util';
import { IdeaApi } from '../data-access/idea-api.service';

export interface IdeaTreeStats {
  readonly total: number;
  readonly problems: number;
  readonly solutions: number;
  readonly versions: number;
  readonly open: number;
  readonly selected: number;
  readonly discarded: number;
  readonly final: number;
}

@Injectable({ providedIn: 'root' })
export class IdeaTreeStore {
  private readonly api = inject(IdeaApi);
  private readonly recent = inject(RecentStore);

  private readonly _nodes = signal<readonly LinkResult[]>([]);
  private readonly _rootCode = signal<string | null>(null);
  private readonly _selectedCode = signal<string | null>(null);
  private readonly _collapsedCodes = signal<ReadonlySet<string>>(new Set());
  private readonly _showDiscarded = signal(true);
  private readonly _loading = signal(false);
  private readonly _saving = signal(false);
  private readonly _error = signal<ApiError | null>(null);

  readonly nodes = this._nodes.asReadonly();
  readonly rootCode = this._rootCode.asReadonly();
  readonly selectedCode = this._selectedCode.asReadonly();
  readonly collapsedCodes = this._collapsedCodes.asReadonly();
  readonly showDiscarded = this._showDiscarded.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly error = this._error.asReadonly();

  readonly root = computed(() => {
    const code = this._rootCode();
    return code ? findRoot(this._nodes(), code) : null;
  });

  readonly selectedNode = computed(() => {
    const code = this._selectedCode();
    return code ? (this._nodes().find((node) => node.code === code) ?? null) : null;
  });

  readonly visible = computed(() =>
    buildVisibleTree(this._nodes(), {
      showDiscarded: this._showDiscarded(),
      collapsedCodes: this._collapsedCodes(),
    }),
  );

  readonly selectedPath = computed(() => {
    const code = this._selectedCode();
    return code ? findPathToNode(this._nodes(), code) : [];
  });

  readonly selectedChildren = computed(() => {
    const code = this._selectedCode();
    if (!code) {
      return [];
    }
    return this.visible().childrenByFather.get(code) ?? [];
  });

  readonly stats = computed<IdeaTreeStats>(() => {
    const nodes = this._nodes();
    return {
      total: nodes.length,
      problems: nodes.filter((node) => node.type === 'Problem').length,
      solutions: nodes.filter((node) => node.type === 'Solution').length,
      versions: nodes.filter((node) => node.type === 'Version').length,
      open: nodes.filter((node) => node.status === 'Open').length,
      selected: nodes.filter((node) => node.status === 'Selected').length,
      discarded: nodes.filter((node) => node.status === 'Discarded').length,
      final: nodes.filter((node) => node.status === 'Final').length,
    };
  });

  async load(rootCode: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    this._rootCode.set(rootCode);

    try {
      const nodes = await firstValueFrom(this.api.findTree(rootCode));
      this._nodes.set(nodes);
      const root = findRoot(nodes, rootCode);

      if (root) {
        this.recent.addIdea(root);
      }

      if (!this._selectedCode() || !nodes.some((node) => node.code === this._selectedCode())) {
        this._selectedCode.set(root?.code ?? null);
      }
    } catch (error) {
      this._error.set(toApiError(error));
    } finally {
      this._loading.set(false);
    }
  }

  async refresh(): Promise<void> {
    const rootCode = this._rootCode();
    if (rootCode) {
      await this.load(rootCode);
    }
  }

  async create(request: CreateLinkRequest): Promise<LinkResult> {
    this._saving.set(true);

    try {
      const created = await firstValueFrom(this.api.create(request));
      this._nodes.update((nodes) => [...nodes, created]);
      this._selectedCode.set(created.code);

      if (!request.fatherCode) {
        this._rootCode.set(created.code);
        this.recent.addIdea(created);
      }

      return created;
    } finally {
      this._saving.set(false);
    }
  }

  async select(code: string, request: SelectLinkRequest = {}): Promise<void> {
    this._saving.set(true);

    try {
      await firstValueFrom(this.api.select(code, request));
      await this.refresh();
    } finally {
      this._saving.set(false);
    }
  }

  async markFinal(code: string, request: MarkLinkFinalRequest = {}): Promise<void> {
    this._saving.set(true);

    try {
      await firstValueFrom(this.api.markFinal(code, request));
      await this.refresh();
    } finally {
      this._saving.set(false);
    }
  }

  selectNode(code: string | null): void {
    this._selectedCode.set(code);
  }

  toggleCollapsed(code: string): void {
    this._collapsedCodes.update((current) => {
      const next = new Set(current);

      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }

      return next;
    });
  }

  expandAll(): void {
    this._collapsedCodes.set(new Set());
  }

  collapseAll(): void {
    const parents = new Set(
      this._nodes()
        .map((node) => node.fatherCode)
        .filter((code): code is string => Boolean(code)),
    );
    this._collapsedCodes.set(parents);
  }

  setShowDiscarded(value: boolean): void {
    this._showDiscarded.set(value);
  }

  reset(): void {
    this._nodes.set([]);
    this._rootCode.set(null);
    this._selectedCode.set(null);
    this._collapsedCodes.set(new Set());
    this._error.set(null);
  }
}
