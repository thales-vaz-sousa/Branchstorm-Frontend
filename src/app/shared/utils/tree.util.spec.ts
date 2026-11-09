import type { LinkResult, LinkStatus } from '@shared/models/link.model';
import {
  buildVisibleTree,
  countDiscardedBySelection,
  findPathToNode,
  findRoot,
} from './tree.util';

function link(
  code: string,
  fatherCode: string | null,
  status: LinkStatus = 'Open',
): LinkResult {
  return {
    code,
    fatherCode,
    type: fatherCode ? 'Solution' : 'Problem',
    title: `Nó ${code}`,
    description: null,
    status,
    validation: 'NotTested',
    autorCode: null,
    teamCode: null,
    reason: null,
    creationDate: '2026-01-01T00:00:00.000Z',
    history: [],
  };
}

describe('buildVisibleTree', () => {
  it('monta a hierarquia a partir da lista plana com raiz única', () => {
    const nodes = [
      link('root', null),
      link('b', 'root'),
      link('a', 'root'),
      link('c', 'b'),
    ];

    const result = buildVisibleTree(nodes, { showDiscarded: true, collapsedCodes: new Set() });

    expect(result.visibleNodes.map((node) => node.code)).toEqual(['root', 'b', 'a', 'c']);
    expect(result.childrenByFather.get('root')?.map((node) => node.code)).toEqual(['b', 'a']);
    expect(result.childCounts.get('root')).toBe(2);
    expect(result.childCounts.get('b')).toBe(1);
    expect(findRoot(nodes, 'root')?.code).toBe('root');
  });

  it('oculta ramos descartados inteiros quando showDiscarded é falso', () => {
    const nodes = [
      link('root', null),
      link('keep', 'root'),
      link('drop', 'root', 'Discarded'),
      link('drop-child', 'drop'),
      link('drop-grandchild', 'drop-child'),
    ];

    const result = buildVisibleTree(nodes, { showDiscarded: false, collapsedCodes: new Set() });

    expect(result.visibleNodes.map((node) => node.code)).toEqual(['root', 'keep']);
    // O total de filhos ignora visibilidade: o cartão mostra o ramo recolhido.
    expect(result.childCounts.get('root')).toBe(2);
    expect(result.childrenByFather.get('root')?.map((node) => node.code)).toEqual(['keep']);
  });

  it('mantém descartados visíveis quando showDiscarded é verdadeiro', () => {
    const nodes = [
      link('root', null),
      link('drop', 'root', 'Discarded'),
      link('drop-child', 'drop'),
    ];

    const result = buildVisibleTree(nodes, { showDiscarded: true, collapsedCodes: new Set() });

    expect(result.visibleNodes.map((node) => node.code)).toEqual(['root', 'drop', 'drop-child']);
  });

  it('recolher um pai oculta os descendentes, mas preserva a contagem', () => {
    const nodes = [
      link('root', null),
      link('parent', 'root'),
      link('child', 'parent'),
      link('grandchild', 'child'),
    ];

    const result = buildVisibleTree(nodes, {
      showDiscarded: true,
      collapsedCodes: new Set(['parent']),
    });

    expect(result.visibleNodes.map((node) => node.code)).toEqual(['root', 'parent']);
    expect(result.childCounts.get('parent')).toBe(1);
    expect(result.childCounts.get('child')).toBe(1);
  });

  it('retorna o caminho da raiz até o nó', () => {
    const nodes = [link('root', null), link('parent', 'root'), link('target', 'parent')];

    expect(findPathToNode(nodes, 'target').map((node) => node.code)).toEqual([
      'root',
      'parent',
      'target',
    ]);
    expect(findPathToNode(nodes, 'missing')).toEqual([]);
  });
});

describe('countDiscardedBySelection', () => {
  it('descarta os irmãos e todos os descendentes deles', () => {
    const nodes = [
      link('root', null),
      link('winner', 'root'),
      link('winner-child', 'winner'),
      link('loser', 'root'),
      link('loser-child', 'loser'),
      link('loser-grandchild', 'loser-child'),
    ];

    expect(countDiscardedBySelection(nodes, 'winner')).toBe(3);
  });

  it('preserva nós finais no ramo descartado', () => {
    const nodes = [
      link('root', null),
      link('winner', 'root'),
      link('loser', 'root'),
      link('loser-final', 'loser', 'Final'),
    ];

    expect(countDiscardedBySelection(nodes, 'winner')).toBe(1);
  });

  it('não conta o próprio nó nem seus descendentes', () => {
    const nodes = [
      link('root', null),
      link('winner', 'root'),
      link('winner-child', 'winner'),
      link('only', 'root'),
    ];

    // Selecionar `only` descarta `winner` + descendente; selecionar `winner` descarta `only`.
    expect(countDiscardedBySelection(nodes, 'only')).toBe(2);
    expect(countDiscardedBySelection(nodes, 'winner')).toBe(1);
    expect(countDiscardedBySelection(nodes, 'missing')).toBe(0);
  });
});
