import { TestBed } from '@angular/core/testing';
import { IdeaTreeCanvasComponent } from './idea-tree-canvas.component';
import type { LinkResult } from '@shared/models/link.model';

// jsdom não implementa ResizeObserver (o componente observa o canvas).
class ResizeObserverStub {
  observe(): void {
    /* noop */
  }
  disconnect(): void {
    /* noop */
  }
  unobserve(): void {
    /* noop */
  }
}
if (typeof globalThis.ResizeObserver === 'undefined') {
  (globalThis as unknown as { ResizeObserver: typeof ResizeObserverStub }).ResizeObserver =
    ResizeObserverStub;
}

function node(code: string, fatherCode: string | null, title: string): LinkResult {
  return {
    code,
    fatherCode,
    type: fatherCode === null ? 'Problem' : 'Solution',
    title,
    description: null,
    status: 'Open',
    validation: 'NotTested',
    autorCode: null,
    teamCode: null,
    reason: null,
    creationDate: '2026-11-07T00:00:00',
    history: [],
  };
}

const NODES = [
  node('ROOT-1', null, 'Problema raiz'),
  node('SOL-1', 'ROOT-1', 'Solução um'),
  node('SOL-2', 'ROOT-1', 'Solução dois'),
];

describe('IdeaTreeCanvas pan/zoom', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<IdeaTreeCanvasComponent>>;
  let component: IdeaTreeCanvasComponent;
  let canvas: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IdeaTreeCanvasComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(IdeaTreeCanvasComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('nodes', NODES);
    fixture.componentRef.setInput('childrenByFather', new Map());
    fixture.componentRef.setInput('collapsedCodes', new Set<string>());
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    canvas = fixture.nativeElement.querySelector('.canvas') as HTMLElement;
    expect(canvas).toBeTruthy();
  });

  function transformOf(): string {
    return (component as unknown as { stageTransform: () => string }).stageTransform();
  }

  it('moves the stage on pointer drag over the map', () => {
    const before = transformOf();

    canvas.dispatchEvent(
      new MouseEvent('pointerdown', { bubbles: true, clientX: 300, clientY: 300, button: 0 }),
    );
    canvas.dispatchEvent(
      new MouseEvent('pointermove', { bubbles: true, clientX: 380, clientY: 340 }),
    );
    canvas.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));
    fixture.detectChanges();

    expect(transformOf()).not.toBe(before);
    expect(transformOf()).toContain('translate');
  });

  it('zooms the stage on wheel over the map', () => {
    const before = transformOf();

    canvas.dispatchEvent(
      new WheelEvent('wheel', { bubbles: true, deltaY: -100, cancelable: true }),
    );
    fixture.detectChanges();

    expect(transformOf()).not.toBe(before);
  });

  it('zooms harder on trackpad pinch (ctrl + wheel)', () => {
    const kBefore = (component as unknown as { transform: () => { k: number } }).transform().k;

    canvas.dispatchEvent(
      new WheelEvent('wheel', { bubbles: true, deltaY: -10, ctrlKey: true, cancelable: true }),
    );
    fixture.detectChanges();

    const kAfter = (component as unknown as { transform: () => { k: number } }).transform().k;
    expect(kAfter).toBeGreaterThan(kBefore);
  });

  it('zooms on trackpad pinch (2 fingers moving apart)', () => {
    const kBefore = (component as unknown as { transform: () => { k: number } }).transform().k;

    const down = (id: number, x: number, y: number): MouseEvent => {
      const event = new MouseEvent('pointerdown', {
        bubbles: true,
        clientX: x,
        clientY: y,
        button: 0,
      });
      Object.defineProperty(event as object, 'pointerId', { value: id });
      return event;
    };
    const move = (id: number, x: number, y: number): MouseEvent => {
      const event = new MouseEvent('pointermove', { bubbles: true, clientX: x, clientY: y });
      Object.defineProperty(event as object, 'pointerId', { value: id });
      return event;
    };
    const up = (id: number, x: number, y: number): MouseEvent => {
      const event = new MouseEvent('pointerup', { bubbles: true, clientX: x, clientY: y });
      Object.defineProperty(event as object, 'pointerId', { value: id });
      return event;
    };

    // dois dedos afastando (pinch abrindo)
    canvas.dispatchEvent(down(1, 900, 500));
    canvas.dispatchEvent(down(2, 1000, 500));
    canvas.dispatchEvent(move(2, 1120, 500));
    canvas.dispatchEvent(up(2, 1120, 500));
    canvas.dispatchEvent(up(1, 900, 500));
    fixture.detectChanges();

    const kAfter = (component as unknown as { transform: () => { k: number } }).transform().k;
    expect(kAfter).toBeGreaterThan(kBefore);
  });

  it('renders the minimap when showMinimap is on', () => {
    (component as unknown as { showMinimap: { set: (v: boolean) => void } }).showMinimap.set(true);
    fixture.detectChanges();

    const svg = canvas.querySelector('.canvas__minimap-svg');
    expect(svg).toBeTruthy();
    expect(svg?.querySelectorAll('circle').length).toBe(3);
  });

  it('clicking the minimap centers the map on that point', async () => {
    (component as unknown as { showMinimap: { set: (v: boolean) => void } }).showMinimap.set(true);
    fixture.detectChanges();

    const svg = canvas.querySelector('.canvas__minimap-svg') as SVGSVGElement;
    expect(svg).toBeTruthy();

    const before = (component as unknown as { transform: () => { x: number } }).transform().x;

    const down = new MouseEvent('pointerdown', {
      bubbles: true,
      clientX: 10,
      clientY: 10,
      button: 0,
    });
    Object.defineProperty(down as object, 'pointerId', { value: 7 });
    const up = new MouseEvent('pointerup', { bubbles: true, clientX: 10, clientY: 10 });
    Object.defineProperty(up as object, 'pointerId', { value: 7 });

    svg.dispatchEvent(down);
    svg.dispatchEvent(up);
    await new Promise((resolve) => setTimeout(resolve, 350));
    fixture.detectChanges();

    const after = (component as unknown as { transform: () => { x: number } }).transform().x;
    expect(after).not.toBe(before);
  });

  it('does not pan when the drag starts on the toolbar', () => {
    const before = transformOf();
    const toolbarButton = canvas.querySelector('.canvas__toolbar button') as HTMLElement;
    expect(toolbarButton).toBeTruthy();

    toolbarButton.dispatchEvent(
      new MouseEvent('pointerdown', { bubbles: true, clientX: 300, clientY: 30, button: 0 }),
    );
    canvas.dispatchEvent(
      new MouseEvent('pointermove', { bubbles: true, clientX: 400, clientY: 200 }),
    );
    canvas.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));
    fixture.detectChanges();

    expect(transformOf()).toBe(before);
  });

  it('emits nodeSelected on a plain click (no full reload — SPA output)', () => {
    const emitted: string[] = [];
    component.nodeSelected.subscribe((code) => emitted.push(code));

    const card = canvas.querySelector('[data-code="SOL-1"]') as HTMLElement;
    expect(card).toBeTruthy();

    card.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(emitted).toEqual(['SOL-1']);
  });

  it('keeps card click after pointerdown/up without movement (no capture stealing)', () => {
    const emitted: string[] = [];
    component.nodeSelected.subscribe((code) => emitted.push(code));

    const card = canvas.querySelector('[data-code="SOL-2"]') as HTMLElement;
    card.dispatchEvent(
      new MouseEvent('pointerdown', { bubbles: true, clientX: 300, clientY: 300, button: 0 }),
    );
    card.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));
    card.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(emitted).toEqual(['SOL-2']);
  });

  it('spaces siblings without overlap (root + 4 solutions)', async () => {
    const nodes = [
      node('ROOT-1', null, 'Problema raiz'),
      node('SOL-1', 'ROOT-1', 'Solução um'),
      node('SOL-2', 'ROOT-1', 'Solução dois'),
      node('SOL-3', 'ROOT-1', 'Solução três'),
      node('SOL-4', 'ROOT-1', 'Solução quatro'),
    ];
    fixture.componentRef.setInput('nodes', nodes);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const layout = (
      component as unknown as {
        layout: () => { nodes: readonly { y: number; node: { code: string } }[] };
      }
    ).layout();
    const ys = layout.nodes
      .filter((item) => item.node.code !== 'ROOT-1')
      .map((item) => item.y)
      .sort((a, b) => a - b);

    expect(ys).toHaveLength(4);
    for (let i = 1; i < ys.length; i += 1) {
      // card tem 112px de altura; irmãos precisam de >= 140px (28px de vão)
      expect(ys[i]! - ys[i - 1]!).toBeGreaterThanOrEqual(140);
    }
  });

  it('spaces siblings without overlap in portrait (cards 250px wide)', async () => {
    const nodes = [
      node('ROOT-1', null, 'Problema raiz'),
      node('SOL-1', 'ROOT-1', 'Solução um'),
      node('SOL-2', 'ROOT-1', 'Solução dois'),
      node('SOL-3', 'ROOT-1', 'Solução três'),
    ];
    fixture.componentRef.setInput('nodes', nodes);
    fixture.componentRef.setInput('layoutMode', 'portrait');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const layout = (
      component as unknown as {
        layout: () => { nodes: readonly { x: number; node: { code: string } }[] };
      }
    ).layout();
    const xs = layout.nodes
      .filter((item) => item.node.code !== 'ROOT-1')
      .map((item) => item.x)
      .sort((a, b) => a - b);

    expect(xs).toHaveLength(3);
    for (let i = 1; i < xs.length; i += 1) {
      // card tem 250px de largura; irmãos precisam de >= 278px (28px de vão)
      expect(xs[i]! - xs[i - 1]!).toBeGreaterThanOrEqual(278);
    }
  });

  it('places the toggle at the bottom in portrait (children below)', async () => {
    const nodes = [node('ROOT-1', null, 'Problema raiz'), node('SOL-1', 'ROOT-1', 'Solução um')];
    fixture.componentRef.setInput('nodes', nodes);
    fixture.componentRef.setInput('layoutMode', 'portrait');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const card = canvas.querySelector('[data-code="SOL-1"]') as HTMLElement;
    expect(card).toBeTruthy();
    expect(card.classList.contains('tree-node--portrait')).toBe(true);
  });

  it('portrait links run from the parent bottom edge to the child top edge', async () => {
    const nodes = [node('ROOT-1', null, 'Problema raiz'), node('SOL-1', 'ROOT-1', 'Solução um')];
    fixture.componentRef.setInput('nodes', nodes);
    fixture.componentRef.setInput('layoutMode', 'portrait');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const layout = (
      component as unknown as {
        layout: () => {
          nodes: readonly { x: number; y: number; w: number; h: number; node: { code: string } }[];
          links: readonly { path: string }[];
        };
      }
    ).layout();
    const root = layout.nodes.find((item) => item.node.code === 'ROOT-1')!;
    const child = layout.nodes.find((item) => item.node.code === 'SOL-1')!;
    expect(layout.links).toHaveLength(1);

    const numbers = layout.links[0]!.path.match(/-?\d+(\.\d+)?/g)!.map(Number);
    // path: M cxRoot (yRoot + h) L ... L cxChild yChild
    const [startX, startY] = numbers;
    const [endX, endY] = numbers.slice(-2);
    expect(startX).toBeCloseTo(root.x + root.w / 2, 6);
    expect(startY).toBeCloseTo(root.y + root.h, 6);
    expect(endX).toBeCloseTo(child.x + child.w / 2, 6);
    expect(endY).toBeCloseTo(child.y, 6);
  });

  it('landscape links run from the parent right edge to the child left edge', async () => {
    const nodes = [node('ROOT-1', null, 'Problema raiz'), node('SOL-1', 'ROOT-1', 'Solução um')];
    fixture.componentRef.setInput('nodes', nodes);
    fixture.componentRef.setInput('layoutMode', 'landscape');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const layout = (
      component as unknown as {
        layout: () => {
          nodes: readonly { x: number; y: number; w: number; h: number; node: { code: string } }[];
          links: readonly { path: string }[];
        };
      }
    ).layout();
    const root = layout.nodes.find((item) => item.node.code === 'ROOT-1')!;
    const child = layout.nodes.find((item) => item.node.code === 'SOL-1')!;
    expect(layout.links).toHaveLength(1);

    const numbers = layout.links[0]!.path.match(/-?\d+(\.\d+)?/g)!.map(Number);
    const [startX, startY] = numbers;
    const [endX, endY] = numbers.slice(-2);
    expect(startX).toBeCloseTo(root.x + root.w, 6);
    expect(startY).toBeCloseTo(root.y + root.h / 2, 6);
    expect(endX).toBeCloseTo(child.x, 6);
    expect(endY).toBeCloseTo(child.y + child.h / 2, 6);
  });

  it('suppresses the click that follows a long drag (no accidental selection)', () => {
    const emitted: string[] = [];
    component.nodeSelected.subscribe((code) => emitted.push(code));

    const card = canvas.querySelector('[data-code="SOL-1"]') as HTMLElement;
    card.dispatchEvent(
      new MouseEvent('pointerdown', { bubbles: true, clientX: 300, clientY: 300, button: 0 }),
    );
    card.dispatchEvent(
      new MouseEvent('pointermove', { bubbles: true, clientX: 500, clientY: 420 }),
    );
    card.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));
    card.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(emitted).toEqual([]);
  });
});
