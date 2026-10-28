import { describe, expect, it } from 'vitest';
import type { JobStatus } from '@/core/ingestion/Job';
import { jobStatusIconUrl } from './jobStatus.utils';

describe('jobStatusIconUrl', () => {
  it.each<[JobStatus, string]>([
    ['Synced', '/ingestion/status/synced.svg'],
    ['Error', '/ingestion/status/error.svg'],
    ['Queued', '/ingestion/status/queued.svg'],
    ['Syncing', '/ingestion/status/syncing.svg'],
    ['Initialized', '/ingestion/status/initialized.svg'],
    ['Killed', '/ingestion/status/terminated.svg'],
    ['Terminated', '/ingestion/status/terminated.svg'],
    ['Compiling', '/ingestion/status/unknown.svg'],
    ['Unknown', '/ingestion/status/unknown.svg']
  ])('%s → %s', (status, expected) => {
    expect(jobStatusIconUrl(status)).toBe(expected);
  });
});
