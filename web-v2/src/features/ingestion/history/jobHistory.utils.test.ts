import { describe, expect, it } from 'vitest';
import {
  DEFAULT_HISTORY_SORT,
  formatDuration,
  formatHistoryMessage,
  formatRowCount,
  historyContent,
  toHistorySortField
} from './jobHistory.utils';

describe('DEFAULT_HISTORY_SORT', () => {
  it('is the latest run first, as v1', () => {
    expect(DEFAULT_HISTORY_SORT).toEqual({ field: 'id', order: 'DESC' });
  });
});

describe('toHistorySortField', () => {
  it.each(['id', 'job_name', 'last_sync_time', 'total_sync_time', 'sync_status', 'total_inserted_rows'])(
    'accepts the column %s',
    key => {
      expect(toHistorySortField(key)).toBe(key);
    }
  );

  it.each(['message', 'totalSyncedTime', 'total_synced_time', 'total_rows_inserted', '', undefined, null, 1])(
    'rejects %j, which the server cannot sort by',
    key => {
      expect(toHistorySortField(key)).toBeUndefined();
    }
  );
});

describe('formatDuration', () => {
  it.each([
    [0, '0ms'],
    [391, '391ms'],
    [999.9, '999ms'],
    [1000, '1s'],
    [45_500, '45s'],
    [125_000, '2m 5s'],
    [3_603_000, '1h 0m 3s'],
    [90_061_000, '25h 1m 1s']
  ])('%d ms → %s', (millis, expected) => {
    expect(formatDuration(millis)).toBe(expected);
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])('shows -- for %d', millis => {
    expect(formatDuration(millis)).toBe('--');
  });
});

describe('formatRowCount', () => {
  it.each([
    [0, '0'],
    [200, '200'],
    [1_234_567, '1,234,567'],
    [-5, '-5']
  ])('%d → %s', (rows, expected) => {
    expect(formatRowCount(rows)).toBe(expected);
  });

  it('shows -- for a non-finite count', () => {
    expect(formatRowCount(Number.NaN)).toBe('--');
  });
});

describe('formatHistoryMessage', () => {
  it('keeps an error message', () => {
    expect(formatHistoryMessage('Table not found')).toBe('Table not found');
  });

  it.each(['', '  '])('shows -- for %j', message => {
    expect(formatHistoryMessage(message)).toBe('--');
  });
});

describe('historyContent', () => {
  const loaded = { error: null, rowCount: 2, isLoaded: true, keyword: '' };

  it('shows the table with rows', () => {
    expect(historyContent(loaded)).toEqual({ kind: 'table' });
  });

  it('shows the table, loading, before the first page arrives', () => {
    expect(historyContent({ ...loaded, rowCount: 0, isLoaded: false })).toEqual({ kind: 'table' });
  });

  it('shows the error, even over rows', () => {
    expect(historyContent({ ...loaded, error: new Error('boom') })).toEqual({ kind: 'error', message: 'boom' });
  });

  it('falls back to a generic message for an error without one', () => {
    expect(historyContent({ ...loaded, error: new Error('') })).toEqual({
      kind: 'error',
      message: 'Could not load the job history'
    });
  });

  it('is empty without rows', () => {
    expect(historyContent({ ...loaded, rowCount: 0 })).toEqual({ kind: 'empty', isSearching: false });
  });

  it.each([
    ['sales', true],
    ['  ', false]
  ])('is empty with keyword %j → searching %s', (keyword, isSearching) => {
    expect(historyContent({ ...loaded, rowCount: 0, keyword })).toEqual({ kind: 'empty', isSearching });
  });
});
