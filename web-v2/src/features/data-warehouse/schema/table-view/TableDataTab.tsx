import type { TableDefinition } from '@/core/schema/TableDefinition';
import { useTablePreview } from '../useTablePreview';
import { TableDataView } from './TableDataView';

/** The Table Data tab of `table`; mounted per table, so paging and sort start over on another table. */
export function TableDataTab({ table }: { table: TableDefinition }) {
  return <TableDataView preview={useTablePreview(table)} />;
}
