import { Table } from 'antd';
import type { SorterResult } from 'antd/es/table/interface';
import type { JobId, JobInfo } from '@/core/ingestion/Job';
import { listingPagination } from '../listing/listing.utils';
import type { JobRowActions } from './JobActionsCell';
import { jobColumns } from './jobColumns';
import { isEditableJob, toJobSortField } from './jobs.utils';
import type { JobsTableData, JobsTableHandlers } from './useJobsListing';

export interface JobSelection {
  readonly selectedIds: readonly JobId[];
  readonly onChange: (ids: JobId[]) => void;
}

interface JobsTableProps {
  table: JobsTableData;
  handlers: Pick<JobsTableHandlers, 'onPageChange' | 'onSort'>;
  selection: JobSelection;
  actions: JobRowActions;
}

function sorterColumnKey(sorter: SorterResult<JobInfo> | SorterResult<JobInfo>[]): unknown {
  return Array.isArray(sorter) ? sorter[0]?.columnKey : sorter.columnKey;
}

/** v1 `DiTable2` of `JobScreen`: paged and sorted on the server, checkboxes for the bulk actions; a row opens its job. */
export function JobsTable({ table, handlers, selection, actions }: JobsTableProps) {
  return (
    <Table<JobInfo>
      rowKey={info => info.job.id}
      columns={jobColumns(table.sort, actions)}
      dataSource={table.jobs}
      loading={table.isLoading}
      showSorterTooltip={false}
      scroll={{ x: 'max-content' }}
      pagination={listingPagination(table.page, table.pageSize, table.total)}
      rowSelection={{ selectedRowKeys: [...selection.selectedIds], onChange: keys => selection.onChange(keys.map(Number)) }}
      onRow={({ job }) => (isEditableJob(job) ? { onClick: () => actions.onEdit(job), className: 'cursor-pointer' } : {})}
      onChange={(pagination, _filters, sorter, { action }) => {
        if (action === 'paginate') handlers.onPageChange(pagination.current ?? 1, pagination.pageSize ?? table.pageSize);
        if (action !== 'sort') return;
        const field = toJobSortField(sorterColumnKey(sorter));
        if (field) handlers.onSort(field);
      }}
    />
  );
}
