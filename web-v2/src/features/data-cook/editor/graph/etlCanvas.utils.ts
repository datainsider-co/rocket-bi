import { MarkerType, type Edge, type Node } from '@xyflow/react';
import { JoinType, OPERATOR_TITLES, type EtlOperator } from '@/core/data-cook/EtlOperator';
import type { EtlGraph } from '@/core/data-cook/etlGraph';
import { readPosition, type Point } from '@/core/data-cook/etlExtraData';
import { asString, type JsonObject } from '@/core/json/json';
import type { TablePreviewStatus } from '../preview/etlPreview.utils';
import { boxPoint, MIN_TOP } from './etlLayout.utils';
import { nodeId, positionTarget, type EtlNodeRef } from './etlNodeRef';
import { boxMenu, operatorMenu, tableMenu, type EtlMenuItem } from './etlMenu.utils';

export const ETL_NODE_TYPES = { table: 'etlTable', operator: 'etlOperator', box: 'etlBox' } as const;

export interface EtlNodeData extends Record<string, unknown> {
  readonly ref: EtlNodeRef;
  /** Table: the database; operator: its name; box: the database or "Email subject". */
  readonly title: string;
  /** Table and box: the table (or the email's subject). */
  readonly subtitle: string;
  readonly menu: readonly EtlMenuItem[];
  /** Picked a menu item. */
  readonly onMenu: (ref: EtlNodeRef, key: string) => void;
  /** A table's preview (`withPreview`). */
  readonly preview?: NodePreview;
}

/** How a table's box shows its preview: loading, failed, shown below the canvas. */
export interface NodePreview {
  readonly status: TablePreviewStatus;
  readonly message: string | undefined;
  readonly shown: boolean;
}

export type EtlNode = Node<EtlNodeData>;
export type EtlEdge = Edge;

const NO_NAME = '<<noname>>';

/** v1 `JOIN_TYPE_NAME`, a join's shape label. */
const JOIN_TITLES: Readonly<Record<JoinType, string>> = {
  [JoinType.Left]: 'Left join',
  [JoinType.Right]: 'Right join',
  [JoinType.Inner]: 'Inner join',
  [JoinType.FullOuter]: 'Full join'
};

/** The shape's label: a join's type (v1 `OperatorType.operatorName`), else the operator's name. */
export function operatorLabel(operator: EtlOperator): string {
  if (operator.kind === 'join') return JOIN_TITLES[operator.joins[0]?.joinType ?? JoinType.Left];
  return OPERATOR_TITLES[operator.kind];
}

function savedPoint(extraData: JsonObject, ref: EtlNodeRef, fallback: Point): Point {
  const { group, key } = positionTarget(ref);
  return readPosition(extraData, group, key) ?? fallback;
}

/**
 * The boxes of the canvas (v1 `ManageEtlOperator.vue`): each operator's table, the shape of an operator reading other
 * tables, and the boxes it saves or sends to. Positions come from `extra_data` (`layoutEtl` gave tables and shapes one);
 * a destination box without one goes next to its table, as in v1.
 */
