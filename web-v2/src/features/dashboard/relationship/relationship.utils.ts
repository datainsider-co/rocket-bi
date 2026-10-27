import camelCase from 'lodash-es/camelCase';
import { TableField, ViewField, type Field } from '@/core/relationship/Field';
import { QueryViewType, type QueryView } from '@/core/relationship/QueryView';
import { FieldPair, Relationship } from '@/core/relationship/Relationship';
import { RelationshipInfo, type TablePosition, type TablePositions } from '@/core/relationship/RelationshipInfo';

/** Database name v1 shows SQL views under. */
export const ADHOC_DB_NAME = 'adhoc_analysis';
/** Horizontal step between tables that have no saved position (v1). */
export const DEFAULT_TABLE_GAP = 200;

export interface RelationshipColumn {
  readonly name: string;
  /** Column type, the backend's `class_name` (`string`, `int64`, `datetime`, ...). */
  readonly type: string;
}

/** A view drawn as a table: its schema and how to save it back. */
export interface RelationshipTable {
  readonly id: string;
  readonly dbName: string;
  readonly tblName: string;
  readonly view: QueryView;
  readonly columns: readonly RelationshipColumn[];
}

export interface ColumnRef {
  readonly tableId: string;
  readonly column: string;
}

/** A joined pair of columns. `source` is the column the user dragged from, or the first field when loaded. */
export interface Connection {
  readonly key: string;
  readonly source: ColumnRef;
  readonly target: ColumnRef;
}

/** Connections by `key`, in the order they were made. */
export type Connections = Readonly<Record<string, Connection>>;

export interface Point {
  readonly x: number;
  readonly y: number;
}

/** Node positions by table id. */
export type NodePositions = Readonly<Record<string, Point>>;

/** Columns of each table by table id, as the schema reports them. */
export type TableColumns = Readonly<Record<string, readonly RelationshipColumn[]>>;

export interface EditorState {
  readonly tables: readonly RelationshipTable[];
  readonly connections: Connections;
}

/** The database and table name a view is shown with: SQL views show under `adhoc_analysis` with their alias. */
export function tableNameOf(view: QueryView): { dbName: string; tblName: string } {
  return view.className === QueryViewType.Table
    ? { dbName: view.dbName, tblName: view.tblName }
    : { dbName: ADHOC_DB_NAME, tblName: view.aliasName };
}

/** Unique for any pair of names, unlike joining them with a separator. */
export function tableIdOf(dbName: string, tblName: string): string {
  return JSON.stringify([dbName, tblName]);
}

export function viewTableId(view: QueryView): string {
  const { dbName, tblName } = tableNameOf(view);
  return tableIdOf(dbName, tblName);
}

/**
 * Key of a table in `extra_data.table_positions`: lodash `camelCase(dbName + tblName)`, as v1 wrote it (v1's HTTP
 * client camelCased map keys on read, so the stored keys are camelCase). Kept so positions saved by v1 still load.
 */
export function tablePositionKey(dbName: string, tblName: string): string {
  return camelCase(dbName + tblName);
}

function columnId(ref: ColumnRef): string {
  return JSON.stringify([ref.tableId, ref.column]);
}

/** The same for both directions: the two column ids, sorted. */
export function connectionKey(a: ColumnRef, b: ColumnRef): string {
  return [columnId(a), columnId(b)].sort().join('|');
}

export function makeConnection(source: ColumnRef, target: ColumnRef): Connection {
  return { key: connectionKey(source, target), source, target };
}

/** Where a table without a saved position goes: a row along the top, like v1. */
export function defaultTablePosition(index: number): TablePosition {
  return { left: index * DEFAULT_TABLE_GAP, top: 0 };
}

function fieldColumn(field: Field | undefined): RelationshipColumn | undefined {
  return field ? { name: field.fieldName, type: field.fieldType } : undefined;
}

function withColumn(table: RelationshipTable, column: RelationshipColumn | undefined): RelationshipTable {
  if (!column || table.columns.some(existing => existing.name === column.name)) return table;
  return { ...table, columns: [...table.columns, column] };
}

/**
 * Tables and connections to draw from what the server returned. A view listed twice is drawn once (v1). A joined
 * column the schema no longer reports is still drawn, with the field's type, so the join stays visible and is
 * saved back unless removed.
 */
