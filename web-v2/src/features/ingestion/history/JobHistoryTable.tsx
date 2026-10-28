import { Table, type TableColumnsType } from 'antd';
import type { JobHistory } from '@/core/ingestion/JobHistory';
import { JobHistorySortField } from '@/core/ingestion/JobHistoryService';
import { columnSortOrder, formatDateTime, listingPagination } from '../listing/listing.utils';
import { JobStatusTag } from '../status/JobStatusTag';
import { HistoryMessageCell } from './HistoryMessageCell';
import { formatDuration, formatRowCount, toHistorySortField } from './jobHistory.utils';
import type { JobHistoryTableState } from './useJobHistory';

/** The order antd cycles through; never "no sort", so a click always asks for a sort (the hook decides which). */
const SORT_DIRECTIONS: ('ascend' | 'descend')[] = ['ascend', 'descend', 'ascend'];

function sortableColumn(field: JobHistorySortField, sort: JobHistoryTableState['sort']) {
  return { key: field, sorter: true, sortOrder: columnSortOrder(sort, field), sortDirections: SORT_DIRECTIONS };
}

/**
 * v1 `JobHistoryStore.jobHistoryHeaders`: Sync Id, Job Name, Last Sync Time, Total Synced Time, Status, Message,
 * Total Inserted Rows. Every column but Message sorts on the server; the column key is the backend column name.
 */
function historyColumns(sort: JobHistoryTableState['sort']): TableColumnsType<JobHistory> {
  return [
    {
      ...sortableColumn(JobHistorySortField.Id, sort),
      title: 'Sync Id',
      width: 100,
      render: (_, run) => <span className="font-medium">{run.syncId}</span>
    },
    {
      ...sortableColumn(JobHistorySortField.JobName, sort),
      title: 'Job Name',
      render: (_, run) => run.jobName
    },
    {
      ...sortableColumn(JobHistorySortField.LastSyncTime, sort),
      title: 'Last Sync Time',
      width: 190,
      className: 'whitespace-nowrap',
      render: (_, run) => formatDateTime(run.lastSyncTime)
    },
    {
      ...sortableColumn(JobHistorySortField.TotalSyncTime, sort),
      title: 'Total Synced Time',
      width: 170,
      className: 'whitespace-nowrap',
      render: (_, run) => formatDuration(run.totalSyncedTime)
    },
    {
      ...sortableColumn(JobHistorySortField.SyncStatus, sort),
      title: 'Status',
      width: 140,
      render: (_, run) => <JobStatusTag status={run.syncStatus} />
    },
    {
      key: 'message',
      title: 'Message',
      width: 260,
      ellipsis: { showTitle: false },
      render: (_, run) => <HistoryMessageCell message={run.message} />
    },
    {
      ...sortableColumn(JobHistorySortField.TotalInsertedRows, sort),
      title: 'Total Inserted Rows',
      width: 170,
      align: 'right',
      render: (_, run) => formatRowCount(run.totalRowsInserted)
    }
  ];
}

/** One page of runs. Paging and sorting are on the server: this only reports what was clicked. */
export function JobHistoryTable({ rows, total, page, pageSize, sort, isLoading, onPageChange, onSortOn }: JobHistoryTableState) {
  return (
    <Table<JobHistory>
      rowKey="syncId"
      columns={historyColumns(sort)}
      dataSource={rows}
      loading={isLoading}
      showSorterTooltip={false}
      scroll={{ x: 'max-content' }}
      pagination={listingPagination(page, pageSize, total)}
      onChange={(pagination, _filters, sorter, { action }) => {
        if (action === 'paginate') {
          onPageChange(pagination.current ?? 1, pagination.pageSize ?? pageSize);
          return;
        }
        if (action !== 'sort') return;
        const field = toHistorySortField((Array.isArray(sorter) ? sorter[0] : sorter)?.columnKey);
        if (field) onSortOn(field);
      }}
    />
  );
}
