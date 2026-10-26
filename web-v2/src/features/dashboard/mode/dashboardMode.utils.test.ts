import { describe, expect, it } from 'vitest';
import { fitScale, refreshIntervalOf } from './dashboardMode.utils';

describe('fitScale', () => {
  it('shrinks a dashboard taller than the screen', () => {
    expect(fitScale(2000, 1000)).toBe(0.5);
  });

  it('leaves one that fits, or is not measured yet', () => {
    expect(fitScale(800, 1000)).toBe(1);
    expect(fitScale(0, 1000)).toBe(1);
    expect(fitScale(1000, 0)).toBe(1);
  });
});

describe('refreshIntervalOf', () => {
  it('is the interval while auto refresh is on', () => {
    expect(refreshIntervalOf({ isAutoRefresh: true, refreshIntervalMs: 15_000 })).toBe(15_000);
  });

  it('is undefined when off or not positive', () => {
    expect(refreshIntervalOf({ isAutoRefresh: false, refreshIntervalMs: 15_000 })).toBeUndefined();
    expect(refreshIntervalOf({ isAutoRefresh: true, refreshIntervalMs: 0 })).toBeUndefined();
  });
});
