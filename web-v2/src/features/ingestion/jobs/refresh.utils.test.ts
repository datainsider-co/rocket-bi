import { describe, expect, it } from 'vitest';
import {
  DEFAULT_REFRESH_OPTION,
  isAutoRefresh,
  REFRESH_OPTIONS,
  refreshOptionOf,
  toRefetchInterval,
  type RefreshOption
} from './refresh.utils';

const manual: RefreshOption = { key: 'manual', label: 'Manual Refresh', intervalMs: 0 };

describe('REFRESH_OPTIONS', () => {
  it('offers v1 choices in order, defaulting to every 5 seconds', () => {
    expect(REFRESH_OPTIONS.map(option => [option.label, option.intervalMs])).toEqual([
      ['Auto Refresh 5s', 5_000],
      ['Auto Refresh 15s', 15_000],
      ['Auto Refresh 30s', 30_000],
      ['Auto Refresh 1m', 60_000],
      ['Manual Refresh', 0]
    ]);
    expect(DEFAULT_REFRESH_OPTION).toBe(REFRESH_OPTIONS[0]);
  });

  it('has unique keys', () => {
    expect(new Set(REFRESH_OPTIONS.map(option => option.key)).size).toBe(REFRESH_OPTIONS.length);
  });
});

describe('isAutoRefresh', () => {
  it('is on with an interval', () => {
    expect(isAutoRefresh(DEFAULT_REFRESH_OPTION)).toBe(true);
  });

  it('is off for manual refresh', () => {
    expect(isAutoRefresh(manual)).toBe(false);
  });
});

describe('toRefetchInterval', () => {
  it.each(REFRESH_OPTIONS.filter(option => option.intervalMs > 0))('polls every $intervalMs ms for $label', option => {
    expect(toRefetchInterval(option)).toBe(option.intervalMs);
  });

  it.each([0, -1])('does not poll for an interval of %d', intervalMs => {
    expect(toRefetchInterval({ ...manual, intervalMs })).toBe(false);
  });
});

describe('refreshOptionOf', () => {
  it('finds the option of a key', () => {
    expect(refreshOptionOf('30s', DEFAULT_REFRESH_OPTION)).toEqual({
      key: '30s',
      label: 'Auto Refresh 30s',
      intervalMs: 30_000
    });
  });

  it('keeps the current option for an unknown key', () => {
    expect(refreshOptionOf('2m', manual)).toBe(manual);
  });
});
