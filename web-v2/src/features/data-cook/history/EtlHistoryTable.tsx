import { Table, type TableColumnsType } from 'antd';
import { Link } from 'react-router';
import type { EtlHistory } from '@/core/data-cook/EtlHistory';
import { EtlHistorySortField } from '@/core/data-cook/EtlHistoryService';
import type { Sort } from '@/core/listing/Listing';
import { columnSortOrder, formatDateTime, formatDuration, listingPagination } from '@/shared/listing/listing.utils';
import { etlEditorPath } from '../dataCook.utils';
import { EtlStatusTag } from '../status/EtlStatusTag';
import { toEtlHistorySortField } from './etlHistory.utils';
import { EtlLogCell } from './EtlLogCell';
import type { EtlHistoryHandlers, EtlHistoryTableData } from './useEtlHistory';

/** The order antd cycles through; never "no sort", so a click always asks for a sort. */
const SORT_DIRECTIONS: ('ascend' | 'descend')[] = ['ascend', 'descend', 'ascend'];

function sortable(field: EtlHistorySortField, sort: Sort<EtlHistorySortField>) {
  return { key: field, sorter: true, sortOrder: columnSortOrder(sort, field), sortDirections: SORT_DIRECTIONS };
}

/**
 * v1 `EtlHistory` headers: History Id, ETL Name (a link to the ETL here), Last Run, Total Run Time, Status, Message.
 * The column key of a sortable column is the backend column name; ETL Name and Message don't sort.
 */
function historyColumns(sort: Sort<EtlHistorySortField>): TableColumnsType<EtlHistory> {
  return [
    {
      ...sortable(EtlHistorySortField.Id, sort),
      title: 'History Id',
      width: 110,
      render: (_, run) => <span className="font-medium">{run.id}</span>
    },
    {
      key: 'name',
      title: 'ETL Name',
      render: (_, run) => (run.etlName ? <Link to={etlEditorPath(run.etlId, run.etlName)}>{run.etlName}</Link> : '--')
    },
    {
      ...sortable(EtlHistorySortField.UpdatedTime, sort),
      title: 'Last Run',
      className: 'whitespace-nowrap',
      render: (_, run) => formatDateTime(run.updatedTime)
    },
    {
      ...sortable(EtlHistorySortField.TotalExecutionTime, sort),
      title: 'Total Run Time',
      className: 'whitespace-nowrap',
      render: (_, run) => formatDuration(run.totalExecutionTime)
    },
    {
      ...sortable(EtlHistorySortField.Status, sort),
      title: 'Status',
      render: (_, run) => <EtlStatusTag status={run.status} />
    },
    { key: 'message', title: 'Message', render: (_, run) => <EtlLogCell run={run} /> }
  ];
}

interface EtlHistoryTableProps {
  table: EtlHistoryTableData;
  handlers: Pick<EtlHistoryHandlers, 'onPageChange' | 'onSort'>;
}

/** One page of runs. Paging and sorting are on the server: this only reports what was clicked. */
export function EtlHistoryTable({ table, handlers }: EtlHistoryTableProps) {
  return (
    <Table<EtlHistory>
      rowKey="id"
      columns={historyColumns(table.sort)}
      dataSource={table.runs}
      loading={table.isLoading}
      showSorterTooltip={false}
      scroll={{ x: 'max-content' }}
      pagination={listingPagination(table.page, table.pageSize, table.total)}
      onChange={(pagination, _filters, sorter, { action }) => {
        if (action === 'paginate') handlers.onPageChange(pagination.current ?? 1, pagination.pageSize ?? table.pageSize);
        if (action !== 'sort') return;
        const field = toEtlHistorySortField((Array.isArray(sorter) ? sorter[0] : sorter)?.columnKey);
        if (field) handlers.onSort(field);
      }}
    />
  );
}
