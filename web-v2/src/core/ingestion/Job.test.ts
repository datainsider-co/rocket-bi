import { describe, expect, it } from 'vitest';
import fixture from './ingestion.fixture.json';
import {
  canCancelJob,
  hasNextRun,
  jdbcJobToJson,
  jobFromJson,
  jobInfoFromJson,
  jobStatusFromJson,
  newJdbcJob,
  NEVER_RUNS,
  type Job,
  type JobStatus
} from './Job';

const createdJob = fixture.jobCreate.response.job;

function jdbcJob(json: unknown) {
  const job = jobFromJson(json);
  if (job.kind !== 'jdbc') throw new Error('expected a JDBC job');
  return job;
}

describe('jobFromJson', () => {
  it('reads a JDBC job as the server sent it', () => {
    expect(jobFromJson(createdJob)).toEqual({
      kind: 'jdbc',
      id: 1,
      className: 'jdbc_job',
      jobType: 'Jdbc',
      displayName: 'DI0 sales',
      sourceId: 1,
      syncMode: 'FullSync',
      databaseName: 'sample_v2',
      tableName: 'sales',
      destDatabaseName: 'di0_ingest',
      destTableName: 'sales',
      incrementalColumn: undefined,
      lastSyncedValue: '0',
      scheduleTime: { kind: 'once', startTime: 1793208055000 },
      lastSuccessfulSync: 0,
      nextRunTime: 1793208055000,
      lastSyncStatus: 'Initialized',
      currentSyncStatus: 'Initialized',
      creatorId: 'root',
      lastModified: 1793208055825,
      json: createdJob
    });
  });

  it('reads a generic JDBC job and an incremental sync', () => {
    expect(
      jobFromJson({
        class_name: 'generic_jdbc_job',
        sync_mode: 'IncrementalSync',
        incremental_column: 'updated_at',
        last_synced_value: '42'
      })
    ).toMatchObject({
      kind: 'jdbc',
      className: 'generic_jdbc_job',
      syncMode: 'IncrementalSync',
      incrementalColumn: 'updated_at',
      lastSyncedValue: '42'
    });
  });

  it('reads an empty incremental column as none', () => {
    expect(jdbcJob({ class_name: 'jdbc_job', incremental_column: '' }).incrementalColumn).toBeUndefined();
  });

  it.each([
    [{ class_name: 'ga4_job', job_id: 9, display_name: 'GA4', current_sync_status: 'Syncing' }, 'ga4_job'],
    [{}, '']
  ])('reads %j as unsupported, keeping its JSON', (json, className) => {
    expect(jobFromJson(json)).toMatchObject({ kind: 'unsupported', className, json });
  });

  it('reads an unknown status as Unknown and defaults missing fields', () => {
    expect(jobFromJson({ current_sync_status: 'Paused' })).toMatchObject({
      id: -1,
      currentSyncStatus: 'Unknown',
      lastSyncStatus: 'Unknown',
      scheduleTime: { kind: 'none' }
    });
  });
});

describe('jdbcJobToJson', () => {
  it('writes a job read from the server back unchanged', () => {
    expect(jdbcJobToJson(jdbcJob(createdJob))).toEqual(createdJob);
  });

  it('merges edits onto the JSON it was read from', () => {
    const job = jdbcJob(createdJob);

    expect(jdbcJobToJson({ ...job, displayName: 'Renamed', scheduleTime: { kind: 'none' } })).toEqual({
      ...createdJob,
      display_name: 'Renamed',
      schedule_time: { class_name: 'none_schedule' }
    });
  });

  it('writes a new job with the fields job/create accepted', () => {
    const job = newJdbcJob({
      className: 'jdbc_job',
      displayName: 'DI0 sales',
      sourceId: 1,
      syncMode: 'FullSync',
      databaseName: 'sample_v2',
      tableName: 'sales',
      destDatabaseName: 'di0_ingest',
      destTableName: 'sales',
      incrementalColumn: undefined,
      lastSyncedValue: '0',
      scheduleTime: { kind: 'once', startTime: 1793208055000 }
    });

    expect(jdbcJobToJson(job)).toEqual({
      ...fixture.jobCreate.request.job,
      org_id: -1,
      incremental_column: null,
      schedule_time: { class_name: 'schedule_once', start_time: 1793208055000 }
    });
  });

  it('gives a generic JDBC job its own job type', () => {
    expect(jdbcJobToJson({ ...jdbcJob(createdJob), className: 'generic_jdbc_job' })).toMatchObject({
      class_name: 'generic_jdbc_job',
      job_type: 'GenericJdbc'
    });
  });
});

describe('jobStatusFromJson', () => {
  it.each([
    ['Synced', 'Synced'],
    ['Killed', 'Killed'],
    ['synced', 'Unknown'],
    [undefined, 'Unknown'],
    [3, 'Unknown']
  ])('reads %j as %s', (value, expected) => {
    expect(jobStatusFromJson(value)).toBe(expected);
  });
});

describe('canCancelJob', () => {
  it.each<[JobStatus, boolean]>([
    ['Syncing', true],
    ['Queued', true],
    ['Compiling', true],
    ['Initialized', false],
    ['Synced', false],
    ['Error', false]
  ])('is %s → %s', (currentSyncStatus, expected) => {
    expect(canCancelJob({ ...jobFromJson(createdJob), currentSyncStatus })).toBe(expected);
  });
});

describe('hasNextRun', () => {
  const job: Job = jobFromJson(createdJob);

  it.each([
    [1793208055000, true],
    [0, false],
    [NEVER_RUNS, false]
  ])('next_run_time %d → %s', (nextRunTime, expected) => {
    expect(hasNextRun({ ...job, nextRunTime })).toBe(expected);
  });
});

describe('jobInfoFromJson', () => {
  it('reads a job/list row with its source and creator', () => {
    const info = jobInfoFromJson(fixture.jobList.response.data[0]);

    expect(info.job).toMatchObject({ id: 1, kind: 'jdbc' });
    expect(info.source).toMatchObject({ id: 1, kind: 'jdbc' });
    expect(info.creator?.username).toBe('root');
  });

  it('reads a row whose source was deleted', () => {
    expect(jobInfoFromJson({ job: createdJob })).toMatchObject({ source: undefined, creator: undefined });
  });
});
