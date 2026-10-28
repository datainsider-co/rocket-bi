import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import fixture from '@/core/ingestion/ingestion.fixture.json';
import { jobInfoFromJson, NEVER_RUNS, QUEUED_STATUSES, type Job, type JobInfo } from '@/core/ingestion/Job';
import { IngestionSection } from '../ingestion.utils';
import {
  deleteJobsText,
  emptyJobsText,
  forceSyncSummary,
  isEditableJob,
  jobListingStatuses,
  lastSuccessfulSyncLabel,
  nextRunLabel,
  sourceNameLabel,
  syncModeLabel,
  toJobSortField
} from './jobs.utils';

const rows = fixture.jobList.response.data;
const synced: JobInfo = jobInfoFromJson(rows[0]);
const unsupported: Job = jobInfoFromJson({ ...rows[0], job: { ...rows[0]?.job, class_name: 'ga4_job' } }).job;

describe('jobListingStatuses', () => {
  it('filters Queued Jobs on the queued statuses', () => {
    expect(jobListingStatuses(IngestionSection.QueuedJobs)).toBe(QUEUED_STATUSES);
  });

  it('does not filter Jobs', () => {
    expect(jobListingStatuses(IngestionSection.Jobs)).toBeUndefined();
  });
});

describe('syncModeLabel', () => {
  it.each([
    ['FullSync', 'Full'],
    ['IncrementalSync', 'Incremental']
  ])('shows %s of a JDBC job as %s', (mode, expected) => {
    const job = jobInfoFromJson({ ...rows[0], job: { ...rows[0]?.job, sync_mode: mode } }).job;
    expect(syncModeLabel(job)).toBe(expected);
  });

  it('reads the mode of a job v2 cannot edit from its JSON', () => {
    expect(unsupported.kind).toBe('unsupported');
    expect(syncModeLabel(unsupported)).toBe('Full');
  });

  it.each([undefined, 'Other'])('shows -- for an unsupported job with sync_mode %j', mode => {
    const job: Job = { ...unsupported, json: { ...unsupported.json, sync_mode: mode } };
    expect(syncModeLabel(job)).toBe('--');
  });
});

describe('sourceNameLabel', () => {
  it('shows the source name', () => {
    expect(sourceNameLabel(synced)).toBe('DI0 MySQL');
  });

  it('shows -- once the source was deleted', () => {
    expect(sourceNameLabel({ ...synced, source: undefined })).toBe('--');
  });
});

describe('nextRunLabel', () => {
  const time = dayjs('2030-01-01T02:00:00').valueOf();

  it('formats the next run', () => {
    expect(nextRunLabel({ ...synced.job, nextRunTime: time })).toBe('Jan 01, 2030 02:00:00');
  });

  it.each([NEVER_RUNS, 0])('shows -- for %d', nextRunTime => {
    expect(nextRunLabel({ ...synced.job, nextRunTime })).toBe('--');
  });

  it('shows -- for the fixture job that already ran once', () => {
    expect(synced.job.nextRunTime).toBe(NEVER_RUNS);
    expect(nextRunLabel(synced.job)).toBe('--');
  });
});

describe('lastSuccessfulSyncLabel', () => {
  it('formats the last successful sync', () => {
    const time = dayjs('2026-10-29T07:30:05').valueOf();
    expect(lastSuccessfulSyncLabel({ ...synced.job, lastSuccessfulSync: time })).toBe('Oct 29, 2026 07:30:05');
  });

  it('shows -- when the job never synced', () => {
    expect(lastSuccessfulSyncLabel({ ...synced.job, lastSuccessfulSync: 0 })).toBe('--');
  });
});

describe('toJobSortField', () => {
  it.each(['name', 'sync_mode', 'last_sync_status', 'next_run_time', 'current_sync_status'])('accepts %s', key => {
    expect(toJobSortField(key)).toBe(key);
  });

  it.each(['source_name', 'sourceName', '', undefined, 1])('rejects %j', key => {
    expect(toJobSortField(key)).toBeUndefined();
  });
});

describe('emptyJobsText', () => {
  it('says nothing matched a search', () => {
    expect(emptyJobsText('sales')).toBe('No jobs found');
  });

  it.each(['', '  '])('says there are no jobs yet without a keyword (%j)', keyword => {
    expect(emptyJobsText(keyword)).toBe('No data yet');
  });
});

describe('isEditableJob', () => {
  it('edits JDBC jobs only', () => {
    expect(isEditableJob(synced.job)).toBe(true);
    expect(isEditableJob(unsupported)).toBe(false);
  });
});

describe('deleteJobsText', () => {
  it('names a single job like v1', () => {
    expect(deleteJobsText([{ displayName: 'DI0 sales' }])).toBe("Are you sure to delete job 'DI0 sales'?");
  });

  it('counts several jobs', () => {
    expect(deleteJobsText([{ displayName: 'a' }, { displayName: 'b' }])).toBe('Are you sure to delete 2 jobs?');
  });
});

describe('forceSyncSummary', () => {
  it('says how many jobs were scheduled when all were', () => {
    expect(forceSyncSummary({ 1: true })).toEqual({ ok: true, text: '1 job force synced' });
    expect(forceSyncSummary({ 1: true, 2: true })).toEqual({ ok: true, text: '2 jobs force synced' });
  });

  it('counts the failures', () => {
    expect(forceSyncSummary({ 1: true, 2: false, 3: false })).toEqual({ ok: false, text: '1 job force synced, 2 jobs failed' });
    expect(forceSyncSummary({ 1: false })).toEqual({ ok: false, text: '1 job failed' });
  });
});
