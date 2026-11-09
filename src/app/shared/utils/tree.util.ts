import type { LinkResult } from '@shared/models/link.model';

export interface VisibleTreeResult {
  readonly visibleNodes: readonly LinkResult[];
  readonly childrenByFather: ReadonlyMap<string, readonly LinkResult[]>;
  readonly hiddenCodes: ReadonlySet<string>;
  /** Contagem de filhos de cada nó, incluindo ramos ocultos. */
  readonly childCounts: ReadonlyMap<string, number>;
}

export function buildVisibleTree(
  nodes: readonly LinkResult[],
  options: {
    readonly showDiscarded: boolean;
    readonly collapsedCodes: ReadonlySet<string>;
  },
): VisibleTreeResult {
  const hiddenCodes = new Set<string>();

  if (!options.showDiscarded) {
    for (const node of nodes) {
      if (node.status === 'Discarded') {
        hiddenCodes.add(node.code);
      }
    }
  }

  let changed = true;

  while (changed) {
    changed = false;

    for (const node of nodes) {
      if (hiddenCodes.has(node.code)) {
        continue;
      }

      if (
        (node.fatherCode && hiddenCodes.has(node.fatherCode)) ||
        (node.fatherCode && options.collapsedCodes.has(node.fatherCode))
      ) {
        hiddenCodes.add(node.code);
        changed = true;
      }
    }
  }

  const visibleNodes = nodes.filter((node) => !hiddenCodes.has(node.code));
  const childrenByFather = new Map<string, LinkResult[]>();
  const childCounts = new Map<string, number>();

  for (const node of nodes) {
    if (!node.fatherCode) {
      continue;
    }

    childCounts.set(node.fatherCode, (childCounts.get(node.fatherCode) ?? 0) + 1);

    if (hiddenCodes.has(node.code)) {
      continue;
    }

    const children = childrenByFather.get(node.fatherCode);

    if (children) {
      children.push(node);
    } else {
      childrenByFather.set(node.fatherCode, [node]);
    }
  }

  for (const children of childrenByFather.values()) {
    children.sort(compareNodes);
  }

  return { visibleNodes, childrenByFather, hiddenCodes, childCounts };
}

export function childrenOf(
  nodes: readonly LinkResult[],
  fatherCode: string,
): readonly LinkResult[] {
  return nodes.filter((node) => node.fatherCode === fatherCode);
}

export function siblingsOf(
  nodes: readonly LinkResult[],
  target: LinkResult,
): readonly LinkResult[] {
  if (!target.fatherCode) {
    return [];
  }

  return nodes.filter(
    (node) => node.fatherCode === target.fatherCode && node.code !== target.code,
  );
}

export function descendantsOf(
  nodes: readonly LinkResult[],
  code: string,
): readonly LinkResult[] {
  const byFather = new Map<string, LinkResult[]>();

  for (const node of nodes) {
    if (!node.fatherCode) {
      continue;
    }

    const children = byFather.get(node.fatherCode);

    if (children) {
      children.push(node);
    } else {
      byFather.set(node.fatherCode, [node]);
    }
  }

  const result: LinkResult[] = [];
  const queue = [...(byFather.get(code) ?? [])];

  while (queue.length > 0) {
    const node = queue.shift();

    if (!node) {
      continue;
    }

    result.push(node);
    queue.push(...(byFather.get(node.code) ?? []));
  }

  return result;
}

/**
 * Quantos nós serão descartados ao selecionar `code`: os irmãos e todos os
 * descendentes deles. Nós finais são preservados.
 */
export function countDiscardedBySelection(
  nodes: readonly LinkResult[],
  code: string,
): number {
  const target = nodes.find((node) => node.code === code);

  if (!target) {
    return 0;
  }

  const discarded = new Set<string>();

  for (const sibling of siblingsOf(nodes, target)) {
    if (sibling.status === 'Final') {
      continue;
    }

    discarded.add(sibling.code);

    for (const descendant of descendantsOf(nodes, sibling.code)) {
      if (descendant.status !== 'Final') {
        discarded.add(descendant.code);
      }
    }
  }

  return discarded.size;
}

function compareNodes(left: LinkResult, right: LinkResult): number {
  const statusWeight: Record<LinkResult['status'], number> = {
    Selected: 0,
    Final: 1,
    Open: 2,
    Discarded: 3,
  };

  const statusDifference = statusWeight[left.status] - statusWeight[right.status];

  if (statusDifference !== 0) {
    return statusDifference;
  }

  return left.creationDate.localeCompare(right.creationDate);
}

export function findRoot(nodes: readonly LinkResult[], rootCode: string): LinkResult | null {
  return (
    nodes.find((node) => node.code === rootCode) ??
    nodes.find((node) => !node.fatherCode) ??
    null
  );
}

export function findPathToNode(
  nodes: readonly LinkResult[],
  targetCode: string,
): readonly LinkResult[] {
  const byCode = new Map(nodes.map((node) => [node.code, node]));
  const path: LinkResult[] = [];
  let current = byCode.get(targetCode);

  while (current) {
    path.unshift(current);

    if (!current.fatherCode) {
      break;
    }

    current = byCode.get(current.fatherCode);
  }

  return path;
}
