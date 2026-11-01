import { useMemo } from 'react';
import type { TreeHandlers } from '../database-tree/databaseTree.utils';
import { findFormulaColumn, kindOfRole, SCHEMA_TABLE_ACTIONS, treeColumnActionsOf } from './formula-columns/formulaColumns.utils';
import type { FormulaColumnActions } from './formula-columns/useFormulaColumns';
import type { SchemaSelection } from './schema.utils';
import type { DeletableTable } from './useDeleteTable';

/**
 * The tree of the Schema page: a database or table opens it; a table's menu adds a measure or calculated field or
 * deletes the table; a measure's or calculated column's menu edits or deletes it (v1 `DatabaseTreeView` menus).
 */
export function useSchemaTreeHandlers(
  select: (next: SchemaSelection) => void,
  deleteTable: (table: DeletableTable) => void,
  formulas: FormulaColumnActions
): TreeHandlers {
  return useMemo(
    (): TreeHandlers => ({
      onSelectDatabase: dbName => select({ dbName, tableName: undefined }),
      onSelectTable: table => select({ dbName: table.dbName, tableName: table.name }),
      tableActionsOf: () => SCHEMA_TABLE_ACTIONS,
      onTableAction: (table, action) => {
        if (action === 'addCalculated') formulas.onAdd('calculated', table.table);
        else if (action === 'addMeasure') formulas.onAdd('measure', table.table);
        else deleteTable({ dbName: table.dbName, name: table.name, displayName: table.title });
      },
      columnActionsOf: (_table, column) => treeColumnActionsOf(column.role),
      onColumnAction: (table, column, action) => {
        const kind = kindOfRole(column.role);
        const found = kind && findFormulaColumn(table.table, kind, column.name);
        if (!kind || !found) return;
        if (action === 'edit') formulas.onEdit(kind, table.table, found);
        else formulas.onDelete(kind, table.table, found);
      }
    }),
    [select, deleteTable, formulas]
  );
}
