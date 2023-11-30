import { Log } from '@core/utils';

export class RecurringMethodExecutor {
  fn: () => Promise<any>;
  intervalMs = 1000;
  intervalId: number | null = null;

  constructor(fn: () => Promise<any>) {
    this.fn = fn;
  }

  start(intervalMs: number): void {
    Log.info('RecurringMethodExecutor.start', { intervalMs });
    if (this.intervalId === null) {
      this.intervalMs = intervalMs;
      this.executeRecurring();
    }
  }

  stop(): void {
    Log.info('RecurringMethodExecutor.stop');
    if (this.intervalId) {
      clearTimeout(this.intervalId);
    }
    this.intervalId = null;
  }

  protected executeRecurring(): void {
    this.intervalId = setTimeout(() => {
      Log.info('RecurringMethodExecutor::executeRecurring');
      this.fn().finally(() => {
        this.executeRecurring();
        Log.info('RecurringMethodExecutor::executeRecurring completed, next execution in ' + this.intervalMs + 'ms');
      });
    }, this.intervalMs);
  }
}
