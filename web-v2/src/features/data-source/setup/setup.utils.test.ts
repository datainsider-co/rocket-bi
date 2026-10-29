import { describe, expect, it } from 'vitest';
import { MySqlConnection } from '@/core/connection/MySqlConnection';
import { RefreshSchemaHistory } from '@/core/connection/RefreshSchemaHistory';
import { HIDDEN, toInitialSetupState } from './setup.utils';

const connection = new MySqlConnection({ host: 'db' });

function history(status: string, isFirstRun = true) {
  return new RefreshSchemaHistory({ id: 1, status, is_first_run: isFirstRun });
}

describe('toInitialSetupState', () => {
  it('stays hidden without permission, even with no connection', () => {
    expect(toInitialSetupState({ isPermitted: false, exists: false })).toEqual(HIDDEN);
  });

  it('asks for a type when there is no connection', () => {
    expect(toInitialSetupState({ isPermitted: true, exists: false })).toEqual({ step: 'select' });
  });

  it('opens the form when the first refresh failed', () => {
    expect(toInitialSetupState({ isPermitted: true, exists: true, connection, history: history('error') })).toEqual({
      step: 'config',
      connection
    });
  });

  it('asks for a type when the first refresh failed on a type v2 cannot edit', () => {
    expect(toInitialSetupState({ isPermitted: true, exists: true, history: history('error') })).toEqual({
      step: 'select'
    });
  });

  it('shows the progress while the first refresh runs', () => {
    expect(toInitialSetupState({ isPermitted: true, exists: true, connection, history: history('running') })).toEqual(
      { step: 'progress', connection }
    );
  });

  it('stays hidden while the first refresh of an unsupported type runs', () => {
    expect(toInitialSetupState({ isPermitted: true, exists: true, history: history('running') })).toEqual(HIDDEN);
  });

  it.each(['success', 'terminated', 'not_started'])('stays hidden when the first refresh is %s', status => {
    expect(toInitialSetupState({ isPermitted: true, exists: true, connection, history: history(status) })).toEqual(
      HIDDEN
    );
  });

  it.each(['error', 'running'])('stays hidden when a later refresh is %s', status => {
    expect(
      toInitialSetupState({ isPermitted: true, exists: true, connection, history: history(status, false) })
    ).toEqual(HIDDEN);
  });

  it('stays hidden when the history is unknown', () => {
    expect(toInitialSetupState({ isPermitted: true, exists: true, connection })).toEqual(HIDDEN);
  });
});

