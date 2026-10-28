import { describe, expect, it } from 'vitest';
import { dataSourceFromJson, type JdbcSource } from '@/core/ingestion/DataSource';
import fixture from '@/core/ingestion/ingestion.fixture.json';
import { jdbcJobToJson, jobFromJson, type JdbcJob } from '@/core/ingestion/Job';
import { Frequency, ScheduleMode, defaultScheduleFormValues } from '@/shared/schedule/schedule.utils';
import {
  allowsMinutely,
  cleanTableNames,
  followDestTableName,
  initialJobFormValues,
  isListed,
  jobClassNameFor,
  jobFormSchema,
  jobSavedMessage,
  jobToFormValues,
  newJobFormValues,
  pickableSources,
  planJobSave,
  saveButtonText,
  type JobFormValues,
  type JobSaveContext
} from './jobForm.utils';

const UTC = () => 0;
const NOW = Date.UTC(2026, 9, 29, 3, 0, 0);

function savedJob(): JdbcJob {
  const job = jobFromJson(fixture.jobCreate.response.job);
  if (job.kind !== 'jdbc') throw new Error('expected a JDBC job');
  return job;
}

function mysqlSource(): JdbcSource {
  const source = dataSourceFromJson(fixture.sourceGet.response);
  if (source.kind !== 'jdbc') throw new Error('expected a JDBC source');
  return source;
}

function filled(overrides: Partial<JobFormValues> = {}): JobFormValues {
  return {
    ...newJobFormValues(1, NOW, UTC),
    displayName: 'Sales',
    databaseName: 'sample_v2',
    tableNames: ['sales'],
    destDatabaseName: 'di6',
    destTableName: 'sales',
    ...overrides
  };
}

function errorsOf(values: JobFormValues): Record<string, string> {
  const result = jobFormSchema.safeParse(values);
  if (result.success) return {};
  return Object.fromEntries(result.error.issues.map(issue => [issue.path.join('.'), issue.message]));
}

const CREATE: JobSaveContext = { target: { mode: 'create', lockSource: false }, className: 'jdbc_job', now: NOW, offsetAt: UTC };

describe('cleanTableNames', () => {
  it('trims, drops blanks and repeats, and leaves the input alone', () => {
    const names = [' a ', '', 'b', 'a', '  '];
    expect(cleanTableNames(names)).toEqual(['a', 'b']);
    expect(names).toEqual([' a ', '', 'b', 'a', '  ']);
  });
});

describe('allowsMinutely', () => {
  it.each([
    [0, true],
    [1, true],
    [2, false]
  ])('%i tables → %s', (count, expected) => {
    expect(allowsMinutely(count)).toBe(expected);
  });
});

describe('jobClassNameFor', () => {
  it('gives generic JDBC sources a generic job', () => {
    expect(jobClassNameFor({ databaseType: 'GenericJdbc' })).toBe('generic_jdbc_job');
    expect(jobClassNameFor({ databaseType: 'Postgres' })).toBe('jdbc_job');
  });
});

describe('newJobFormValues', () => {
  it('starts full sync, run once now, on the given source', () => {
    expect(newJobFormValues(3, NOW, UTC)).toEqual({
      displayName: '',
      sourceId: 3,
      databaseName: '',
      tableNames: [],
      destDatabaseName: '',
      destTableName: '',
      syncMode: 'FullSync',
      incrementalColumn: '',
      lastSyncedValue: '0',
      schedule: defaultScheduleFormValues(NOW, UTC)
    });
  });

  it('has no source when none is given', () => {
    expect(newJobFormValues(undefined, NOW, UTC).sourceId).toBeNull();
  });
});

