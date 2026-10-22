import { describe, expect, it } from 'vitest';
import { RefreshSchemaHistory } from '@/core/connection/RefreshSchemaHistory';
import { isCurrentRun, isRefreshDone, stageLabel, toRefreshOutcome, toStageItems } from './setupProgress.utils';

type StageJson = { name: string; status: string; progress?: number; total?: number; message?: string };

function history(id: number, status: string, stages: StageJson[] = []) {
  return new RefreshSchemaHistory({ id, status, stages });
}

const statuses = (items: { status: string }[]) => items.map(item => item.status);

describe('isCurrentRun', () => {
  it('is the current run when nothing was there before', () => {
    expect(isCurrentRun(history(1, 'error'), undefined)).toBe(true);
  });

  it('is the previous run when the same finished run is still returned', () => {
    expect(isCurrentRun(history(1, 'error'), history(1, 'error'))).toBe(false);
  });

  it('is the current run once a new run shows up', () => {
    expect(isCurrentRun(history(2, 'running'), history(1, 'error'))).toBe(true);
  });

  it('is the current run when it was already running before starting', () => {
    expect(isCurrentRun(history(1, 'success'), history(1, 'running'))).toBe(true);
  });
});

describe('isRefreshDone', () => {
  it.each([
    ['no history yet', undefined, undefined, false],
    ['the previous run', history(1, 'success'), history(1, 'success'), false],
    ['a running run', history(2, 'running'), history(1, 'success'), false],
    ['a successful run', history(2, 'success'), history(1, 'success'), true],
    ['a failed run', history(2, 'error'), history(1, 'success'), true]
  ])('%s → %s', (_, current, before, expected) => {
    expect(isRefreshDone(current, before)).toBe(expected);
  });
});

describe('stageLabel', () => {
  it.each([
    ['test_connection', 'Connect to your MySQL database.'],
    ['scan_database', 'Fetch MySQL schema into Data Warehouse.'],
    ['completed', 'Finish up.']
  ] as const)('%s', (name, expected) => {
    expect(stageLabel(name, 'MySQL')).toBe(expected);
  });
});

describe('toStageItems', () => {
  it('shows the first step running while the new run has not shown up', () => {
    const items = toStageItems(history(1, 'error'), history(1, 'error'), 'MySQL');

    expect(statuses(items)).toEqual(['running', 'pending', 'pending']);
    expect(items[0]?.label).toBe('Connect to your MySQL database.');
  });

  it('shows the first step running before any history', () => {
    expect(statuses(toStageItems(undefined, undefined, 'MySQL'))).toEqual(['running', 'pending', 'pending']);
  });

  it('follows the reported stages and shows the progress of a running one', () => {
    const run = history(2, 'running', [
      { name: 'test_connection', status: 'success' },
      { name: 'scan_database', status: 'running', progress: 2, total: 5 }
    ]);

    const items = toStageItems(run, undefined, 'MySQL');

    expect(statuses(items)).toEqual(['success', 'running', 'pending']);
    expect(items[1]?.progressText).toBe('2/5');
  });

  it('moves the spinner to the next step between reports', () => {
    const run = history(2, 'running', [{ name: 'test_connection', status: 'success' }]);

    expect(statuses(toStageItems(run, undefined, 'MySQL'))).toEqual(['success', 'running', 'pending']);
  });

  it('has no progress text while the total is unknown', () => {
    const run = history(2, 'running', [{ name: 'scan_database', status: 'running', progress: 0, total: 0 }]);

    expect(toStageItems(run, undefined, 'MySQL')[1]?.progressText).toBeUndefined();
  });

  it('marks a step still reported as running as failed once the run failed', () => {
    const run = history(2, 'error', [
      { name: 'test_connection', status: 'running' },
      { name: 'completed', status: 'error', message: 'boom' }
    ]);

    expect(statuses(toStageItems(run, undefined, 'MySQL'))).toEqual(['error', 'pending', 'error']);
  });

  it('shows every step done after a successful run', () => {
    const run = history(2, 'success', [
      { name: 'test_connection', status: 'success' },
      { name: 'scan_database', status: 'success' },
      { name: 'completed', status: 'success' }
    ]);

    expect(statuses(toStageItems(run, undefined, 'MySQL'))).toEqual(['success', 'success', 'success']);
  });

  it('shows a terminated step as failed', () => {
    const run = history(2, 'terminated', [{ name: 'scan_database', status: 'terminated' }]);

    expect(statuses(toStageItems(run, undefined, 'MySQL'))).toEqual(['pending', 'error', 'pending']);
  });
});

describe('toRefreshOutcome', () => {
  it('is running while the new run has not shown up', () => {
    expect(toRefreshOutcome(history(1, 'error'), history(1, 'error'))).toEqual({ kind: 'running' });
  });

  it.each([
    ['running', { kind: 'running' }],
    ['not_started', { kind: 'running' }],
    ['success', { kind: 'success' }],
    ['terminated', { kind: 'terminated' }]
  ])('%s', (status, expected) => {
    expect(toRefreshOutcome(history(2, status), undefined)).toEqual(expected);
  });

  it('reports the message of the last failed stage', () => {
    const run = history(2, 'error', [
      { name: 'test_connection', status: 'error', message: 'first' },
      { name: 'completed', status: 'error', message: 'not found connection for org 0' }
    ]);

    expect(toRefreshOutcome(run, undefined)).toEqual({ kind: 'error', message: 'not found connection for org 0' });
  });

  it('falls back to a generic message', () => {
    expect(toRefreshOutcome(history(2, 'error'), undefined)).toEqual({
      kind: 'error',
      message: 'Cannot fetch the schema.'
    });
  });
});
