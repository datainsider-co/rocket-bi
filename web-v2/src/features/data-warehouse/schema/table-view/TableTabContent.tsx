import { useMemo } from 'react';
import type { TableSchema } from '@/core/schema/SchemaService';
import type { TableDefinition } from '@/core/schema/TableDefinition';
import { FormulaColumnsTab } from '../formula-columns/FormulaColumnsTab';
import { RlsTab } from '../rls/RlsTab';
import { filterColumns, SchemaTab } from '../schema.utils';
import { SchemaEditor } from '../schema-edit/SchemaEditor';
import type { SchemaEditTarget } from '../schema-edit/useSchemaEditor';
import { TableColumnsView } from './TableColumnsView';
import { TableDataTab } from './TableDataTab';
import type { TablePanelData } from './useTablePanel';

interface TableTabContentProps {
  data: TablePanelData;
  table: TableDefinition;
  schema: TableSchema;
}

/** What the selected tab shows: the columns (or their form in edit mode), the rows, the formulas, or the RLS policies. */
export function TableTabContent({ data, table, schema }: TableTabContentProps) {
  const target = useMemo((): SchemaEditTarget => ({ kind: 'edit', table }), [table]);
  const columns = useMemo(() => filterColumns(table.columns, data.columnSearch), [table, data.columnSearch]);
  const done = () => data.onEditingChange(false);
  switch (data.tab) {
    case SchemaTab.Schema:
      return data.editing ? <SchemaEditor target={target} onSaved={done} onCancel={done} /> : <TableColumnsView columns={columns} total={table.columns.length} />;
    case SchemaTab.Data:
      return <TableDataTab key={`${table.dbName}.${table.name}`} table={table} />;
    case SchemaTab.Measure:
      return <FormulaColumnsTab kind="measure" table={schema} search={data.columnSearch} />;
    case SchemaTab.Calculated:
      return <FormulaColumnsTab kind="calculated" table={schema} search={data.columnSearch} />;
    case SchemaTab.Rls:
      return <RlsTab table={schema} editing={data.editing} onEditingChange={data.onEditingChange} />;
  }
}
