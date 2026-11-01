import type { ExpressionColumnKind } from '@/core/schema/SchemaEditService';
import type { SchemaColumn, TableSchema } from '@/core/schema/SchemaService';
import { columnActionsOf, columnsOfKind, type ColumnAction } from '@/features/chart-builder/field-actions/fieldActions.utils';
import type { ActionItem } from '@/shared/menu/ActionMenuView';
import type { ColumnRole } from '../../database-tree/databaseTree.utils';

/**
 * Measures and calculated columns on the Schema page (v1 `MeasureFieldManagement`, `CalculatedFieldManagement` and the
 * tree's menus). They are made in the ChartBuilder's formula dialog (CB8).
 */

/** What the menu of a table in the Schema page's tree offers (v1 `DatabaseTreeView.tableActions`). */
export type SchemaTableAction = 'addCalculated' | 'addMeasure' | 'delete';

export const SCHEMA_TABLE_ACTIONS: readonly ActionItem<SchemaTableAction>[] = [
  { key: 'addCalculated', label: 'Add Calculated Field' },
  { key: 'addMeasure', label: 'Add Measure' },
  { key: 'delete', label: 'Delete table', danger: true }
];

/** The formula kind of a tree column; plain columns have none. */
export function kindOfRole(role: ColumnRole): ExpressionColumnKind | undefined {
  if (role === 'measure') return 'measure';
  if (role === 'calculated') return 'calculated';
  return undefined;
}

/** A tree column's menu: Edit and Delete for measures and calculated columns (v1 right click), nothing for others. */
export function treeColumnActionsOf(role: ColumnRole): readonly ActionItem<ColumnAction>[] {
  const kind = kindOfRole(role);
  return kind ? columnActionsOf(kind) : [];
}

/** The measure or calculated column of `table` named `name`. */
export function findFormulaColumn(table: TableSchema, kind: ExpressionColumnKind, name: string): SchemaColumn | undefined {
  return columnsOfKind(table, kind).find(column => column.name === name);
}

/** The tab's button and empty text, by kind (v1 "Add Measure Function", "Add Calculated Field"). */
export function formulaTabTextsOf(kind: ExpressionColumnKind) {
  return kind === 'measure'
    ? { add: 'Add Measure', empty: 'This table has no measures' }
    : { add: 'Add Calculated Field', empty: 'This table has no calculated fields' };
}
