import { Table } from 'antd';
import type { SorterResult } from 'antd/es/table/interface';
import type { JobInfo } from '@/core/ingestion/Job';
import type { JobSortField } from '@/core/ingestion/JobService';
import type { Sort } from '@/core/listing/Listing';
import { listingPagination } from '../listing/listing.utils';
import { jobColumns } from './jobColumns';
import { toJobSortField } from './jobs.utils';

export interface JobsPaging {
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
}

interface JobsTableProps {
  jobs: readonly JobInfo[];
  paging: JobsPaging;
  sort: Sort<JobSortField>;
  isLoading: boolean;
  onPageChange: (page: number, pageSize: number) => void;
  onSort: (field: JobSortField) => void;
}

function sorterColumnKey(sorter: SorterResult<JobInfo> | SorterResult<JobInfo>[]): unknown {
  return Array.isArray(sorter) ? sorter[0]?.columnKey : sorter.columnKey;
}

/** v1 `DiTable2` of `JobScreen`: paged and sorted on the server. Rows can't be opened yet (edit is DI6). */
export function JobsTable({ jobs, paging, sort, isLoading, onPageChange, onSort }: JobsTableProps) {
  return (
    <Table<JobInfo>
      rowKey={info => info.job.id}
      columns={jobColumns(sort)}
      dataSource={jobs}
      loading={isLoading}
      showSorterTooltip={false}
      scroll={{ x: 'max-content' }}
      pagination={listingPagination(paging.page, paging.pageSize, paging.total)}
      onChange={(pagination, _filters, sorter, { action }) => {
        if (action === 'paginate') onPageChange(pagination.current ?? 1, pagination.pageSize ?? paging.pageSize);
        if (action !== 'sort') return;
        const field = toJobSortField(sorterColumnKey(sorter));
        if (field) onSort(field);
      }}
    />
  );
}
