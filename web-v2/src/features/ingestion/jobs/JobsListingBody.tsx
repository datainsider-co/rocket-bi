import { Button, Empty, Result } from 'antd';
import { emptyJobsText } from './jobs.utils';
import { JobsTable } from './JobsTable';
import type { JobsTableData, JobsTableHandlers } from './useJobsListing';

interface JobsListingBodyProps {
  table: JobsTableData;
  handlers: JobsTableHandlers;
}

/** The table, or what stands in for it: the load error with Retry, or the empty state (v1 `LayoutNoData`). */
export function JobsListingBody({ table, handlers }: JobsListingBodyProps) {
  if (table.error !== undefined) {
    return (
      <Result
        status="error"
        title="Could not load jobs"
        subTitle={table.error}
        extra={
          <Button type="primary" onClick={handlers.onRetry}>
            Retry
          </Button>
        }
      />
    );
  }

  if (!table.isLoading && table.jobs.length === 0) {
    return <Empty className="py-16" image={<i className="di-icon-job text-5xl" />} description={emptyJobsText(table.keyword)} />;
  }

  return (
    <JobsTable
      jobs={table.jobs}
      paging={{ page: table.page, pageSize: table.pageSize, total: table.total }}
      sort={table.sort}
      isLoading={table.isLoading}
      onPageChange={handlers.onPageChange}
      onSort={handlers.onSort}
    />
  );
}
