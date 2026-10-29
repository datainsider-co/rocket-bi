import { describe, expect, it } from 'vitest';
import {
  csvUploadReducer,
  initialUploadState,
  isUploadRunning,
  uploadPercent,
  uploadSummary,
  type CsvUploadAction,
  type CsvUploadState
} from './csvUpload.utils';

function run(...actions: CsvUploadAction[]): CsvUploadState {
  return actions.reduce(csvUploadReducer, initialUploadState(0));
}

const failure = { chunk: 2, message: 'timeout' };

describe('csvUploadReducer', () => {
  it('starts with the number of chunks', () => {
    expect(run({ type: 'started', total: 3 })).toEqual(initialUploadState(3));
  });

  it('adds up the chunks sent and the rows inserted', () => {
    const state = run({ type: 'started', total: 3 }, { type: 'chunkSent', rows: 10 }, { type: 'chunkSent', rows: 5 });
    expect(state).toMatchObject({ phase: 'uploading', finished: 2, rowsInserted: 15 });
  });

  it('waits on a failed chunk', () => {
    const state = run({ type: 'started', total: 3 }, { type: 'chunkFailed', failure });
    expect(state).toMatchObject({ phase: 'failed', finished: 0, failure });
  });

  it('goes on uploading on a retry', () => {
    const state = run({ type: 'started', total: 3 }, { type: 'chunkFailed', failure }, { type: 'chunkRetried' });
    expect(state).toMatchObject({ phase: 'uploading', finished: 0, failure: undefined });
  });

  it('counts a skipped chunk as finished and keeps why it failed', () => {
    const state = run({ type: 'started', total: 3 }, { type: 'chunkFailed', failure }, { type: 'chunkSkipped', failure });
    expect(state).toMatchObject({ phase: 'uploading', finished: 1, skipped: [failure], failure: undefined });
  });

  it.each([
    [false, 'done'],
    [true, 'stopped']
  ] as const)('ends with stopped = %s as %s', (stopped, phase) => {
    expect(run({ type: 'started', total: 1 }, { type: 'chunkFailed', failure }, { type: 'ended', stopped })).toMatchObject({
      phase,
      failure: undefined
    });
  });

  it('keeps why it ended early', () => {
    expect(run({ type: 'started', total: 1 }, { type: 'ended', stopped: true, error: 'unreadable' })).toMatchObject({
      phase: 'stopped',
      error: 'unreadable'
    });
  });

  it('does not change the state it is given', () => {
    const state = initialUploadState(2);
    csvUploadReducer(state, { type: 'chunkSkipped', failure });
    expect(state).toEqual(initialUploadState(2));
  });
});

describe('uploadPercent', () => {
  it.each([
    [0, 0, 0],
    [0, 3, 0],
    [1, 3, 33],
    [3, 3, 100]
  ])('is %i of %i chunks as %i%%', (finished, total, percent) => {
    expect(uploadPercent({ finished, total })).toBe(percent);
  });
});

describe('isUploadRunning', () => {
  it.each([
    ['uploading', true],
    ['failed', true],
    ['stopped', false],
    ['done', false]
  ] as const)('is %s → %s', (phase, running) => {
    expect(isUploadRunning(phase)).toBe(running);
  });
});

describe('uploadSummary', () => {
  const done: CsvUploadState = { ...initialUploadState(4), phase: 'done', finished: 4, rowsInserted: 12345 };

  it('says how many rows went where', () => {
    expect(uploadSummary(done, 'sales.orders')).toBe('Imported 12,345 rows into sales.orders.');
  });

  it('uses the singular for one row', () => {
    expect(uploadSummary({ ...done, rowsInserted: 1 }, 't')).toBe('Imported 1 row into t.');
  });

  it('counts the skipped chunks', () => {
    expect(uploadSummary({ ...done, skipped: [failure] }, 't')).toBe('Imported 12,345 rows into t. 1 of 4 chunks were skipped.');
  });

  it('says when it was stopped', () => {
    expect(uploadSummary({ ...done, phase: 'stopped', rowsInserted: 0 }, 't')).toBe('Stopped after importing 0 rows into t.');
  });
});
