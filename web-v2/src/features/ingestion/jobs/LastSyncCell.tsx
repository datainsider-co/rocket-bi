import { Typography } from 'antd';
import type { Job } from '@/core/ingestion/Job';
import { JobStatusTag } from '../status/JobStatusTag';
import { lastSuccessfulSyncLabel } from './jobs.utils';

/**
 * v1 "Last Sync": the status of the last run and when the job last synced successfully. v1 showed only `--` until
 * a first success, hiding a first run that failed; the status is always shown here.
 */
export function LastSyncCell({ job }: { job: Job }) {
  return (
    <div className="flex flex-col gap-0.5">
      <JobStatusTag status={job.lastSyncStatus} />
      <Typography.Text type="secondary" className="whitespace-nowrap text-xs" title="Last successful sync">
        {lastSuccessfulSyncLabel(job)}
      </Typography.Text>
    </div>
  );
}
