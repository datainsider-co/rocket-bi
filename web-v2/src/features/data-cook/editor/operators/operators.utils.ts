import { ETL_DB_DISPLAY_NAME, OPERATOR_TITLES, type EtlOperator, type TableConfiguration } from '@/core/data-cook/EtlOperator';
import { baseTableName, uniqueTableName, type EtlGraph } from '@/core/data-cook/etlGraph';
import type { TableSchema } from '@/core/schema/SchemaService';
import type { EtlNodeRef } from '../graph/etlNodeRef';

/** The operators v2 adds and edits: its own dialogs (DC7), and ChartBuilder for Transform and Pivot (DC8). */
export type OperatorKind = 'sql' | 'join' | 'manageFields' | 'transform' | 'pivot';

/** The dialog an operator opens: adding one after `parent`, or editing the operator writing `tblName`. */
export type OperatorDialog =
  | { readonly mode: 'add'; readonly kind: OperatorKind; readonly parent: string }
  | { readonly mode: 'edit'; readonly kind: OperatorKind; readonly tblName: string };

/** Menu keys that add an operator (v1 `TableContextMenu`). */
const ADD_KEYS: Readonly<Record<string, OperatorKind>> = { join: 'join', manageFields: 'manageFields', sql: 'sql', transform: 'transform', pivot: 'pivot' };
const KINDS: ReadonlySet<string> = new Set<OperatorKind>(['sql', 'join', 'manageFields', 'transform', 'pivot']);

/** The dialog a menu item opens on a box: a table's operators add one after it, an operator's Edit edits it. */
export function operatorDialogOf(ref: Pick<EtlNodeRef, 'type' | 'tblName'>, key: string, operator: EtlOperator | undefined): OperatorDialog | undefined {
  const kind = ADD_KEYS[key];
  if (ref.type === 'table' && kind) return { mode: 'add', kind, parent: ref.tblName };
  if (ref.type === 'operator' && key === 'edit' && operator && KINDS.has(operator.kind)) {
    return { mode: 'edit', kind: operator.kind as OperatorKind, tblName: ref.tblName };
  }
  return undefined;
}

/** The table `operator` writes as its preview read it, or by name only while it has none: its columns are unknown. */
export function knownTable(previews: ReadonlyMap<string, { readonly table?: TableSchema | undefined }>, operator: EtlOperator, dbName: string): TableSchema {
  const { tblName, tblDisplayName } = operator.destTable;
  return previews.get(tblName)?.table ?? { dbName, name: tblName, displayName: tblDisplayName || tblName, columns: [] };
}

/**
 * The table a new operator writes (v1 `makeDestTableConfig`): named after what it reads, unique in the ETL and among
 * `alsoTaken` (a source added with it).
 */
export function newTableConfig(graph: EtlGraph, parents: readonly EtlOperator[], alsoTaken: readonly string[] = []): TableConfiguration {
  const tblName = uniqueTableName(baseTableName(parents), new Set([...graph.operators.keys(), ...alsoTaken]));
  return { tblName, dbDisplayName: ETL_DB_DISPLAY_NAME, tblDisplayName: tblName };
}

/** Fields shared by every operator v2 makes: not saved anywhere yet, the JSON built from scratch. */
export function newOperatorBase(className: string, destTable: TableConfiguration) {
  return { className, destTable, persist: undefined, thirdPartyPersists: [], json: {} } as const;
}

/** A table's name in the dialogs: its display name, else its name. */
export function tableTitle(table: Pick<TableSchema, 'name' | 'displayName'>): string {
  return table.displayName || table.name;
}

/** v1's title of an operator's dialog, and its OK button. */
export function dialogTexts(dialog: OperatorDialog): { title: string; okText: string } {
  return { title: OPERATOR_TITLES[dialog.kind], okText: dialog.mode === 'add' ? 'Add' : 'Update' };
}

/** v1 "Can not add operator": an operator needs the rows of the table it reads, so its preview must be built. */
export function notPreviewedText(tblDisplayNames: readonly string[]): string {
  return `Preview table ${tblDisplayNames.join(', ')} has error`;
}
