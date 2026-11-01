import { EditOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Input, Segmented } from 'antd';
import type { TableSchema } from '@/core/schema/SchemaService';
import type { TableDefinition } from '@/core/schema/TableDefinition';
import { formulaTabTextsOf } from '../formula-columns/formulaColumns.utils';
import { useFormulaColumnActions } from '../formula-columns/FormulaColumnsContext';
import { hasColumnSearch, schemaTabsOf, SchemaTab } from '../schema.utils';
import { canEditSchema } from '../schema-edit/schemaEdit.utils';
import type { TablePanelData } from './useTablePanel';

interface TableTabToolbarProps {
  data: TablePanelData;
  table: TableDefinition;
  schema: TableSchema;
  narrow: boolean;
}

/** The tabs, the column search and the tab's button: Edit, Add Measure or Add Calculated Field (v1 header buttons). */
export function TableTabToolbar({ data, table, schema, narrow }: TableTabToolbarProps) {
  const formulas = useFormulaColumnActions();
  const { tab, editing } = data;
  const formulaKind = tab === SchemaTab.Measure ? 'measure' : tab === SchemaTab.Calculated ? 'calculated' : undefined;
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <Segmented options={schemaTabsOf(narrow)} value={tab} disabled={editing} onChange={value => data.onTabChange(value)} />
      <div className="ml-auto flex flex-wrap items-center gap-2 max-sm:ml-0 max-sm:w-full">
        {hasColumnSearch(tab) && !editing && (
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search columns..."
            aria-label="Search columns"
            className="w-56 max-sm:w-full"
            value={data.columnSearch}
            onChange={event => data.onColumnSearchChange(event.target.value)}
          />
        )}
        {tab === SchemaTab.Schema && !editing && !narrow && canEditSchema(table) && (
          <Button icon={<EditOutlined />} onClick={() => data.onEditingChange(true)}>
            Edit
          </Button>
        )}
        {formulaKind && (
          <Button icon={<PlusOutlined />} onClick={() => formulas.onAdd(formulaKind, schema)}>
            {formulaTabTextsOf(formulaKind).add}
          </Button>
        )}
      </div>
    </div>
  );
}
