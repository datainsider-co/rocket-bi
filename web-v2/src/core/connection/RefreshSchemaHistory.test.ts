import { describe, expect, it } from 'vitest';
import { RefreshSchemaHistory } from './RefreshSchemaHistory';

describe('RefreshSchemaHistory', () => {
  it('parses the server response', () => {
    // Real response from the local backend after a refresh without a connection.
    const history = new RefreshSchemaHistory({
      org_id: 0,
      id: 3,
      is_first_run: false,
      status: 'error',
      stages: [
        {
          org_id: 0,
          name: 'completed',
          progress: 0,
          total: 0,
          status: 'error',
          message: 'not found connection for org 0',
          stages: [],
          created_time: 1792682271660
        }
      ],
      created_time: 1792682271656,
      updated_time: 1792682271660
    });

    expect(history).toMatchObject({ id: 3, isFirstRun: false, isError: true, isRunning: false, isSuccess: false });
    expect(history.stages[0]).toMatchObject({
      name: 'completed',
      status: 'error',
      message: 'not found connection for org 0',
      createdTime: 1792682271660
    });
  });

  it('defaults to no history', () => {
    expect(new RefreshSchemaHistory()).toMatchObject({ id: -1, status: '', stages: [] });
  });

  it.each([
    ['running', 'isRunning'],
    ['error', 'isError'],
    ['success', 'isSuccess']
  ] as const)('%s sets %s', (status, flag) => {
    expect(new RefreshSchemaHistory({ status })[flag]).toBe(true);
  });
});
