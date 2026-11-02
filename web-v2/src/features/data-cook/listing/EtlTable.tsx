import { Table } from 'antd';
import type { SorterResult } from 'antd/es/table/interface';
import type { EtlJob } from '@/core/data-cook/EtlJob';
import { listingPagination } from '@/shared/listing/listing.utils';
import { etlColumns } from './etlColumns';
import { toEtlSortField } from './etlListing.utils';
import type { EtlTableData, EtlTableHandlers } from './useEtlListing';
import type { EtlRowActions } from './useEtlListingPage';

interface EtlTableProps {
  table: EtlTableData;
  handlers: Pick<EtlTableHandlers, 'onPageChange' | 'onSort'>;
  actions: EtlRowActions;
}

function sorterColumnKey(sorter: SorterResult<EtlJob> | SorterResult<EtlJob>[]): unknown {
  return Array.isArray(sorter) ? sorter[0]?.columnKey : sorter.columnKey;
}

/**
 * v1 `DiTable2` of `ListEtlJob`, paged on the server (v1 loaded more on scroll). A row opens its ETL, except in the
 * trash.
 */
export function EtlTable({ table, handlers, actions }: EtlTableProps) {
  const opensEditor = table.listing !== 'trash';

  return (
    <Table<EtlJob>
      rowKey="id"
      columns={etlColumns(table.listing, table.sort, actions)}
      dataSource={table.etls}
      loading={table.isLoading}
      showSorterTooltip={false}
      scroll={{ x: 'max-content' }}
      pagination={listingPagination(table.page, table.pageSize, table.total)}
      onRow={etl => (opensEditor ? { onClick: () => actions.onOpen(etl), className: 'cursor-pointer' } : {})}
      onChange={(pagination, _filters, sorter, { action }) => {
        if (action === 'paginate') handlers.onPageChange(pagination.current ?? 1, pagination.pageSize ?? table.pageSize);
        if (action !== 'sort') return;
        const field = toEtlSortField(sorterColumnKey(sorter));
        if (field) handlers.onSort(field);
      }}
    />
  );
}
