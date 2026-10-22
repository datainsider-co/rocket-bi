import { describe, expect, it, vi } from 'vitest';
import { notifySessionExpired, subscribeSessionExpired } from './sessionExpired';

describe('sessionExpired', () => {
  it('notifies subscribers until they unsubscribe', () => {
    const listener = vi.fn<() => void>();
    const unsubscribe = subscribeSessionExpired(listener);

    notifySessionExpired();
    unsubscribe();
    notifySessionExpired();

    expect(listener).toHaveBeenCalledTimes(1);
  });
});
