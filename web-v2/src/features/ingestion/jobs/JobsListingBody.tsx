import { Button, Empty, Result } from 'antd';
import { emptyJobsText } from './jobs.utils';
import { JobsTable } from './JobsTable';
import type { JobsTableData, JobsTableHandlers } from './useJobsListing';
import type { JobsPageActions } from './useJobsPage';

interface JobsListingBodyProps {
  table: JobsTableData;
  handlers: JobsTableHandlers;
  actions: Pick<JobsPageActions, 'selection' | 'rowActions' | 'onAdd'>;
}

/** The table, or what stands in for it: the load error with Retry, or the empty state (v1 `LayoutNoData`). */
export function JobsListingBody({ table, handlers, actions }: JobsListingBodyProps) {
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
    const isSearching = table.keyword.trim() !== '';
    return (
      <Empty className="py-16" image={<i className="di-icon-job text-5xl" />} description={emptyJobsText(table.keyword)}>
        {!isSearching && (
          <span>
            <Button type="link" className="!p-0" onClick={actions.onAdd}>
              Click here
            </Button>{' '}
            to add Job
          </span>
        )}
      </Empty>
    );
  }

  return <JobsTable table={table} handlers={handlers} selection={actions.selection} actions={actions.rowActions} />;
}
