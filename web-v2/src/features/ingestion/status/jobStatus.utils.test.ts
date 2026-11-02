import { describe, expect, it } from 'vitest';
import type { JobStatus } from '@/core/ingestion/Job';
import { jobStatusIcon } from './jobStatus.utils';

describe('jobStatusIcon', () => {
  it.each<[JobStatus, string]>([
    ['Synced', 'synced'],
    ['Error', 'error'],
    ['Queued', 'queued'],
    ['Syncing', 'syncing'],
    ['Initialized', 'initialized'],
    ['Killed', 'terminated'],
    ['Terminated', 'terminated'],
    ['Compiling', 'unknown'],
    ['Unknown', 'unknown']
  ])('%s → %s', (status, expected) => {
    expect(jobStatusIcon(status)).toBe(expected);
  });
});
