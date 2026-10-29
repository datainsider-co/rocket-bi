import { describe, expect, it, vi } from 'vitest';
import type { CsvChunkReader } from './csvFile';
import { csvUploadReducer, initialUploadState, type CsvUploadAction, type CsvUploadState } from './csvUpload.utils';
import { runCsvUpload, type CsvChunkDecision, type CsvUploadRun } from './runCsvUpload';

function reader(chunks: string[]): CsvChunkReader {
  let index = 0;
  return { total: chunks.length, next: async () => chunks[index++] ?? '' };
}

/** `send` answers each call with the next reply: a row count, or an Error to throw. */
function setup(chunks: string[], replies: (number | Error)[], decisions: CsvChunkDecision[] = []) {
  const actions: CsvUploadAction[] = [];
  const controller = new AbortController();
  const send = vi.fn<CsvUploadRun['send']>(async () => {
    const reply = replies.shift() ?? 1;
    if (reply instanceof Error) throw reply;
    return reply;
  });
  const decide = vi.fn<CsvUploadRun['decide']>(async () => decisions.shift() ?? 'stop');
  const done = runCsvUpload({ reader: reader(chunks), send, dispatch: action => actions.push(action), decide, signal: controller.signal });
  const state = async (): Promise<CsvUploadState> => {
    await done;
    return actions.reduce(csvUploadReducer, initialUploadState(0));
  };
  return { send, decide, controller, actions, state };
}

describe('runCsvUpload', () => {
  it('sends every chunk in order and adds up the rows', async () => {
    const { send, state } = setup(['a\n', 'b\n'], [2, 3]);

    expect(await state()).toMatchObject({ phase: 'done', total: 2, finished: 2, rowsInserted: 5 });
    expect(send.mock.calls.map(([data]) => data)).toEqual(['a\n', 'b\n']);
  });

  it('sends nothing for a chunk without a complete row', async () => {
    const { send, state } = setup(['', 'a\n'], [4]);

    expect(await state()).toMatchObject({ phase: 'done', finished: 2, rowsInserted: 4 });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('sends a failed chunk again on retry', async () => {
    const { send, state } = setup(['a\n'], [new Error('timeout'), 7], ['retry']);

    expect(await state()).toMatchObject({ phase: 'done', rowsInserted: 7, skipped: [] });
    expect(send).toHaveBeenCalledTimes(2);
  });

  it('goes on after a skipped chunk and keeps why it failed', async () => {
    const { state, decide } = setup(['a\n', 'b\n'], [new Error('bad row'), 3], ['skip']);

    expect(await state()).toMatchObject({ phase: 'done', finished: 2, rowsInserted: 3, skipped: [{ chunk: 1, message: 'bad row' }] });
    expect(decide).toHaveBeenCalledWith({ chunk: 1, message: 'bad row' });
  });

  it('skips the next failures without asking after skip all', async () => {
    const { state, decide } = setup(['a\n', 'b\n', 'c\n'], [new Error('x'), new Error('y'), 1], ['skipAll']);

    expect(await state()).toMatchObject({ phase: 'done', finished: 3, rowsInserted: 1 });
    expect((await state()).skipped.map(failure => failure.chunk)).toEqual([1, 2]);
    expect(decide).toHaveBeenCalledTimes(1);
  });

  it('stops at a failed chunk on stop', async () => {
    const { send, state } = setup(['a\n', 'b\n'], [new Error('x')], ['stop']);

    expect(await state()).toMatchObject({ phase: 'stopped', finished: 0 });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('stops when aborted, without asking about the cancelled request', async () => {
    const actions: CsvUploadAction[] = [];
    const controller = new AbortController();
    const decide = vi.fn<CsvUploadRun['decide']>(async () => 'retry');
    const send = vi.fn<CsvUploadRun['send']>(async () => {
      controller.abort();
      throw new Error('aborted');
    });

    await runCsvUpload({ reader: reader(['a\n', 'b\n']), send, dispatch: action => actions.push(action), decide, signal: controller.signal });

    expect(actions.reduce(csvUploadReducer, initialUploadState(0)).phase).toBe('stopped');
    expect(send).toHaveBeenCalledTimes(1);
    expect(decide).not.toHaveBeenCalled();
  });
});