describe('jobToFormValues', () => {
  it('loads the DI0 job', () => {
    expect(jobToFormValues(savedJob(), NOW, UTC)).toEqual({
      displayName: 'DI0 sales',
      sourceId: 1,
      databaseName: 'sample_v2',
      tableNames: ['sales'],
      destDatabaseName: 'di0_ingest',
      destTableName: 'sales',
      syncMode: 'FullSync',
      incrementalColumn: '',
      lastSyncedValue: '0',
      schedule: { ...defaultScheduleFormValues(NOW, UTC), date: '2026-10-28', time: '17:20:55' }
    });
  });

  it('has no table for a job without one', () => {
    expect(jobToFormValues({ ...savedJob(), tableName: '' }, NOW, UTC).tableNames).toEqual([]);
  });
});

describe('initialJobFormValues', () => {
  it('uses the source of a create and the job of an edit', () => {
    expect(initialJobFormValues({ mode: 'create', source: mysqlSource(), lockSource: true }, NOW, UTC).sourceId).toBe(1);
    expect(initialJobFormValues({ mode: 'create', lockSource: false }, NOW, UTC).sourceId).toBeNull();
    expect(initialJobFormValues({ mode: 'edit', job: savedJob() }, NOW, UTC).displayName).toBe('DI0 sales');
  });
});

describe('jobFormSchema', () => {
  it('accepts a filled form', () => {
    expect(errorsOf(filled())).toEqual({});
  });

  it('needs a name, source, database, table and destination', () => {
    const empty = { ...newJobFormValues(undefined, NOW, UTC), displayName: ' ' };
    expect(errorsOf(empty)).toEqual({
      displayName: 'Job name is required!',
      sourceId: 'Select a data source, please',
      databaseName: 'Database name is required!',
      tableNames: 'Table name is required!',
      destDatabaseName: 'Destination database is required!',
      destTableName: 'Destination table is required!'
    });
  });

  it('needs no destination table with several tables', () => {
    expect(errorsOf(filled({ tableNames: ['a', 'b'], destTableName: '' }))).toEqual({});
  });

  it('needs the column and start value of an incremental sync', () => {
    expect(errorsOf(filled({ syncMode: 'IncrementalSync', incrementalColumn: '', lastSyncedValue: ' ' }))).toEqual({
      incrementalColumn: 'Incremental column is required!',
      lastSyncedValue: 'Start value is required!'
    });
  });

  it('allows minutely for one table only', () => {
    const minutely = { ...filled().schedule, mode: ScheduleMode.Recurring, frequency: Frequency.Minutely };
    expect(errorsOf(filled({ schedule: minutely }))).toEqual({});
    expect(errorsOf(filled({ schedule: minutely, tableNames: ['a', 'b'] }))).toEqual({
      'schedule.frequency': 'Minutely syncs one table at a time; pick a longer frequency'
    });
    expect(errorsOf(filled({ schedule: { ...minutely, mode: ScheduleMode.Once }, tableNames: ['a', 'b'] }))).toEqual({});
  });

  it('reports schedule errors under schedule', () => {
    expect(errorsOf(filled({ schedule: { ...filled().schedule, date: '' } }))).toEqual({ 'schedule.date': 'Date is required!' });
  });
});

describe('followDestTableName', () => {
  it('follows the first table while the user has not typed another name', () => {
    expect(followDestTableName([], ['sales'], '')).toBe('sales');
    expect(followDestTableName(['sales'], ['orders'], 'sales')).toBe('orders');
    expect(followDestTableName(['sales'], [], 'sales')).toBe('');
  });

  it('keeps a typed name', () => {
    expect(followDestTableName(['sales'], ['orders'], 'sales_copy')).toBe('sales_copy');
  });

  it('leaves it alone for several tables', () => {
    expect(followDestTableName(['sales'], ['sales', 'orders'], 'sales')).toBe('sales');
  });
});

describe('isListed', () => {
  it('is true only for a name in the list', () => {
    expect(isListed('caas', ['caas'])).toBe(true);
    expect(isListed('ca', ['caas'])).toBe(false);
    expect(isListed('', [''])).toBe(false);
    expect(isListed('caas', undefined)).toBe(false);
  });
});

