import { useMemo } from 'react';
import { RightOutlined } from '@ant-design/icons';
import type { TableDefinition } from '@/core/schema/TableDefinition';
import type { NewTableName } from './schemaEdit.utils';
import { SchemaEditor } from './SchemaEditor';
import type { SchemaEditTarget } from './useSchemaEditor';

interface CreateTablePanelProps {
  table: NewTableName;
  onCreated: (table: TableDefinition) => void;
  /** Back to the database, the table not created. */
  onCancel: () => void;
}

/** The columns of a table to create (v1 `FieldCreationManagement`): "database › table", then the column form. */
export function CreateTablePanel({ table, onCreated, onCancel }: CreateTablePanelProps) {
  const target = useMemo((): SchemaEditTarget => ({ kind: 'create', table }), [table]);
  return (
    <section aria-label={`New table ${table.displayName}`} className="flex min-h-0 flex-1 flex-col rounded-lg bg-white p-4">
      <header className="mb-3 flex min-w-0 items-center gap-2 text-base">
        <i className="di-icon-database text-black/60" aria-hidden />
        <span className="font-medium">{table.dbName}</span>
        <RightOutlined className="text-xs text-black/45" aria-hidden />
        <span className="truncate">{table.displayName}</span>
      </header>
      <SchemaEditor target={target} onSaved={onCreated} onCancel={onCancel} />
    </section>
  );
}
