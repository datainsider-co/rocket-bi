import { asString, isRecord, type JsonObject } from '@/core/json/json';
import { chartIconOf, CONTROL_ICON } from '@/core/chart-builder/chartCatalogue';
import { ChartInfoType, type ChartControl } from '@/core/chart-builder/chartControls';
import { TableType, type DatabaseInfo, type SchemaColumn, type TableSchema } from '@/core/schema/SchemaService';
import type { DroppedField } from '../state/builderState.utils';

/** A plain column, a measure (aggregated by its expression) or a calculated column. */
export type FieldRole = 'column' | 'measure' | 'calculated';

export interface FieldNode {
  readonly kind: 'field';
  /** Unique in the tree; also the draggable's id. */
  readonly key: string;
  readonly title: string;
  readonly type: string;
  readonly role: FieldRole;
  readonly dropped: DroppedField;
}

/** A nested column: its own columns, read with `get_array_element`. */
export interface NestedNode {
  readonly kind: 'nested';
  readonly key: string;
  readonly title: string;
  readonly fields: readonly FieldNode[];
}

export type TableItem = FieldNode | NestedNode;

export interface TableNode {
  /** The table's name, unique in a database. */
  readonly key: string;
  readonly title: string;
  readonly items: readonly TableItem[];
}

/** The database dropdown; none for an ad hoc chart. */
export interface DatabaseSelect {
  readonly options: readonly DatabaseInfo[];
  readonly value?: string;
  readonly onChange: (dbName: string) => void;
}

export interface TreeTables {
  readonly nodes: readonly TableNode[];
  readonly expanded: ReadonlySet<string>;
  readonly onToggle: (key: string) => void;
  readonly status: 'loading' | 'error' | 'ready';
  readonly error: string;
}

/** What a tree row hands to the drop zones. */
export type FieldTreePayload = { readonly kind: 'column'; readonly field: DroppedField } | { readonly kind: 'control'; readonly control: ChartControl };

const titleOf = (item: { displayName?: string; name: string }) => item.displayName || item.name;
const byTitle = <T extends { title: string }>(a: T, b: T) => a.title.localeCompare(b.title);

/**
 * A column as a query refers to it (v1 `Field.new`): a `view_field` named by its view on an ad hoc table (no
 * database), else a `table_field`.
 */
function columnField(table: TableSchema, fieldName: string, type: string): JsonObject {
  return table.dbName === ''
    ? { class_name: 'view_field', view_name: table.name, field_name: fieldName, field_type: type }
    : { class_name: 'table_field', db_name: table.dbName, tbl_name: table.name, field_name: fieldName, field_type: type };
}

function expressionField(className: string, table: TableSchema, column: SchemaColumn): JsonObject {
  return {
    class_name: className,
    db_name: table.dbName,
    tbl_name: table.name,
    field_name: column.name,
    field_type: column.type,
    expression: column.expression ?? ''
  };
}

function fieldNode(table: TableSchema, column: SchemaColumn, role: FieldRole, field: JsonObject, isNested = false): FieldNode {
  return {
    kind: 'field',
    key: `${table.name}:${role}:${asString(field['field_name'])}`,
    title: column.displayName,
    type: column.type,
    role,
    dropped: { field, columnName: column.displayName, tableName: titleOf(table), isNested }
  };
}

function columnItem(table: TableSchema, column: SchemaColumn): TableItem {
  if (!column.nestedColumns) return fieldNode(table, column, 'column', columnField(table, column.name, column.type));
  return {
    kind: 'nested',
    key: `${table.name}:nested:${column.name}`,
    title: column.displayName,
    fields: column.nestedColumns.map(inner => fieldNode(table, inner, 'column', columnField(table, `\`${column.name}.${inner.name}\``, inner.type), true))
  };
}

/**
 * The tables of a database as tree nodes (v1 `SchemaUtils.toTableSchemaNodes`): tables and columns by title, then the
 * table's measures and calculated columns.
 */
export function tableNodesOf(tables: readonly TableSchema[]): TableNode[] {
  return tables
    .map(table => ({
      key: table.name,
      title: titleOf(table),
      items: [
        ...table.columns.map(column => columnItem(table, column)).sort(byTitle),
        ...(table.expressionColumns ?? []).map(column => fieldNode(table, column, 'measure', expressionField('expression_field', table, column))),
        ...(table.calculatedColumns ?? []).map(column => fieldNode(table, column, 'calculated', expressionField('calculated_field', table, column)))
      ]
    }))
    .sort(byTitle);
}

