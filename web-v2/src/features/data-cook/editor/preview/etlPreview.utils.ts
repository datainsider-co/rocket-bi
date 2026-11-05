import type { EtlPreview } from '@/core/data-cook/EtlPreviewService';
import { etlOperatorToJson, OPERATOR_TITLES, operatorParents, type EtlOperator } from '@/core/data-cook/EtlOperator';
import type { EtlGraph } from '@/core/data-cook/etlGraph';
import type { JsonObject } from '@/core/json/json';
import type { TableSchema } from '@/core/schema/SchemaService';

/**
 * Preview (v1 `ManageEtlOperator.previewOperator`): `preview_sync` builds each table of the ETL as a view in
 * `preview_etl_<id>`. The server reuses a view by its name unless `force` is set, so an edited operator must be built
 * with `force` (DC6b). A table's preview is cached under its branch's signature: editing an operator changes the
 * signature of its table and of every table after it, and only those are built again.
 */

/** What the preview of one table came to. */
export type TablePreviewResult =
  | { readonly kind: 'ready'; readonly table: TableSchema }
  | { readonly kind: 'error'; readonly message: string };

/** Where a table's preview is at, on its box and its tab. */
export type TablePreviewStatus = 'loading' | 'ready' | 'error' | 'blocked';

/** v2 builds no preview of these: the server can't (Python, DC0) or v2 doesn't know the operator. */
const NOT_PREVIEWED: ReadonlySet<EtlOperator['kind']> = new Set(['python', 'unsupported', 'sendEmail']);

/** The tables of the ETL, in graph order: every operator but Send To Email, which writes no table. */
export function previewTableNames(graph: EtlGraph): string[] {
  return [...graph.operators].filter(([, operator]) => operator.kind !== 'sendEmail').map(([name]) => name);
}

/** Why `name` has no preview, if it has none: it is, or reads from, an operator v2 doesn't preview. */
export function previewBlocker(graph: EtlGraph, name: string): string | undefined {
  const blocked = (current: string, path: ReadonlySet<string>): EtlOperator | undefined => {
    const operator = graph.operators.get(current);
    if (!operator || path.has(current)) return undefined;
    if (NOT_PREVIEWED.has(operator.kind)) return operator;
    const next = new Set(path).add(current);
    for (const parent of graph.parentNames.get(current) ?? []) {
      const found = blocked(parent, next);
      if (found) return found;
    }
    return undefined;
  };
  const operator = blocked(name, new Set());
  if (!operator) return undefined;
  const title = OPERATOR_TITLES[operator.kind];
  return operator.destTable.tblName === name
    ? `${title} can't be previewed`
    : `It reads from ${operator.destTable.tblDisplayName || operator.destTable.tblName} (${title}), which can't be previewed`;
}

/** Keys that don't change what a table holds: where it is saved, its display names, the operators it reads. */
const NOT_BUILT_FROM = ['operator', 'operators', 'is_persistent', 'persist_configuration', 'third_party_persist_configurations'];

/** What an operator builds its table from, without its parents: those have their own signature. */
export function ownSettings(operator: EtlOperator): JsonObject {
  const json: JsonObject = { ...etlOperatorToJson(operator) };
  for (const key of NOT_BUILT_FROM) delete json[key];
  delete json['dest_table_config'];
  delete json['dest_table_configuration'];
  if (Array.isArray(json['join_configs'])) {
    json['join_configs'] = json['join_configs'].map(config => {
      const { left_operator: _left, right_operator: _right, ...rest } = config as JsonObject;
      return rest;
    });
  }
  return { ...json, tbl_name: operator.destTable.tblName };
}