export function toEtlNodes(graph: EtlGraph, extraData: JsonObject, onMenu: EtlNodeData['onMenu']): EtlNode[] {
  const nodes: EtlNode[] = [];
  const add = (type: string, ref: EtlNodeRef, position: Point, data: Pick<EtlNodeData, 'title' | 'subtitle' | 'menu'>) =>
    nodes.push({ id: nodeId(ref), type, position, data: { ...data, ref, onMenu } });

  for (const [tblName, operator] of graph.operators) {
    const table = savedPoint(extraData, { type: 'table', tblName }, { x: MIN_TOP, y: MIN_TOP });
    if (operator.kind === 'sendEmail') {
      const ref = { type: 'email', tblName } as const;
      add(ETL_NODE_TYPES.box, ref, savedPoint(extraData, ref, boxPoint(table)), {
        title: 'Email subject',
        subtitle: operator.subject || '<<no subject>>',
        menu: boxMenu('email')
      });
      continue;
    }

    const isSource = (graph.parentNames.get(tblName) ?? []).length === 0;
    add(ETL_NODE_TYPES.table, { type: 'table', tblName }, table, {
      title: operator.destTable.dbDisplayName || NO_NAME,
      subtitle: operator.destTable.tblDisplayName || tblName || NO_NAME,
      menu: tableMenu(isSource)
    });
    if (!isSource) {
      const ref = { type: 'operator', tblName } as const;
      add(ETL_NODE_TYPES.operator, ref, savedPoint(extraData, ref, table), { title: operatorLabel(operator), subtitle: '', menu: operatorMenu(operator.kind) });
    }

    let boxes = 0;
    if (operator.persist) {
      const ref = { type: 'persist', tblName } as const;
      add(ETL_NODE_TYPES.box, ref, savedPoint(extraData, ref, boxPoint(table, boxes)), {
        title: operator.persist.dbName || NO_NAME,
        subtitle: operator.persist.tblName || NO_NAME,
        menu: boxMenu('persist')
      });
      boxes += 1;
    }
    operator.thirdPartyPersists.forEach((config, index) => {
      const ref = { type: 'thirdParty', tblName, index } as const;
      add(ETL_NODE_TYPES.box, ref, savedPoint(extraData, ref, boxPoint(table, boxes + index)), {
        title: asString(config['database_name']) || NO_NAME,
        subtitle: asString(config['table_name']) || NO_NAME,
        menu: boxMenu('thirdParty')
      });
    });
  }
  return nodes;
}

function edge(source: EtlNodeRef, target: EtlNodeRef, suffix = ''): EtlEdge {
  const id = `${nodeId(source)}->${nodeId(target)}${suffix}`;
  return { id, source: nodeId(source), target: nodeId(target), type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } };
}

/** v1's arrows: each parent table to the shape, the shape to its table, a table to its boxes, parents to an email box. */
export function toEtlEdges(graph: EtlGraph): EtlEdge[] {
  const edges: EtlEdge[] = [];
  for (const [tblName, operator] of graph.operators) {
    const table = { type: 'table', tblName } as const;
    const parents = (graph.parentNames.get(tblName) ?? []).filter(parent => graph.operators.has(parent));
    // A join may read one table twice; the index keeps the two arrows apart.
    const into = operator.kind === 'sendEmail' ? ({ type: 'email', tblName } as const) : ({ type: 'operator', tblName } as const);
    parents.forEach((parent, index) => edges.push(edge({ type: 'table', tblName: parent }, into, `#${index}`)));
    if (operator.kind === 'sendEmail') continue;
    if (parents.length > 0) edges.push(edge(into, table));
    if (operator.persist) edges.push(edge(table, { type: 'persist', tblName }));
    operator.thirdPartyPersists.forEach((_, index) => edges.push(edge(table, { type: 'thirdParty', tblName, index })));
  }
  return edges;
}

/**
 * `next` with what React Flow measured on the nodes of `current` (same id), so redrawing after an edit doesn't hide the
 * nodes until they are measured again.
 */
export function keepMeasured(next: readonly EtlNode[], current: readonly EtlNode[]): EtlNode[] {
  const measured = new Map(current.map(node => [node.id, node.measured]));
  return next.map(node => {
    const size = measured.get(node.id);
    return size ? { ...node, measured: size } : node;
  });
}

/** The tables' boxes with their previews; the other boxes stay as they are. */
export function withPreview(
  nodes: readonly EtlNode[],
  previews: ReadonlyMap<string, Pick<NodePreview, 'status' | 'message'>>,
  shown: string | undefined
): EtlNode[] {
  return nodes.map(node => {
    const { ref } = node.data;
    const preview = ref.type === 'table' ? previews.get(ref.tblName) : undefined;
    if (!preview) return node;
    return { ...node, data: { ...node.data, preview: { status: preview.status, message: preview.message, shown: ref.tblName === shown } } };
  });
}

/** v1 drew the arrows out of a failed table in red. */
export function withEdgeErrors(edges: readonly EtlEdge[], previews: ReadonlyMap<string, Pick<NodePreview, 'status'>>): EtlEdge[] {
  const failed = new Set([...previews].filter(([, preview]) => preview.status === 'error').map(([tblName]) => nodeId({ type: 'table', tblName })));
  return edges.map(item => (failed.has(item.source) ? { ...item, className: 'etl-edge--error' } : item));
}
