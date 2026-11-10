import type { TableSchema } from '@/core/schema/SchemaService';
import { TableDataView } from '@/shared/table-data/TableDataView';
import { useTablePreview } from '@/shared/table-data/useTablePreview';

interface PreviewTableDataProps {
  table: TableSchema;
  /** The branch's signature: the rows are read again when the table was built again. */
  signature: string;
}

/** The rows of a table in the preview database (v1 `PreviewTableData`). Mounted per table: paging starts over. */
export function PreviewTableData({ table, signature }: PreviewTableDataProps) {
  return <TableDataView preview={useTablePreview(table, signature)} />;
}
