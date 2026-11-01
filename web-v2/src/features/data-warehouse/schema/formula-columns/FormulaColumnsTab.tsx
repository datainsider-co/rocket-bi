import { useMemo } from 'react';
import type { ExpressionColumnKind } from '@/core/schema/SchemaEditService';
import type { TableSchema } from '@/core/schema/SchemaService';
import { columnsOfKind } from '@/features/chart-builder/field-actions/fieldActions.utils';
import { filterColumns } from '../schema.utils';
import { formulaTabTextsOf } from './formulaColumns.utils';
import { useFormulaColumnActions } from './FormulaColumnsContext';
import { FormulaColumnsView } from './FormulaColumnsView';

interface FormulaColumnsTabProps {
  kind: ExpressionColumnKind;
  table: TableSchema;
  search: string;
}

/** The Measure Schema or Calculated Field tab of `table`: its formulas, searched, edited in the formula dialog. */
export function FormulaColumnsTab({ kind, table, search }: FormulaColumnsTabProps) {
  const actions = useFormulaColumnActions();
  const all = columnsOfKind(table, kind);
  const columns = useMemo(() => filterColumns(all, search), [all, search]);
  return (
    <FormulaColumnsView
      columns={columns}
      total={all.length}
      emptyText={formulaTabTextsOf(kind).empty}
      onEdit={column => actions.onEdit(kind, table, column)}
      onDelete={column => actions.onDelete(kind, table, column)}
    />
  );
}
