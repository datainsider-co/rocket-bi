import type { TableDefinition } from '@/core/schema/TableDefinition';
import { TableDataView } from '@/shared/table-data/TableDataView';
import { useTablePreview } from '@/shared/table-data/useTablePreview';

/** The Table Data tab of `table`; mounted per table, so paging and sort start over on another table. */
export function TableDataTab({ table }: { table: TableDefinition }) {
  return <TableDataView preview={useTablePreview(table)} />;
}
