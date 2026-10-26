import { describe, expect, it } from 'vitest';
import { dashboardPath, embeddedDashboardPath, parseIdParam, toIdParam, toSlug } from './idParam';

describe('toSlug', () => {
  it.each([
    ['Sales Report', 'sales-report'],
    ['Báo cáo Đầu tư Q1', 'bao-cao-dau-tu-q1'],
    ['  --a__b!!c--  ', 'a-b-c'],
    ['', ''],
    ['!!!', '']
  ])('%j → %j', (name, expected) => {
    expect(toSlug(name)).toBe(expected);
  });
});

describe('toIdParam / parseIdParam', () => {
  it('builds <slug>-<id>', () => {
    expect(toIdParam(12, 'My Folder')).toBe('my-folder-12');
  });

  it('builds -<id> for an empty name, like v1', () => {
    expect(toIdParam(5, '')).toBe('-5');
  });

  it.each([
    ['my-folder-12', 12],
    ['-5', 5],
    ['7', 7],
    ['folder-2024-9', 9]
  ])('parses %j → %d', (param, expected) => {
    expect(parseIdParam(param)).toBe(expected);
  });

  it.each([[undefined], [''], ['folder'], ['folder-'], ['folder-1a']])('rejects %j', param => {
    expect(parseIdParam(param)).toBeUndefined();
  });

  it('round-trips', () => {
    expect(parseIdParam(toIdParam(42, 'Báo cáo 2025'))).toBe(42);
  });
});

describe('dashboardPath', () => {
  it('builds /dashboard/<slug>-<id>', () => {
    expect(dashboardPath(9, 'KPI')).toBe('/dashboard/kpi-9');
  });
});

describe('embeddedDashboardPath', () => {
  it('builds v1 embedded URLs', () => {
    expect(embeddedDashboardPath(9, 'KPI')).toBe('/embedded/dashboard/kpi-9');
  });
});
