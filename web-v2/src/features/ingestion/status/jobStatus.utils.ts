import { JobStatus } from '@/core/ingestion/Job';

const ICON_DIR = '/ingestion/status';

/** v1 `StatusCell.jobStatusImg`: Killed and Terminated share an icon; Compiling and Unknown use the unknown one. */
const ICONS: Readonly<Record<JobStatus, string>> = {
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

export function jobStatusIconUrl(status: JobStatus): string {
  return `${ICON_DIR}/${ICONS[status]}.svg`;
}