const includes = (keyword: string, text: string) => text.trim().toLocaleLowerCase().includes(keyword);

/** Search shows this many tables at most (v1 `searchTablesAndColumns`). */
export const MAX_SEARCH_TABLES = 20;

/**
 * The tables and columns matching `keyword` (v1 `BuilderTableSchemaStore.searchTablesAndColumns`): a table whose
 * title matches keeps all its columns, another keeps the matching ones, and tables without any are left out.
 */
export function searchTableNodes(nodes: readonly TableNode[], keyword: string): readonly TableNode[] {
  const word = keyword.trim().toLocaleLowerCase();
  if (word === '') return nodes;
  return nodes
    .flatMap(node => {
      if (includes(word, node.title)) return [node];
      const items = node.items.filter(item => includes(word, item.title));
      return items.length > 0 ? [{ ...node, items }] : [];
    })
    .slice(0, MAX_SEARCH_TABLES);
}

/** Where v1's chart icons are served from (`public/chart-builder/charts`). */
export const CHART_ICON_PATH = '/chart-builder/charts/';

/** A control's icon: its chart type's, or the generic one for a function controller (v1 `getControlIconSrc`). */
export function controlIconOf(control: ChartControl): string {
  return CHART_ICON_PATH + (control.infoType === ChartInfoType.FunctionController ? CONTROL_ICON : chartIconOf(control.chartType));
}

/** The chart controls whose title matches `keyword` (v1 `filterChartControls`). */
export function searchControls(controls: readonly ChartControl[], keyword: string): readonly ChartControl[] {
  const word = keyword.trim().toLocaleLowerCase();
  return word === '' ? controls : controls.filter(control => includes(word, control.title));
}

const FIELD_CLASSES = new Set(['table_field', 'expression_field', 'calculated_field']);

export interface FieldRef {
  readonly dbName: string;
  readonly tblName: string;
}

/** Every database field a chart setting uses, wherever it keeps them (v1 `WidgetUtils.getFields`). */
export function fieldRefsOf(setting: unknown): FieldRef[] {
  if (Array.isArray(setting)) return setting.flatMap(fieldRefsOf);
  if (!isRecord(setting)) return [];
  const own = FIELD_CLASSES.has(asString(setting['class_name'])) ? [{ dbName: asString(setting['db_name']), tblName: asString(setting['tbl_name']) }] : [];
  return [...own, ...Object.values(setting).flatMap(fieldRefsOf)];
}

/** The database the fields use most (v1 `WidgetUtils.getMainDatabase`); the first one seen wins a tie. */
export function mainDatabaseOf(refs: readonly FieldRef[]): string | undefined {
  const counts = new Map<string, number>();
  for (const { dbName } of refs) if (dbName !== '') counts.set(dbName, (counts.get(dbName) ?? 0) + 1);
  let main: string | undefined;
  for (const [dbName, count] of counts) if (main === undefined || count > (counts.get(main) ?? 0)) main = dbName;
  return main;
}

/** The tables the fields use in `dbName` (v1 `WidgetUtils.getMainTables`). */
export function tablesIn(refs: readonly FieldRef[], dbName: string): string[] {
  return [...new Set(refs.filter(ref => ref.dbName === dbName).map(ref => ref.tblName))];
}

/** The tables open at first: those in use, else the first one (v1 `expandTables`, `expandFirstTable`). */
export function initialExpanded(nodes: readonly TableNode[], usedTables: readonly string[]): ReadonlySet<string> {
  const used = nodes.filter(node => usedTables.includes(node.key)).map(node => node.key);
  const first = nodes[0]?.key;
  return new Set(used.length > 0 ? used : first === undefined ? [] : [first]);
}

/** Opens a closed table and closes an open one. */
export function toggled(expanded: ReadonlySet<string>, key: string): ReadonlySet<string> {
  const next = new Set(expanded);
  if (!next.delete(key)) next.add(key);
  return next;
}

/** The SQL of an ad hoc view by its name, for the chart's `sql_views` (v1 `BuilderTableSchemaStore.getSqlQuery`). */
export function viewQueryOf(tables: readonly TableSchema[], viewName: string): string | undefined {
  return tables.find(table => table.tableType === TableType.View && table.dbName === '' && table.name === viewName)?.query;
}
