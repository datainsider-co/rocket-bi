/**
 * Runs at most `max` tasks at a time, the rest wait in call order (v1 `DashboardControllerStore`'s semaphore of 7,
 * so a big dashboard doesn't flood the query server).
 */
export function createConcurrencyLimit(max: number) {
  let running = 0;
  const waiting: (() => void)[] = [];

  const release = () => {
    running--;
    waiting.shift()?.();
  };

  return async function run<T>(task: () => Promise<T>): Promise<T> {
    if (running >= max) await new Promise<void>(resolve => waiting.push(resolve));
    running++;
    try {
      return await task();
    } finally {
      release();
    }
  };
}
