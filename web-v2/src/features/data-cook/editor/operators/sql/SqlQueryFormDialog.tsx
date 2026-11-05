import type { TableSchema } from '@/core/schema/SchemaService';
import { SqlQueryDialogView } from './SqlQueryDialogView';
import { useSqlQueryForm } from './useSqlQueryForm';

interface SqlQueryFormDialogProps {
  texts: { title: string; okText: string };
  table: TableSchema;
  initialSql: string;
  onSubmit: (sql: string) => void;
  onCancel: () => void;
}

/** The dialog on its form; mounted once per dialog, so the SQL starts from `initialSql`. */
export function SqlQueryFormDialog({ texts, table, initialSql, onSubmit, onCancel }: SqlQueryFormDialogProps) {
  return <SqlQueryDialogView texts={texts} table={table} form={useSqlQueryForm(table, initialSql, onSubmit)} onCancel={onCancel} />;
}
