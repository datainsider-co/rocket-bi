import { describe, expect, it } from 'vitest';
import fixture from './ingestion.fixture.json';
import { jobHistoryFromJson } from './JobHistory';

describe('jobHistoryFromJson', () => {
  it('reads a history/list row', () => {
    expect(jobHistoryFromJson(fixture.historyList.response.data[0])).toEqual({
      syncId: 2,
      jobId: 1,
      jobName: 'DI0 sales',
      lastSyncTime: 1793208071771,
      totalSyncedTime: 391,
      syncStatus: 'Synced',
      totalRowsInserted: 200,
      message: ''
    });
  });

  it('reads an unknown status as Unknown and defaults missing fields', () => {
    expect(jobHistoryFromJson({ sync_status: 'Paused' })).toEqual({
      syncId: 0,
      jobId: 0,
      jobName: '',
      lastSyncTime: 0,
      totalSyncedTime: 0,
      syncStatus: 'Unknown',
      totalRowsInserted: 0,
      message: ''
    });
  });
});