export function toEditorState(info: RelationshipInfo, columnsByTable: TableColumns): EditorState {
  const tables = new Map<string, RelationshipTable>();
  for (const view of info.views) {
    const id = viewTableId(view);
    if (!tables.has(id)) {
      tables.set(id, { id, ...tableNameOf(view), view, columns: columnsByTable[id] ?? [] });
    }
  }

  const connections: Record<string, Connection> = {};
  for (const relationship of info.relationships) {
    if (!relationship.firstView || !relationship.secondView) continue;
    const firstId = viewTableId(relationship.firstView);
    const secondId = viewTableId(relationship.secondView);
    const first = tables.get(firstId);
    const second = tables.get(secondId);
    if (!first || !second || firstId === secondId) continue;

    for (const pair of relationship.fieldPairs) {
      if (!pair.firstField || !pair.secondField) continue;
      tables.set(firstId, withColumn(tables.get(firstId) ?? first, fieldColumn(pair.firstField)));
      tables.set(secondId, withColumn(tables.get(secondId) ?? second, fieldColumn(pair.secondField)));
      const connection = makeConnection(
        { tableId: firstId, column: pair.firstField.fieldName },
        { tableId: secondId, column: pair.secondField.fieldName }
      );
      connections[connection.key] ??= connection;
    }
  }
  return { tables: [...tables.values()], connections };
}

/** Saved position of each table, or its default by index. */
export function toNodePositions(tables: readonly RelationshipTable[], saved: TablePositions): NodePositions {
  return Object.fromEntries(
    tables.map((table, index) => {
      const position = saved[tablePositionKey(table.dbName, table.tblName)] ?? defaultTablePosition(index);
      return [table.id, { x: position.left, y: position.top }];
    })
  );
}

function sameKeys(a: Connections, b: Connections): boolean {
  const aKeys = Object.keys(a);
  return aKeys.length === Object.keys(b).length && aKeys.every(key => key in b);
}

function samePositions(a: NodePositions, b: NodePositions): boolean {
  const aKeys = Object.keys(a);
  return (
    aKeys.length === Object.keys(b).length &&
    aKeys.every(key => a[key]?.x === b[key]?.x && a[key]?.y === b[key]?.y)
  );
}

/** Whether connections or table positions differ from what was loaded. */
export function isDirty(
  initial: { connections: Connections; positions: NodePositions },
  current: { connections: Connections; positions: NodePositions }
): boolean {
  return !sameKeys(initial.connections, current.connections) || !samePositions(initial.positions, current.positions);
}

function fieldOf(table: RelationshipTable, columnName: string): Field {
  const type = table.columns.find(column => column.name === columnName)?.type ?? '';
  const view = table.view;
  return view.className === QueryViewType.Table
    ? new TableField({ db_name: view.dbName, tbl_name: view.tblName, field_name: columnName, field_type: type })
    : new ViewField({ view_name: view.aliasName, field_name: columnName, field_type: type });
}

function pairKey(a: string, b: string): string {
  return JSON.stringify([a, b].sort());
}

/**
 * One relationship per pair of tables, its field pairs in the order the connections were made. The first
 * connection of a pair decides which table is the first view; later ones are flipped to match (v1).
 */
export function toRelationships(tables: readonly RelationshipTable[], connections: Connections): Relationship[] {
  const tableById = new Map(tables.map(table => [table.id, table]));
  const groups = new Map<string, { first: RelationshipTable; second: RelationshipTable; pairs: FieldPair[] }>();

  for (const connection of Object.values(connections)) {
    const source = tableById.get(connection.source.tableId);
    const target = tableById.get(connection.target.tableId);
    if (!source || !target) continue;

    const key = pairKey(source.id, target.id);
    const group = groups.get(key) ?? { first: source, second: target, pairs: [] };
    const [firstRef, secondRef] =
      group.first.id === source.id ? [connection.source, connection.target] : [connection.target, connection.source];
    group.pairs.push(FieldPair.of(fieldOf(group.first, firstRef.column), fieldOf(group.second, secondRef.column)));
    groups.set(key, group);
  }

  return [...groups.values()].map(({ first, second, pairs }) => Relationship.of(first.view, second.view, pairs));
}

/** Saved positions with the drawn tables' current ones written over them, under v1's keys. */
export function toTablePositions(
  tables: readonly RelationshipTable[],
  positions: NodePositions,
  saved: TablePositions
): TablePositions {
  const result: Record<string, TablePosition> = { ...saved };
  for (const table of tables) {
    const position = positions[table.id];
    if (position) result[tablePositionKey(table.dbName, table.tblName)] = { left: position.x, top: position.y };
  }
  return result;
}

/** What Save sends: the views as loaded, the connections grouped into relationships, and the positions. */
export function toRelationshipInfo(
  loaded: RelationshipInfo,
  tables: readonly RelationshipTable[],
  connections: Connections,
  positions: NodePositions
): RelationshipInfo {
  return RelationshipInfo.of(
    loaded.views,
    toRelationships(tables, connections),
    toTablePositions(tables, positions, loaded.tablePositions)
  );
}
