import { JobStatus } from '@/core/ingestion/Job';
import type { StatusIcon } from '@/shared/listing/statusIcon';

/** v1 `StatusCell.jobStatusImg`: Killed and Terminated share an icon; Compiling and Unknown use the unknown one. */
const ICONS: Readonly<Record<JobStatus, StatusIcon>> = {
  [JobStatus.Synced]: 'synced',
  [JobStatus.Error]: 'error',
  [JobStatus.Queued]: 'queued',
  [JobStatus.Syncing]: 'syncing',
  [JobStatus.Initialized]: 'initialized',
  [JobStatus.Killed]: 'terminated',
  [JobStatus.Terminated]: 'terminated',
  [JobStatus.Compiling]: 'unknown',
  [JobStatus.Unknown]: 'unknown'
};

export function jobStatusIcon(status: JobStatus): StatusIcon {
  return ICONS[status];
}
