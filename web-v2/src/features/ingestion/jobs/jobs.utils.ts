import { hasNextRun, QUEUED_STATUSES, SyncMode, type Job, type JobInfo, type JobStatus } from '@/core/ingestion/Job';
import { JobSortField } from '@/core/ingestion/JobService';
import { SortOrder, type Sort } from '@/core/listing/Listing';
import { IngestionSection } from '../ingestion.utils';
import { formatDateTime } from '../listing/listing.utils';

/** v1 `JobScreen`: newest change first. */
export const DEFAULT_JOB_SORT: Sort<JobSortField> = { field: JobSortField.LastModified, order: SortOrder.Desc };

/** v1 `SearchInput` `timeBound`. */

export const JOB_SEARCH_PLACEHOLDER = 'Search job';

const NO_VALUE = '--';

/** The `current_statuses` filter of a jobs page: Queued Jobs shows what is waiting or running, Jobs shows all. */
export function jobListingStatuses(section: IngestionSection): readonly JobStatus[] | undefined {
  return section === IngestionSection.QueuedJobs ? QUEUED_STATUSES : undefined;
}

const SYNC_MODE_LABELS: Readonly<Record<SyncMode, string>> = {
  [SyncMode.FullSync]: 'Full',
  [SyncMode.IncrementalSync]: 'Incremental'
};

function isSyncMode(value: unknown): value is SyncMode {
  return value === SyncMode.FullSync || value === SyncMode.IncrementalSync;
}

/**
 * v1 "Sync Mode": Full or Incremental. A job v2 can't edit still has its `sync_mode` in the JSON; a job without one
 * shows `--` (v1 showed Full for any job type).
 */
export function syncModeLabel(job: Job): string {
  const mode = job.kind === 'jdbc' ? job.syncMode : job.json['sync_mode'];
  return isSyncMode(mode) ? SYNC_MODE_LABELS[mode] : NO_VALUE;
}

/** v1 "Source Name". The source is missing once it was deleted (v1 threw rendering the row). */
export function sourceNameLabel({ source }: JobInfo): string {
  return source?.displayName || NO_VALUE;
}

/** v1 "Next Sync". A job that will not run again shows `--`, not year 5138. */
export function nextRunLabel(job: Job): string {
  return hasNextRun(job) ? formatDateTime(job.nextRunTime) : NO_VALUE;
}

/** The time under the last sync status: the last successful sync, `--` when it never succeeded. */
export function lastSuccessfulSyncLabel(job: Job): string {
  return formatDateTime(job.lastSuccessfulSync);
}

const SORT_FIELDS: readonly string[] = Object.values(JobSortField);

/** The sort field of a clicked column (its antd `columnKey`), if the server can sort by it. */
export function toJobSortField(columnKey: unknown): JobSortField | undefined {
  return typeof columnKey === 'string' && SORT_FIELDS.includes(columnKey) ? (columnKey as JobSortField) : undefined;
}

/** What an empty listing says: a search that matched nothing, or no jobs at all. */
export function emptyJobsText(keyword: string): string {
  return keyword.trim() ? 'No jobs found' : 'No data yet';
}
