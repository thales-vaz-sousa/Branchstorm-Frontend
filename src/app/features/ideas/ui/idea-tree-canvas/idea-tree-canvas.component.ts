import {
  type AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  type ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { stratify, tree as d3Tree } from 'd3-hierarchy';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { StatusBadgeComponent } from '@shared/ui/status-badge/status-badge.component';
import { ButtonDirective } from '@shared/ui/button/button.directive';
import { BS_MENU } from '@shared/ui/menu/menu';
import { CdkMenuTrigger } from '@angular/cdk/menu';
import type { LinkResult } from '@shared/models/link.model';
import { findPathToNode } from '@shared/utils/tree.util';
import { linkTypeLabel, linkValidationLabel } from '@shared/utils/enum.util';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { I18nService } from '@core/i18n/i18n.service';
import { formatDate } from '@shared/utils/date.util';

export type TreeLayoutMode = 'landscape' | 'portrait';

export interface TreeStatsView {
  readonly total: number;
  readonly open: number;
  readonly selected: number;
  readonly discarded: number;
  readonly final: number;
}

const NODE_WIDTH = 250;
const NODE_HEIGHT = 112;
const LEVEL_GAP = 80;
const SIBLING_GAP = 28;
const PADDING = 48;

interface PositionedNode {
  readonly node: LinkResult;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly depth: number;
  readonly childrenCount: number;
  readonly collapsed: boolean;
  readonly cx: number;
  readonly cy: number;
}

interface PositionedLink {
  readonly key: string;
  readonly path: string;
  readonly active: boolean;
}

interface GhostSlot {
  readonly fatherCode: string;
  readonly x: number;
  readonly y: number;
  readonly label: string;
  readonly cx: number;
  readonly cy: number;
}

interface TreeLayoutResult {
  readonly nodes: readonly PositionedNode[];
  readonly links: readonly PositionedLink[];
  readonly ghost: GhostSlot | null;
  readonly ghostPath: string | null;
  readonly width: number;
  readonly height: number;
}

const EMPTY_LAYOUT: TreeLayoutResult = {
  nodes: [],
  links: [],
  ghost: null,
  ghostPath: null,
  width: 0,
  height: 0,
};

@Component({
  selector: 'app-idea-tree-canvas',
  imports: [IconComponent, StatusBadgeComponent, ButtonDirective, TranslatePipe, ...BS_MENU],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './idea-tree-canvas.component.html',
  styleUrl: './idea-tree-canvas.component.scss',
})
export class IdeaTreeCanvasComponent implements AfterViewInit {
  readonly nodes = input.required<readonly LinkResult[]>();
  readonly childrenByFather = input.required<ReadonlyMap<string, readonly LinkResult[]>>();
  readonly childCounts = input<ReadonlyMap<string, number>>(new Map());
  readonly authors = input<ReadonlyMap<string, string>>(new Map());
  readonly selectedCode = input<string | null>(null);
  readonly collapsedCodes = input.required<ReadonlySet<string>>();
  readonly layoutMode = input<TreeLayoutMode>('landscape');
  readonly stats = input<TreeStatsView | null>(null);
  readonly showDiscarded = input(true);
  readonly rootNode = input<LinkResult | null>(null);
  readonly teamName = input('');

  readonly nodeSelected = output<string>();
  readonly collapseToggled = output<string>();
  readonly panelClosed = output<void>();
  readonly createChildRequested = output<string>();
  readonly expandAll = output<void>();
  readonly collapseAll = output<void>();
  readonly showDiscardedChange = output<boolean>();
  readonly layoutChange = output<TreeLayoutMode>();
  readonly homeRequested = output<void>();
  readonly teamRequested = output<void>();

  private readonly canvas = viewChild<ElementRef<HTMLElement>>('canvas');
  private readonly layoutTrigger = viewChild(CdkMenuTrigger);
  private readonly destroyRef = inject(DestroyRef);
  private readonly i18n = inject(I18nService);
  private panState: {
    readonly startX: number;
    readonly startY: number;
    readonly origX: number;
    readonly origY: number;
    moved: boolean;
  } | null = null;
  private ignoreNextClick = false;
  private centeredLayout = '';
  private panToken = 0;

  protected readonly transform = signal({ x: 0, y: 0, k: 1 });
  protected readonly showSettings = signal(false);
  /** Detalhes da árvore começam fechados por padrão. */
  protected readonly showDetails = signal(false);
  protected readonly showMinimap = signal(false);
  /** Largura do viewport (cards menores em telas finas — mobile). */
  protected readonly viewportWidth = signal<number>(typeof window === 'undefined' ? 1024 : window.innerWidth);

  /** Tamanho do card: 250×112 no desktop, 180×96 em telas finas. */
  protected readonly nodeW = computed(() => (this.viewportWidth() <= 640 ? 180 : NODE_WIDTH));
  protected readonly nodeH = computed(() => (this.viewportWidth() <= 640 ? 96 : NODE_HEIGHT));

  /** Minimapa: pontos dos nós + retângulo do viewport no espaço do layout. */
  protected readonly minimapViewport = computed(() => {
    const layout = this.layout();
    const element = this.canvas()?.nativeElement;
    const value = this.transform();

    if (!element || layout.width < 2 || layout.height < 2) {
      return { x: 0, y: 0, w: 0, h: 0, s: 1, ox: 0, oy: 0 };
    }

    const box = 180;
    const scale = Math.min(box / layout.width, box / layout.height);
    const offsetX = (box - layout.width * scale) / 2;
    const offsetY = (box - layout.height * scale) / 2;
    const rect = element.getBoundingClientRect();

    return {
      x: offsetX + (-value.x / value.k) * scale,
      y: offsetY + (-value.y / value.k) * scale,
      w: (rect.width / value.k) * scale,
      h: (rect.height / value.k) * scale,
      s: scale,
      ox: offsetX,
      oy: offsetY,
    };
  });

  protected readonly layout = computed<TreeLayoutResult>(() => {
    const visible = this.nodes();
    const mode = this.layoutMode();

    if (visible.length === 0) {
      return EMPTY_LAYOUT;
    }

    const byCode = new Map(visible.map((node) => [node.code, node] as const));

    try {
      // Só órfãos reais (pai fora do conjunto visível) viram filhos da primeira raiz.
      // NUNCA reparentar os filhos normais — isso empilhavam os cards.
      const allRoots = visible.filter((node) => !node.fatherCode || !byCode.has(node.fatherCode));
      const anchorRoot = allRoots[0];
      const orphanCodes = new Set(
        (anchorRoot ? allRoots.filter((node) => node !== anchorRoot) : allRoots).map(
          (node) => node.code,
        ),
      );

      const hierarchy = stratify<LinkResult>()
        .id((node) => node.code)
        .parentId((node) =>
          orphanCodes.has(node.code)
            ? anchorRoot!.code
            : node.fatherCode && byCode.has(node.fatherCode)
              ? node.fatherCode
              : undefined,
        )([...visible]);

      const w = this.nodeW();
      const h = this.nodeH();
      const treeLayout = d3Tree<LinkResult>().nodeSize(
        mode === 'portrait'
          ? // retrato: irmãos lado a lado (precisa do vão da LARGURA do card)
            [w + SIBLING_GAP, h + LEVEL_GAP]
          : [h + SIBLING_GAP, w + LEVEL_GAP],
      );
      const root = treeLayout(hierarchy);
      const descendants = root.descendants();
      const minX = Math.min(...descendants.map((item) => item.x));
      const maxX = Math.max(...descendants.map((item) => item.x));
      const maxDepth = Math.max(...descendants.map((item) => item.depth));

      const positioned = descendants.map<PositionedNode>((item) => {
        if (mode === 'portrait') {
          return {
            node: item.data,
            x: PADDING + (item.x - minX),
            y: PADDING + item.y,
            w,
            h,
            depth: item.depth,
            childrenCount: this.childCounts().get(item.data.code) ?? 0,
            collapsed: this.collapsedCodes().has(item.data.code),
            cx: PADDING + (item.x - minX) + w / 2,
            cy: PADDING + item.y + h / 2,
          };
        }

        return {
          node: item.data,
          x: PADDING + item.y,
          y: PADDING + (item.x - minX),
          w,
          h,
          depth: item.depth,
          childrenCount: this.childCounts().get(item.data.code) ?? 0,
          collapsed: this.collapsedCodes().has(item.data.code),
          cx: PADDING + item.y + w / 2,
          cy: PADDING + (item.x - minX) + h / 2,
        };
      });

      const byId = new Map(positioned.map((item) => [item.node.code, item] as const));
      const selected = this.selectedCode();
      const activeKeys = new Set<string>();

      if (selected) {
        const path = findPathToNode(visible, selected);

        for (let index = 1; index < path.length; index += 1) {
          const parent = path[index - 1];
          const child = path[index];

          if (parent && child) {
            activeKeys.add(`${parent.code}->${child.code}`);
          }
        }
      }

      const links = root.links().flatMap<PositionedLink>((link) => {
        const source = byId.get(link.source.data.code);
        const target = byId.get(link.target.data.code);

        if (!source || !target) {
          return [];
        }

        const key = `${source.node.code}->${target.node.code}`;
        return [
          {
            key,
            path: this.linkPath(source, target, mode),
            active: activeKeys.has(key),
          },
        ];
      });

      let width: number;
      let height: number;

      if (mode === 'portrait') {
        width = PADDING * 2 + (maxX - minX) + w;
        height = PADDING * 2 + maxDepth * (h + LEVEL_GAP) + h;
      } else {
        width = PADDING * 2 + maxDepth * (w + LEVEL_GAP) + w;
        height = PADDING * 2 + (maxX - minX) + h;
      }

      const ghost = this.buildGhost(positioned, mode);
      if (ghost) {
        width = Math.max(width, ghost.slot.x + w + PADDING);
        height = Math.max(height, ghost.slot.y + h + PADDING);
      }

      return {
        nodes: positioned,
        links,
        ghost: ghost?.slot ?? null,
        ghostPath: ghost?.path ?? null,
        width,
        height,
      };
    } catch {
      return EMPTY_LAYOUT;
    }
  });

  protected readonly stageTransform = computed(() => {
    const value = this.transform();
    return `translate(${value.x}px, ${value.y}px) scale(${value.k})`;
  });

  protected readonly zoomLabel = computed(() => `${Math.round(this.transform().k * 100)}%`);
  protected readonly isPortrait = computed(() => this.layoutMode() === 'portrait');

  protected readonly layoutOptions: readonly { value: TreeLayoutMode; labelKey: string }[] = [
    { value: 'landscape', labelKey: 'layout.landscape' },
    { value: 'portrait', labelKey: 'layout.portrait' },
  ];

  protected layoutLabel(): string {
    return this.i18n.t(
      this.layoutOptions.find((option) => option.value === this.layoutMode())?.labelKey ??
        'layout.landscape',
    );
  }

  protected layoutLabelFor(mode: TreeLayoutMode): string {
    return this.i18n.t(mode === 'landscape' ? 'layout.landscape' : 'layout.portrait');
  }

  protected chooseLayout(mode: TreeLayoutMode): void {
    this.layoutChange.emit(mode);
  }

  /** Um popup fecha o outro: nada de menu de layout + settings abertos juntos. */
  protected toggleSettings(): void {
    this.showSettings.set(!this.showSettings());

    if (this.showSettings()) {
      this.layoutTrigger()?.close();
    }
  }

  protected closeSettings(): void {
    this.showSettings.set(false);
  }

  constructor() {
    effect(() => {
      const layout = this.layout();

      if (layout.nodes.length === 0) {
        this.centeredLayout = '';
        return;
      }

      // Só recentraliza em mudança de estrutura (nº de nós / layout) — nunca na seleção,
      // senão o mapa pula a cada clique (parece reload).
      const signature = `${layout.nodes.length}:${this.layoutMode()}`;

      if (signature !== this.centeredLayout) {
        this.centeredLayout = signature;
        requestAnimationFrame(() => this.center());
      }
    });
  }

  ngAfterViewInit(): void {
    this.onResize();
    window.addEventListener('resize', this.onResize);
    this.destroyRef.onDestroy(() => window.removeEventListener('resize', this.onResize));
    this.setupZoom();
    this.observeFullscreen();

    if (this.layout().nodes.length > 0) {
      requestAnimationFrame(() => this.center());
    }
  }

  private readonly onResize = (): void => {
    this.viewportWidth.set(window.innerWidth);
  };

  protected typeLabel(node: LinkResult): string {
    return linkTypeLabel(node.type, this.i18n.lang());
  }

  protected validationLabel(node: LinkResult): string {
    return linkValidationLabel(node.validation, this.i18n.lang());
  }

  protected ghostLabel(node: LinkResult): string {
    return this.i18n.t(node.type === 'Problem' ? 'canvas.ghostSolution' : 'canvas.ghostBranch');
  }

  protected authorName(code: string | null): string {
    if (!code) {
      return this.i18n.t('canvas.noAuthor');
    }

    return this.authors().get(code) ?? this.i18n.t('canvas.authorFallback');
  }

  protected shortDate(value: string): string {
    return formatDate(value);
  }

  protected metaLine(node: LinkResult): string {
    return `${this.authorName(node.autorCode)} · ${this.shortDate(node.creationDate)} · ${node.code.slice(0, 8)}`;
  }

  protected tooltip(node: LinkResult): string {
    return `${node.title} — ${this.shortDate(node.creationDate)} · ${node.code}`;
  }

  protected select(code: string): void {
    this.nodeSelected.emit(code);
  }

  protected requestChild(event: MouseEvent, code: string): void {
    event.stopPropagation();
    this.createChildRequested.emit(code);
  }

  protected toggleCollapse(event: MouseEvent, code: string): void {
    event.stopPropagation();
    this.collapseToggled.emit(code);
  }

  protected onNodeKeydown(event: KeyboardEvent, item: PositionedNode): void {
    if (event.target !== event.currentTarget) {
      return;
    }

    const code = item.node.code;
    const fatherCode = item.node.fatherCode;
    const siblings = fatherCode ? (this.childrenByFather().get(fatherCode) ?? []) : [];
    const children = this.childrenByFather().get(code) ?? [];
    const vertical = this.layoutMode() === 'portrait';

    switch (event.key) {
      case 'ArrowLeft': {
        if (!vertical && fatherCode) {
          event.preventDefault();
          this.moveTo(fatherCode);
        } else if (vertical) {
          const index = siblings.findIndex((sibling) => sibling.code === code);
          const prev = siblings[index - 1];
          if (prev) {
            event.preventDefault();
            this.moveTo(prev.code);
          }
        }
        break;
      }
      case 'ArrowRight': {
        if (!vertical) {
          const firstChild = children[0];

          if (!firstChild) {
            break;
          }

          event.preventDefault();

          if (item.collapsed) {
            this.collapseToggled.emit(code);
            requestAnimationFrame(() => this.moveTo(firstChild.code, false));
          } else {
            this.moveTo(firstChild.code);
          }
        } else {
          const index = siblings.findIndex((sibling) => sibling.code === code);
          const next = siblings[index + 1];
          if (next) {
            event.preventDefault();
            this.moveTo(next.code);
          }
        }
        break;
      }
      case 'ArrowUp': {
        if (vertical && fatherCode) {
          event.preventDefault();
          this.moveTo(fatherCode);
        } else if (!vertical) {
          const index = siblings.findIndex((sibling) => sibling.code === code);
          const prev = siblings[index - 1];
          if (prev) {
            event.preventDefault();
            this.moveTo(prev.code);
          }
        }
        break;
      }
      case 'ArrowDown': {
        if (vertical) {
          const firstChild = children[0];
          if (firstChild) {
            event.preventDefault();
            if (item.collapsed) {
              this.collapseToggled.emit(code);
              requestAnimationFrame(() => this.moveTo(firstChild.code, false));
            } else {
              this.moveTo(firstChild.code);
            }
          }
        } else {
          const index = siblings.findIndex((sibling) => sibling.code === code);
          const next = siblings[index + 1];
          if (next) {
            event.preventDefault();
            this.moveTo(next.code);
          }
        }
        break;
      }
      case 'Enter':
      case ' ': {
        event.preventDefault();
        this.nodeSelected.emit(code);
        break;
      }
      case 'Escape': {
        event.preventDefault();
        this.panelClosed.emit();
        break;
      }
      default:
        break;
    }
  }

  protected zoomBy(factor: number): void {
    const element = this.canvas()?.nativeElement;

    if (!element) {
      return;
    }

    const rect = element.getBoundingClientRect();
    this.zoomAt(rect.width / 2, rect.height / 2, factor);
  }

  protected center(): void {
    const element = this.canvas()?.nativeElement;
    const layout = this.layout();

    if (!element || layout.nodes.length === 0) {
      return;
    }

    const rect = element.getBoundingClientRect();

    if (rect.width < 2 || rect.height < 2) {
      return;
    }

    const fit = Math.min(
      (rect.width - PADDING * 2) / Math.max(layout.width, 1),
      (rect.height - PADDING * 2) / Math.max(layout.height, 1),
    );
    const narrow = rect.width <= 640;

    // Telas finas: nunca encolher a ponto de ilegível — abre no tamanho
    // mínimo de leitura e centraliza na raiz (o resto se arrasta/pinça).
    const scale = narrow
      ? Math.min(1, Math.max(fit, 0.6))
      : Math.min(1.1, Math.max(0.2, fit));

    if (narrow) {
      const root = layout.nodes.find((item) => item.depth === 0) ?? layout.nodes[0];
      if (!root) {
        return;
      }
      this.animateTo({
        x: rect.width * 0.38 - root.cx * scale,
        y: rect.height * 0.42 - root.cy * scale,
        k: scale,
      });
      return;
    }

    this.animateTo({
      x: (rect.width - layout.width * scale) / 2,
      y: (rect.height - layout.height * scale) / 2,
      k: scale,
    });
  }

  protected goHome(): void {
    this.homeRequested.emit();
    this.center();
  }

  protected goTarget(): void {
    const selected = this.selectedCode();
    if (selected) {
      this.centerOn(selected);
    } else {
      this.center();
    }
  }

  protected toggleFullscreen(): void {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }

    // Fullscreen no container do workspace (canvas + gaveta), senão o painel
    // lateral fica fora do elemento fullscreen e parece que "não abre".
    const target =
      this.canvas()?.nativeElement.closest<HTMLElement>('.workspace') ??
      this.canvas()?.nativeElement;

    void target?.requestFullscreen?.();
  }

  protected centerOn(code: string): void {
    const element = this.canvas()?.nativeElement;
    const item = this.layout().nodes.find((node) => node.node.code === code);

    if (!element || !item) {
      return;
    }

    const rect = element.getBoundingClientRect();
    const k = this.transform().k;
    this.animateTo({
      x: rect.width / 2 - item.cx * k,
      y: rect.height / 2 - item.cy * k,
      k,
    });
  }

  protected onDiscardedToggle(event: Event): void {
    this.showDiscardedChange.emit((event.target as HTMLInputElement).checked);
  }

  /** Arrastar dentro do minimapa move o mapa (o retângulo acompanha). */
  protected onMinimapDown(event: PointerEvent): void {
    event.stopPropagation();
    event.preventDefault();

    const startX = event.clientX;
    const startY = event.clientY;
    const startTransform = this.transform();
    const svgRect = (event.currentTarget as SVGSVGElement).getBoundingClientRect();
    let moved = false;

    const onMove = (moveEvent: PointerEvent): void => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      if (!moved && Math.abs(dx) + Math.abs(dy) > 3) {
        moved = true;
      }

      if (moved) {
        this.transform.set({
          x: startTransform.x + dx,
          y: startTransform.y + dy,
          k: startTransform.k,
        });
      }
    };

    const onUp = (upEvent: PointerEvent): void => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);

      if (moved) {
        this.ignoreNextClick = true;
      } else {
        // Clique sem arrastar: centra o mapa no ponto clicado (estilo FamilySearch).
        const geom = this.minimapViewport();
        const rect = this.canvas()?.nativeElement?.getBoundingClientRect();

        if (rect && geom.s > 0) {
          const layoutX = (upEvent.clientX - svgRect.left - geom.ox) / geom.s;
          const layoutY = (upEvent.clientY - svgRect.top - geom.oy) / geom.s;
          const k = this.transform().k;

          this.animateTo({
            x: rect.width / 2 - layoutX * k,
            y: rect.height / 2 - layoutY * k,
            k,
          });
        }
      }
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  }

  private linkPath(source: PositionedNode, target: PositionedNode, mode: TreeLayoutMode): string {
    if (mode === 'portrait') {
      const sy = source.y + source.h;
      const ty = target.y;
      const midY = (sy + ty) / 2;
      return `M ${source.cx} ${sy} L ${source.cx} ${midY} L ${target.cx} ${midY} L ${target.cx} ${ty}`;
    }

    const sx = source.x + source.w;
    const tx = target.x;
    const midX = (sx + tx) / 2;
    return `M ${sx} ${source.cy} L ${midX} ${source.cy} L ${midX} ${target.cy} L ${tx} ${target.cy}`;
  }

  private buildGhost(
    positioned: readonly PositionedNode[],
    mode: TreeLayoutMode,
  ): { slot: GhostSlot; path: string } | null {
    const selected = this.selectedCode();
    const anchor =
      positioned.find((item) => item.node.code === selected) ??
      positioned.find((item) => item.depth === 0) ??
      positioned[0];

    if (!anchor) {
      return null;
    }

    const label = this.ghostLabel(anchor.node);

    if (mode === 'portrait') {
      const children = positioned.filter((item) => item.node.fatherCode === anchor.node.code);
      const x =
        children.length > 0
          ? Math.max(...children.map((item) => item.x + item.w)) + SIBLING_GAP
          : anchor.x;
      const y = anchor.y + anchor.h + LEVEL_GAP;
      const midY = (anchor.y + anchor.h + y) / 2;
      const path = `M ${anchor.cx} ${anchor.y + anchor.h} L ${anchor.cx} ${midY} L ${x + anchor.w / 2} ${midY} L ${x + anchor.w / 2} ${y}`;
      return {
        slot: {
          fatherCode: anchor.node.code,
          x,
          y,
          label,
          cx: x + anchor.w / 2,
          cy: y + anchor.h / 2,
        },
        path,
      };
    }

    const children = positioned.filter((item) => item.node.fatherCode === anchor.node.code);
    const x = anchor.x + anchor.w + LEVEL_GAP;
    const y =
      children.length > 0
        ? Math.max(...children.map((item) => item.y + item.h)) + SIBLING_GAP
        : anchor.y;
    const midX = (anchor.x + anchor.w + x) / 2;
    const path = `M ${anchor.x + anchor.w} ${anchor.cy} L ${midX} ${anchor.cy} L ${midX} ${y + anchor.h / 2} L ${x} ${y + anchor.h / 2}`;
    return {
      slot: {
        fatherCode: anchor.node.code,
        x,
        y,
        label,
        cx: x + anchor.w / 2,
        cy: y + anchor.h / 2,
      },
      path,
    };
  }

  private observeFullscreen(): void {
    let overlayObserver: MutationObserver | null = null;

    const moveOverlays = (): void => {
      const container = document.querySelector('.cdk-overlay-container');
      const target = document.fullscreenElement ?? document.body;

      if (container && container.parentElement !== target) {
        // CDK renderiza diálogos/menus no body; no fullscreen eles ficavam
        // invisíveis (fora da subárvore). Move o container para o fullscreen.
        target.appendChild(container);
      }
    };

    const onChange = (): void => {
      if (document.fullscreenElement) {
        moveOverlays();

        // O container do CDK pode nascer (lazy) depois do fullscreen,
        // já no body — vigia e traz para dentro do fullscreen.
        overlayObserver ??= new MutationObserver(moveOverlays);
        overlayObserver.observe(document.body, { childList: true });
      } else {
        overlayObserver?.disconnect();
        overlayObserver = null;
        moveOverlays(); // devolve ao body
      }

      requestAnimationFrame(() => this.center());
    };

    document.addEventListener('fullscreenchange', onChange);
    this.destroyRef.onDestroy(() => {
      document.removeEventListener('fullscreenchange', onChange);
      overlayObserver?.disconnect();

      // Nunca deixar o container do CDK preso num fullscreen removido.
      const container = document.querySelector('.cdk-overlay-container');
      if (container && container.parentElement !== document.body) {
        document.body.appendChild(container);
      }
    });
  }

  private setupZoom(): void {
    const element = this.canvas()?.nativeElement;

    if (!element) {
      return;
    }

    const overUi = (event: Event): boolean => {
      const target = event.target as HTMLElement | null;
      return Boolean(
        target?.closest(
          '.canvas__toolbar, .canvas__details, .canvas__settings, .canvas__minimap-wrap',
        ),
      );
    };

    // Multi-toque: 1 dedo = pan, 2 dedos = pinch (zoom + pan pelo ponto médio).
    const pointers = new Map<number, { x: number; y: number }>();
    let pinch: { lastDist: number } | null = null;

    element.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || overUi(event)) {
        return;
      }

      // Sem setPointerCapture: capture redireciona o evento `click` para o canvas
      // e o card nunca recebe o clique (painel não abria). Pan via listeners na window.
      this.panToken += 1;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinch = { lastDist: Math.hypot(b!.x - a!.x, b!.y - a!.y) };
        this.panState = null;
      } else {
        const pan = {
          startX: event.clientX,
          startY: event.clientY,
          origX: this.transform().x,
          origY: this.transform().y,
          moved: false,
        };
        this.panState = pan;

        const onMove = (moveEvent: PointerEvent): void => {
          const tracked = pointers.get(moveEvent.pointerId);

          if (tracked) {
            tracked.x = moveEvent.clientX;
            tracked.y = moveEvent.clientY;
          }

          if (pinch && pointers.size === 2) {
            const [a, b] = [...pointers.values()];
            const dist = Math.hypot(b!.x - a!.x, b!.y - a!.y);
            const rect = element.getBoundingClientRect();

            if (pinch.lastDist > 4 && dist > 4) {
              this.zoomAt(
                (a!.x + b!.x) / 2 - rect.left,
                (a!.y + b!.y) / 2 - rect.top,
                dist / pinch.lastDist,
              );
              pinch.lastDist = dist;
            }

            return;
          }

          if (!this.panState) {
            return;
          }

          const dx = moveEvent.clientX - pan.startX;
          const dy = moveEvent.clientY - pan.startY;

          if (!pan.moved && Math.abs(dx) + Math.abs(dy) > 4) {
            pan.moved = true;
          }

          if (pan.moved) {
            this.transform.set({ x: pan.origX + dx, y: pan.origY + dy, k: this.transform().k });
          }
        };

        const onUp = (upEvent: PointerEvent): void => {
          pointers.delete(upEvent.pointerId);

          if (pointers.size < 2) {
            pinch = null;
          }

          if (pointers.size === 0) {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('pointercancel', onUp);

            if (pan.moved) {
              this.ignoreNextClick = true;
            }

            this.panState = null;
          }
        };

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
      }
    });

    element.addEventListener(
      'click',
      (event) => {
        if (this.ignoreNextClick) {
          this.ignoreNextClick = false;
          event.stopPropagation();
        }
      },
      true,
    );

    element.addEventListener(
      'wheel',
      (event: WheelEvent) => {
        if (overUi(event)) {
          return;
        }

        event.preventDefault();

        // Pinch no mousepad chega como wheel com ctrlKey — zoom mais firme.
        const sensitivity = event.ctrlKey ? 0.01 : 0.0025;
        const rect = element.getBoundingClientRect();
        this.zoomAt(
          event.clientX - rect.left,
          event.clientY - rect.top,
          Math.exp(-event.deltaY * sensitivity),
        );
      },
      { passive: false },
    );
  }

  private zoomAt(focalX: number, focalY: number, factor: number): void {
    this.panToken += 1;
    const current = this.transform();
    const k = Math.min(1.8, Math.max(0.2, current.k * factor));
    const ratio = k / current.k;
    this.transform.set({
      x: focalX - (focalX - current.x) * ratio,
      y: focalY - (focalY - current.y) * ratio,
      k,
    });
  }

  /** Interpola o transform em ~220ms (fluido, sem salto). */
  private animateTo(target: { x: number; y: number; k: number }): void {
    const from = this.transform();
    const token = ++this.panToken;
    const start = performance.now();
    const duration = 220;

    const step = (now: number): void => {
      if (token !== this.panToken) {
        return;
      }

      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);

      this.transform.set({
        x: from.x + (target.x - from.x) * eased,
        y: from.y + (target.y - from.y) * eased,
        k: from.k + (target.k - from.k) * eased,
      });

      if (t < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }

  private moveTo(code: string, emit = true): void {
    if (emit) {
      this.nodeSelected.emit(code);
    }

    requestAnimationFrame(() => {
      const element = this.canvas()?.nativeElement.querySelector<HTMLElement>(
        `[data-code="${CSS.escape(code)}"]`,
      );
      element?.focus();
    });
  }
}
