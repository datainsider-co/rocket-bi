import { z } from 'zod';
import type { ExpressionColumn, ExpressionColumnKind } from '@/core/schema/SchemaEditService';
import { TableType, type SchemaColumn, type TableSchema } from '@/core/schema/SchemaService';
import { columnNameOf, toExpression, toFormula } from './formula.utils';

/**
 * What the "..." menu of a table offers (v1 `DatabaseListing.tableActions`). v1's builder lists tables as `Normal`, which
 * has no Delete Table.
 */
export type TableAction = 'addCalculated' | 'addMeasure' | 'updateQuery';

/** What the menu of a measure or calculated column offers. */
export type ColumnAction = 'edit' | 'delete';

export interface ActionItem<T extends string> {
  readonly key: T;
  readonly label: string;
  readonly danger?: boolean;
}

/** Only a view of a database has a query to change (v1 `isViewTable`). */
export function canUpdateByQuery(table: Pick<TableSchema, 'dbName' | 'tableType'>): boolean {
  return table.tableType === TableType.View && table.dbName !== '';
}

export function tableActionsOf(table: Pick<TableSchema, 'dbName' | 'tableType'>): ActionItem<TableAction>[] {
  return [
    { key: 'addCalculated', label: 'Add Calculated Field' },
    { key: 'addMeasure', label: 'Add Measure' },
    ...(canUpdateByQuery(table) ? [{ key: 'updateQuery' as const, label: 'Update Table By Query' }] : [])
  ];
}

const KIND_LABELS: Readonly<Record<ExpressionColumnKind, string>> = { calculated: 'Calculated Field', measure: 'Measure' };

/** The formula dialog's title, button and example. */
export function formulaDialogTextsOf(kind: ExpressionColumnKind, editing: boolean) {
  return {
    title: `${editing ? 'Edit' : 'Create'} ${KIND_LABELS[kind]}`,
    okText: editing ? 'Update' : 'Create',
    placeholder: kind === 'calculated' ? 'e.g. [Unit Price] * [Quantity]' : 'e.g. sum(total_profit) / count(*)'
  };
}

export function columnActionsOf(kind: ExpressionColumnKind): ActionItem<ColumnAction>[] {
  return [
    { key: 'edit', label: `Edit ${KIND_LABELS[kind]}` },
    { key: 'delete', label: `Delete ${KIND_LABELS[kind]}`, danger: true }
  ];
}

/** The measures or calculated columns of a table. */
export function columnsOfKind(table: TableSchema, kind: ExpressionColumnKind): readonly SchemaColumn[] {
  return (kind === 'measure' ? table.expressionColumns : table.calculatedColumns) ?? [];
}

/** Every name in use in the table, lower case: a new column must not reuse one, whatever its kind. */
export function takenNamesOf(table: TableSchema): ReadonlySet<string> {
  const columns = [...table.columns, ...(table.expressionColumns ?? []), ...(table.calculatedColumns ?? [])];
  return new Set(columns.map(column => column.name.toLowerCase()));
}

export interface FormulaFieldValues {
  displayName: string;
  formula: string;
}

/**
 * The formula dialog's form (v1 `CalculatedFieldModal` validations): a name and a formula. A new column's name comes
 * from its display name, so that must give a name no column of the table uses (`taken`). An edited column keeps its
 * name: no `taken` then.
 */
export function formulaFieldSchema(taken?: ReadonlySet<string>) {
  const isNew = taken !== undefined;
  return z.object({
    displayName: z
      .string()
      .trim()
      .min(1, { message: 'Column name is required.', abort: true })
      .refine(name => !isNew || columnNameOf(name) !== '', 'Column name needs a latin letter or a digit.')
      .refine(name => !taken?.has(columnNameOf(name).toLowerCase()), 'A column with this name already exists in the table.'),
    formula: z.string().trim().min(1, 'Formula field is required.')
  });
}

/** The form of a new column, or of the edited one with its formula written by display name. */
export function formulaFieldValuesOf(kind: ExpressionColumnKind, table: TableSchema, editing: SchemaColumn | undefined): FormulaFieldValues {
  if (!editing) return { displayName: '', formula: '' };
  const expression = editing.expression ?? '';
  return { displayName: editing.displayName, formula: kind === 'calculated' ? toFormula(expression, table.columns) : expression };
}

/** The expression the server stores: a calculated column's `[Display Name]`s become names, a measure's stays. */
export function expressionOf(kind: ExpressionColumnKind, table: TableSchema, formula: string): string {
  return kind === 'calculated' ? toExpression(formula.trim(), table.columns) : formula.trim();
}

const DESCRIPTIONS: Readonly<Record<ExpressionColumnKind, string>> = { calculated: 'Calculated field', measure: 'Measurement Field' };

/** The column to save: a new one named after its display name (v1 descriptions), or the edited one keeping its name. */
export function expressionColumnOf(kind: ExpressionColumnKind, values: FormulaFieldValues, expression: string, type: string, editing: SchemaColumn | undefined): ExpressionColumn {
  const displayName = values.displayName.trim();
  return {
    name: editing?.name ?? columnNameOf(displayName),
    displayName,
    type,
    expression,
    description: editing ? editing.description : DESCRIPTIONS[kind]
  };
}

/** v1's confirmation, naming the column by display name. */
export function deleteColumnMessage(kind: ExpressionColumnKind, column: Pick<SchemaColumn, 'displayName'>): string {
  return `Are you sure you want to delete ${kind === 'measure' ? 'measure' : 'calculated field'} "${column.displayName}"?`;
}

/** A measure or calculated column of a table, with its kind. */
export interface KindedColumn {
  readonly kind: ExpressionColumnKind;
  readonly column: SchemaColumn;
}

/**
 * The measures and calculated columns a view had before its query changed: the server drops them when it overrides
 * the view, so they are created again on the new one.
 */
export function expressionColumnsOf(table: TableSchema): KindedColumn[] {
  return [
    ...(table.expressionColumns ?? []).map(column => ({ kind: 'measure' as const, column })),
    ...(table.calculatedColumns ?? []).map(column => ({ kind: 'calculated' as const, column }))
  ];
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

/** Told after a change to a table dropped builder items or conditions whose column is gone. */
export function removedFieldsMessage(removed: number, tableName: string): string {
  return `Removed ${plural(removed, 'field')} of the chart that no longer ${removed === 1 ? 'exists' : 'exist'} in ${tableName}.`;
}

/** Told after a view's new query could not keep some of its measures and calculated columns. */
export function lostColumnsMessage(lost: readonly string[]): string {
  return `Could not keep ${lost.map(name => `"${name}"`).join(', ')}: the new query lacks what ${lost.length === 1 ? 'its formula uses' : 'their formulas use'}.`;
}