/** A short hash of `text` (cyrb53), to keep query keys small: a source's table schema is long. */
export function hashText(text: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    h1 = Math.imul(h1 ^ code, 2654435761);
    h2 = Math.imul(h2 ^ code, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

/** JSON with every object's keys sorted: an operator read from the server and one built here differ only in order. */
export function stableJson(value: unknown): string {
  const sorted = (item: unknown): unknown => {
    if (Array.isArray(item)) return item.map(sorted);
    if (item === null || typeof item !== 'object') return item;
    return Object.fromEntries(
      Object.keys(item)
        .toSorted()
        .map(key => [key, sorted((item as Record<string, unknown>)[key])])
    );
  };
  return JSON.stringify(sorted(value)) ?? '';
}

/**
 * Each table's signature: its operator's settings and its parents' signatures. It changes with the operator and with
 * anything before it, not with a rename or a destination.
 */
export function previewSignatures(graph: EtlGraph): Map<string, string> {
  const signatures = new Map<string, string>();
  const sign = (name: string, path: ReadonlySet<string>): string => {
    const done = signatures.get(name);
    if (done !== undefined) return done;
    const operator = graph.operators.get(name);
    if (!operator || path.has(name)) return '';
    const next = new Set(path).add(name);
    const parents = (graph.parentNames.get(name) ?? []).map(parent => sign(parent, next));
    const signature = hashText(stableJson([ownSettings(operator), parents]));
    signatures.set(name, signature);
    return signature;
  };
  for (const name of graph.operators.keys()) sign(name, new Set());
  return signatures;
}

/** The operators of a tree by table name: the table itself and everything it reads from. */
export function treeOperators(tree: EtlOperator): Map<string, EtlOperator> {
  const found = new Map<string, EtlOperator>();
  const visit = (operator: EtlOperator) => {
    if (found.has(operator.destTable.tblName)) return;
    found.set(operator.destTable.tblName, operator);
    operatorParents(operator).forEach(visit);
  };
  visit(tree);
  return found;
}

/** The trees to send for `trees`: one that another already holds is built with it. */
export function previewRoots(trees: readonly EtlOperator[]): EtlOperator[] {
  const unique = [...new Map(trees.map(tree => [tree.destTable.tblName, tree])).values()];
  const contents = unique.map(treeOperators);
  return unique.filter((tree, index) =>
    contents.every((content, other) => other === index || !content.has(tree.destTable.tblName))
  );
}

/** v1's message on a table after a failed one, without its HTML. */
export function previousErrorText(failed: EtlOperator): string {
  const name = failed.destTable.tblDisplayName || failed.destTable.tblName;
  return `Cannot preview: there are errors at a previous step, ${OPERATOR_TITLES[failed.kind]} of ${name}`;
}

/**
 * The preview of the table `tree` writes, from what the server built. The server stops a branch at its first error and
 * builds the others, so a missing table reads from a failed one.
 */
export function tableResult(tree: EtlOperator, preview: EtlPreview): TablePreviewResult {
  const name = tree.destTable.tblName;
  const table = preview.tables.find(item => item.name === name);
  if (table) return { kind: 'ready', table };
  const error = preview.errors.find(item => item.tblName === name);
  if (error) return { kind: 'error', message: error.message || 'Preview failed' };
  const operators = treeOperators(tree);
  const failed = preview.errors.map(item => operators.get(item.tblName)).find(operator => operator !== undefined);
  return { kind: 'error', message: failed ? previousErrorText(failed) : 'The table was not built' };
}

/** v1 `getPreviewTableLabel`: a source with its database, another table by its name. */
export function previewTabLabel(operator: EtlOperator): string {
  const table = operator.destTable.tblDisplayName || operator.destTable.tblName;
  return operator.kind === 'getData' ? `${operator.destTable.dbDisplayName}.${table}` : table;
}

/** The table shown below the canvas: the one picked while it exists, else the first (v1 selected the first). */
export function shownTable(names: readonly string[], picked: string | undefined): string | undefined {
  return picked !== undefined && names.includes(picked) ? picked : names[0];
}

/** A tab below the canvas. */
export interface PreviewTab {
  readonly tblName: string;
  readonly label: string;
  readonly status: TablePreviewStatus;
}

/** A tab per table with a preview, in the order of `statuses` (v1 left out Send To Email). */
export function previewTabs(graph: EtlGraph, statuses: ReadonlyMap<string, { readonly status: TablePreviewStatus }>): PreviewTab[] {
  return [...statuses].flatMap(([tblName, { status }]) => {
    const operator = graph.operators.get(tblName);
    return operator ? [{ tblName, label: previewTabLabel(operator), status }] : [];
  });
}

/**
 * After a save, each table's signature then and now, where they differ: the server writes a Transform's or Pivot's
 * query its own way (`aggregate_conditions`, `is_flatten`, ... added, DC8), yet the tables are the ones just built.
 */
export function signatureChanges(before: EtlGraph, after: EtlGraph): { tblName: string; from: string; to: string }[] {
  const from = previewSignatures(before);
  const to = previewSignatures(after);
  return [...to].flatMap(([tblName, signature]) => {
    const previous = from.get(tblName);
    return previous !== undefined && previous !== signature ? [{ tblName, from: previous, to: signature }] : [];
  });
}
