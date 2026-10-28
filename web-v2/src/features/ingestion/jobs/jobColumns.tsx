import type { TableColumnsType } from 'antd';
import type { ColumnType } from 'antd/es/table/interface';
import type { JobInfo } from '@/core/ingestion/Job';
import { JobSortField } from '@/core/ingestion/JobService';
import type { Sort } from '@/core/listing/Listing';
import { columnSortOrder } from '../listing/listing.utils';
import { JobStatusTag } from '../status/JobStatusTag';
import { nextRunLabel, sourceNameLabel, syncModeLabel } from './jobs.utils';
import { LastSyncCell } from './LastSyncCell';

/**
 * Columns of v1 `JobScreen` without the checkbox and Action ones (DI5b). A sortable column's `key` is its server sort
 * field; Source Name has none (v1 sent `source_name`, a 500). The sort cycle never clears: a click flips the order.
 */
export function jobColumns(sort: Sort<JobSortField>): TableColumnsType<JobInfo> {
  const sortable = (field: JobSortField): ColumnType<JobInfo> => ({
    key: field,
    sorter: true,
    sortOrder: columnSortOrder(sort, field),
    sortDirections: ['ascend', 'descend', 'ascend']
  });

  return [
    {
      ...sortable(JobSortField.Name),
      title: 'Name',
      render: (_, { job }) => <span className="font-medium">{job.displayName || '--'}</span>
    },
    { key: 'source', title: 'Source Name', render: (_, info) => sourceNameLabel(info) },
    {
      ...sortable(JobSortField.SyncMode),
      title: 'Sync Mode',
      className: 'whitespace-nowrap',
      render: (_, { job }) => syncModeLabel(job)
    },
    {
      ...sortable(JobSortField.LastSyncStatus),
      title: 'Last Sync',
      render: (_, { job }) => <LastSyncCell job={job} />
    },
    {
      ...sortable(JobSortField.NextRunTime),
      title: 'Next Sync',
      className: 'whitespace-nowrap',
      render: (_, { job }) => nextRunLabel(job)
    },
    {
      ...sortable(JobSortField.CurrentSyncStatus),
      title: 'Current Status',
      render: (_, { job }) => <JobStatusTag status={job.currentSyncStatus} />
    }
  ];
}
