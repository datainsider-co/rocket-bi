import type { JobStatus } from '@/core/ingestion/Job';
import { jobStatusIconUrl } from './jobStatus.utils';

/** v1 `StatusCell`: the status icon and its name, in a table cell. */
export function JobStatusTag({ status }: { status: JobStatus }) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <img src={jobStatusIconUrl(status)} alt="" width={16} height={16} />
      <span>{status}</span>
    </span>
  );
}