describe('planJobSave', () => {
  it('creates one job for one table, matching the DI0 request', () => {
    const values = filled({ displayName: 'DI0 sales', destDatabaseName: 'di0_ingest' });
    const schedule = { ...values.schedule, date: '2026-10-28', time: '17:20:55' };
    const plan = planJobSave({ ...values, schedule }, CREATE);

    expect(plan.kind).toBe('create');
    if (plan.kind !== 'create') return;
    expect(jdbcJobToJson(plan.job)).toEqual({
      ...fixture.jobCreate.request.job,
      org_id: -1,
      incremental_column: null
    });
  });

  it('creates one job per table with multi_create, like DI0', () => {
    const values = filled({ displayName: 'DI0 multi', databaseName: 'caas', tableNames: ['organization', ' role '], destDatabaseName: 'di0_multi' });
    const plan = planJobSave(values, CREATE);

    expect(plan).toMatchObject({ kind: 'createForTables', tableNames: ['organization', 'role'] });
    if (plan.kind !== 'createForTables') return;
    expect(jdbcJobToJson(plan.baseJob)).toMatchObject({
      display_name: 'DI0 multi',
      database_name: 'caas',
      table_name: '',
      dest_database_name: 'di0_multi',
      dest_table_name: ''
    });
  });

  it('uses the class name of the source for a create', () => {
    const plan = planJobSave(filled(), { ...CREATE, className: 'generic_jdbc_job' });
    expect(plan.kind === 'create' && plan.job.className).toBe('generic_jdbc_job');
  });

  it('merges an edit onto the saved job, keeping its status and JSON', () => {
    const job = { ...savedJob(), lastSyncStatus: 'Synced' as const };
    const values = { ...jobToFormValues(job, NOW, UTC), displayName: 'Renamed', syncMode: 'IncrementalSync' as const, incrementalColumn: ' id ', lastSyncedValue: '100' };
    const plan = planJobSave(values, { ...CREATE, target: { mode: 'edit', job }, className: 'generic_jdbc_job' });

    expect(plan).toEqual({
      kind: 'update',
      job: { ...job, displayName: 'Renamed', syncMode: 'IncrementalSync', incrementalColumn: 'id', lastSyncedValue: '100' }
    });
  });

  it('drops the incremental column of a full sync and defaults a blank start value', () => {
    const plan = planJobSave(filled({ incrementalColumn: 'id', lastSyncedValue: '' }), CREATE);
    expect(plan.kind === 'create' && [plan.job.incrementalColumn, plan.job.lastSyncedValue]).toEqual([undefined, '0']);
  });
});

describe('pickableSources', () => {
  const mysql = mysqlSource();
  const mongo = dataSourceFromJson({ id: 2, class_name: 'mongo_db_source', display_name: 'Mongo' });

  it('offers only JDBC sources', () => {
    expect(pickableSources([mongo, mysql], undefined)).toEqual([mysql]);
  });

  it('adds the own source while the list loads or when it is missing', () => {
    expect(pickableSources(undefined, mysql)).toEqual([mysql]);
    expect(pickableSources([mongo], mysql)).toEqual([mysql]);
  });

  it('does not repeat a listed own source', () => {
    expect(pickableSources([mysql], { ...mysql, displayName: 'stale' })).toEqual([mysql]);
  });
});

describe('saveButtonText', () => {
  it.each([
    [true, 1, 'Update'],
    [false, 0, 'Create'],
    [false, 1, 'Create'],
    [false, 3, 'Create 3 jobs']
  ])('edit %s, %i tables → %s', (isEdit, count, text) => {
    expect(saveButtonText(isEdit, count)).toBe(text);
  });
});

describe('jobSavedMessage', () => {
  const job = savedJob();

  it.each([
    [{ kind: 'create', job } as const, 'Job created'],
    [{ kind: 'createForTables', baseJob: job, tableNames: ['a', 'b'] } as const, '2 jobs created'],
    [{ kind: 'update', job } as const, 'Job updated']
  ])('%#: %s', (plan, text) => {
    expect(jobSavedMessage(plan)).toBe(text);
  });
});
