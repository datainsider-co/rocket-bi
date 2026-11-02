import { describe, expect, it } from 'vitest';
import fixture from '@/core/data-cook/etl.fixture.json';
import {
  DEFAULT_ETL_HISTORY_SORT,
  emptyHistoryText,
  logLines,
  logSummary,
  toEtlHistorySortField
} from './etlHistory.utils';

const LOG =
  'execute ELT DC0 probe \n+ process RootOperator(0) success, result RootOperatorResult(0) \nexecute failure, No database selected';

describe('DEFAULT_ETL_HISTORY_SORT', () => {
  it('is the latest run first, as v1', () => {
    expect(DEFAULT_ETL_HISTORY_SORT).toEqual({ field: 'id', order: 'DESC' });
  });
});

describe('toEtlHistorySortField', () => {
  it.each(['id', 'updated_time', 'total_execution_time', 'status'])('accepts %s', key => {
    expect(toEtlHistorySortField(key)).toBe(key);
  });

  it.each(['name', 'updatedTime', 'etl_name', '', undefined, null, 1])('rejects %j', key => {
    expect(toEtlHistorySortField(key)).toBeUndefined();
  });
});

describe('logLines', () => {
  it('splits the log, trimming line ends and dropping blank lines', () => {
    expect(logLines('a \n\n  \n+ b  \n')).toEqual(['a', '+ b']);
  });

  it('is empty for an empty log', () => {
    expect(logLines('')).toEqual([]);
  });
});

describe('logSummary', () => {
  it('is how the run ended', () => {
    expect(logSummary(LOG)).toBe('execute failure, No database selected');
  });

  it('reads a log of the fixture', () => {
    const [run] = fixture.history.response.data;
    expect(logSummary(run!.message)).not.toBe('--');
  });

  it.each(['', ' \n '])('is -- for %j', message => {
    expect(logSummary(message)).toBe('--');
  });
});

describe('emptyHistoryText', () => {
  it('says the search matched nothing', () => {
    expect(emptyHistoryText(' sales ')).toBe('No ETL run matches "sales"');
  });

  it('says there is no run yet', () => {
    expect(emptyHistoryText('')).toBe("You don't have any ETL History yet");
  });
});
