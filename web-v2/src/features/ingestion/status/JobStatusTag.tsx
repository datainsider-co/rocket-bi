import type { JobStatus } from '@/core/ingestion/Job';
import { StatusTag } from '@/shared/listing/StatusTag';
import { jobStatusIcon } from './jobStatus.utils';

/** v1 `StatusCell` for a job's status. */
export function JobStatusTag({ status }: { status: JobStatus }) {
  return <StatusTag status={status} icon={jobStatusIcon(status)} />;
}
