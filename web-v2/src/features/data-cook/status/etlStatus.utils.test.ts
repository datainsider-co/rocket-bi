import { describe, expect, it } from 'vitest';
import type { EtlStatus } from '@/core/data-cook/EtlJob';
import { etlStatusIcon } from './etlStatus.utils';

describe('etlStatusIcon', () => {
  it.each<[EtlStatus, string]>([
    ['Initialized', 'initialized'],
    ['Queued', 'queued'],
    ['Running', 'syncing'],
    ['Syncing', 'syncing'],
    ['Done', 'synced'],
    ['Synced', 'synced'],
    ['Error', 'error'],
    ['Terminated', 'terminated'],
    ['Unknown', 'unknown']
  ])('%s → %s', (status, expected) => {
    expect(etlStatusIcon(status)).toBe(expected);
  });
});
