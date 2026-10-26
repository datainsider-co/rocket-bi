import { describe, expect, it } from 'vitest';
import { createConcurrencyLimit } from './concurrencyLimit';

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(r => (resolve = r));
  return { promise, resolve };
}

describe('createConcurrencyLimit', () => {
  it('runs at most max tasks at once, then the next in order', async () => {
    const run = createConcurrencyLimit(2);
    const gates = [deferred(), deferred(), deferred()];
    const started: number[] = [];
    const results = gates.map((gate, index) =>
      run(async () => {
        started.push(index);
        await gate.promise;
        return index;
      })
    );

    await Promise.resolve();
    expect(started).toEqual([0, 1]);

    gates[1]!.resolve();
    await results[1];
    await Promise.resolve();
    expect(started).toEqual([0, 1, 2]);

    gates[0]!.resolve();
    gates[2]!.resolve();
    expect(await Promise.all(results)).toEqual([0, 1, 2]);
  });

  it('frees the slot when a task fails', async () => {
    const run = createConcurrencyLimit(1);
    await expect(run(async () => Promise.reject(new Error('boom')))).rejects.toThrow('boom');
    expect(await run(async () => 'next')).toBe('next');
  });
});
