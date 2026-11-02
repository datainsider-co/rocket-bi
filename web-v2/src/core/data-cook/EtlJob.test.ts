import { describe, expect, it } from 'vitest';
import type { ScheduleTime } from '@/core/schedule/ScheduleTime';
import fixture from './etl.fixture.json';
import {
  canCancelEtl,
  etlJobFromJson,
  etlJobToJson,
  etlStatusFromJson,
  hasNextExecution,
  incrementalKey,
  newEtlJob,
  type EtlJob
} from './EtlJob';

const v1Etl = etlJobFromJson(fixture.etlGetV1.response);

function etl(scheduleTime: ScheduleTime, nextExecuteTime: number, status: EtlJob['status'] = 'Initialized'): EtlJob {
  return { ...newEtlJob('x'), scheduleTime, nextExecuteTime, status };
}

describe('etlJobFromJson', () => {
  it('reads an ETL saved by v1', () => {
    expect(v1Etl).toMatchObject({
      id: 2,
      displayName: 'DC0 v1 ETL',
      ownerId: 'root',
      scheduleTime: { kind: 'daily', recurEvery: 1, startTime: 1793633725000 },
      status: 'Initialized',
      incrementalConfigs: { sales_1: { columnName: 'order_date', value: '2015-01-01 00:00:00' } }
    });
    expect(v1Etl.operators.map(operator => operator.kind)).toEqual(['join', 'manageFields']);
    expect(v1Etl.owner?.username).toBe('root');
    expect(v1Etl.extraData).toHaveProperty('table_position');
  });

  it('reads a listed ETL, which comes without operators', () => {
    const [first] = fixture.myEtl.response.data.map(etlJobFromJson);

    expect(first).toMatchObject({ id: 4, displayName: 'DC0 fixture', operators: [], scheduleTime: { kind: 'none' } });
  });

  it('skips a full config and reads one without class_name as incremental', () => {
    const read = etlJobFromJson({
      config: {
        map_incremental_config: {
          a: { class_name: 'full' },
          b: { column_name: 'id', value: '5' },
          c: 'odd'
        }
      }
    });

    expect(read.incrementalConfigs).toEqual({ b: { columnName: 'id', value: '5' } });
  });

  it('reads an empty object as an empty ETL', () => {
    expect(etlJobFromJson(undefined)).toMatchObject({ id: 0, operators: [], owner: undefined, status: 'Unknown' });
  });
});

describe('etlStatusFromJson', () => {
  it.each([
    ['Done', 'Done'],
    ['Running', 'Running'],
    ['Synced', 'Synced'],
    ['Paused', 'Unknown'],
    [undefined, 'Unknown']
  ])('reads %s as %s', (value, status) => {
    expect(etlStatusFromJson(value)).toBe(status);
  });
});

describe('etlJobToJson', () => {
  it('writes what v1 sent when saving', () => {
    const body = etlJobToJson(v1Etl);

    expect(Object.keys(body)).toEqual(['display_name', 'operators', 'schedule_time', 'extra_data', 'config']);
    expect(body).toMatchObject({
      display_name: 'DC0 v1 ETL',
      schedule_time: { class_name: 'schedule_daily', recur_every: 1, start_time: 1793633725000 },
      config: { map_incremental_config: { sales_1: { class_name: 'incremental', column_name: 'order_date', value: '2015-01-01 00:00:00' } } }
    });
    expect(body['extra_data']).toBe(v1Etl.extraData);
    expect(body['operators']).toHaveLength(2);
  });

  it('round-trips the ETL stored with every operator kind', () => {
    const stored = fixture.etlUpdate.response;
    const body = etlJobToJson(etlJobFromJson(stored));

    expect(body['schedule_time']).toEqual(stored.schedule_time);
    expect(body['extra_data']).toEqual(stored.extra_data);
  });

  it('writes a new ETL as v1 created one', () => {
    expect(etlJobToJson(newEtlJob('Untitled ETL'))).toEqual({
      display_name: 'Untitled ETL',
      operators: [],
      schedule_time: { class_name: 'none_schedule' },
      extra_data: {},
      config: { map_incremental_config: {} }
    });
  });
});

describe('incrementalKey', () => {
  it.each([
    ['sales_1', 'sales_1'],
    ['sales1', 'sales_1'],
    ['Orders', 'orders']
  ])('keys %s as %s', (tblName, key) => {
    expect(incrementalKey(tblName)).toBe(key);
  });
});

describe('canCancelEtl', () => {
  it.each([
    ['Queued', true],
    ['Running', true],
    ['Syncing', true],
    ['Done', false],
    ['Initialized', false],
    ['Error', false]
  ] as const)('%s → %s', (status, expected) => {
    expect(canCancelEtl(etl({ kind: 'none' }, 0, status))).toBe(expected);
  });
});

describe('hasNextExecution', () => {
  const daily: ScheduleTime = { kind: 'daily', recurEvery: 1, startTime: 0 };

  it('is false without a schedule', () => {
    expect(hasNextExecution(etl({ kind: 'none' }, 1793720125000))).toBe(false);
  });

  it("is false for the server's Long.MaxValue and for 0", () => {
    expect(hasNextExecution(etl(daily, fixture.etlCreate.response.next_execute_time))).toBe(false);
    expect(hasNextExecution(etl(daily, 0))).toBe(false);
  });

  it('is true for a recurring ETL with a date', () => {
    expect(hasNextExecution(etl(daily, 1793720125000, 'Done'))).toBe(true);
  });

  it('is true for a run-once ETL only until it starts', () => {
    const once: ScheduleTime = { kind: 'once', startTime: 1 };

    expect(hasNextExecution(etl(once, 1793720125000, 'Initialized'))).toBe(true);
    expect(hasNextExecution(etl(once, 1793720125000, 'Queued'))).toBe(true);
    expect(hasNextExecution(etl(once, 1793720125000, 'Done'))).toBe(false);
  });
});
