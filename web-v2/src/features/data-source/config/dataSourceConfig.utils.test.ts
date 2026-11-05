import { describe, expect, it } from 'vitest';
import { BigQueryConnection } from '@/core/connection/BigQueryConnection';
import { ClickhouseConnection } from '@/core/connection/ClickhouseConnection';
import { MySqlConnection } from '@/core/connection/MySqlConnection';
import { PostgreSqlConnection } from '@/core/connection/PostgreSqlConnection';
import { RedshiftConnection } from '@/core/connection/RedshiftConnection';
import { RefreshSchemaHistory } from '@/core/connection/RefreshSchemaHistory';
import { VerticaConnection } from '@/core/connection/VerticaConnection';
import {
  REFRESH_POLL_MS,
  connectionRows,
  refreshPollInterval,
  toConfigBody,
  toRefreshStatusView
} from './dataSourceConfig.utils';

const mysql = new MySqlConnection({ host: 'db', port: 3306, username: 'root' });

describe('toConfigBody', () => {
  it.each([
    [{ isPending: false, isError: true, exists: true, connection: mysql }, 'error'],
    [{ isPending: true, isError: false, exists: undefined, connection: undefined }, 'loading'],
    [{ isPending: false, isError: false, exists: undefined, connection: undefined }, 'loading'],
    [{ isPending: false, isError: false, exists: false, connection: undefined }, 'empty'],
    [{ isPending: false, isError: false, exists: true, connection: undefined }, 'unknown'],
    [{ isPending: false, isError: false, exists: true, connection: mysql }, 'connection']
  ] as const)('%j → %s', (queries, body) => {
    expect(toConfigBody(queries)).toBe(body);
  });
});

describe('connectionRows', () => {
  it('lists ClickHouse host, username and both ports', () => {
    const connection = new ClickhouseConnection({ host: 'ch', username: 'default', http_port: 8123, tcp_port: 9000 });

    expect(connectionRows(connection)).toEqual([
      { label: 'Host', value: 'ch' },
      { label: 'Username', value: 'default' },
      { label: 'HTTP Port', value: '8123' },
      { label: 'TCP Port', value: '9000' }
    ]);
  });

  it('lists MySQL host, port and username', () => {
    expect(connectionRows(mysql)).toEqual([
      { label: 'Host', value: 'db' },
      { label: 'Port', value: '3306' },
      { label: 'Username', value: 'root' }
    ]);
  });

  it.each([PostgreSqlConnection, RedshiftConnection])('adds the database of %o', Type => {
    expect(connectionRows(new Type({ host: 'h', port: 1, username: 'u', database: 'd' })).at(-1)).toEqual({
      label: 'Database',
      value: 'd'
    });
  });

  it('adds the Vertica catalog, -- when empty', () => {
    expect(connectionRows(new VerticaConnection({ host: 'h' })).at(-1)).toEqual({ label: 'Catalog', value: '--' });
  });

  it('shows BigQuery project and location label', () => {
    expect(connectionRows(new BigQueryConnection({ project_id: 'p', location: 'asia-east1' }))).toEqual([
      { label: 'Project ID', value: 'p' },
      { label: 'Location', value: 'asia-east1 (Taiwan)' }
    ]);
  });

  it('shows -- for empty values and missing ports', () => {
    expect(connectionRows(new MySqlConnection())).toEqual([
      { label: 'Host', value: '--' },
      { label: 'Port', value: '--' },
      { label: 'Username', value: '--' }
    ]);
    expect(connectionRows(new BigQueryConnection()).at(-1)).toEqual({ label: 'Location', value: '--' });
  });
});

describe('toRefreshStatusView', () => {
  it('reads no history as Not Started', () => {
    expect(toRefreshStatusView(undefined)).toEqual({ label: 'Not Started', icon: 'initialized' });
  });

  it.each([
    ['not_started', 'Not Started', 'initialized'],
    ['running', 'Running', 'syncing'],
    ['success', 'Synced', 'synced'],
    ['terminated', 'Terminated', 'terminated'],
    ['weird', 'Unknown', 'unknown']
  ])('%s → %s', (status, label, icon) => {
    expect(toRefreshStatusView(new RefreshSchemaHistory({ status }))).toEqual({ label, icon });
  });

  it('gives the message of the failed stage', () => {
    const history = new RefreshSchemaHistory({
      status: 'error',
      stages: [
        { name: 'test_connection', status: 'success', message: '' },
        { name: 'scan_database', status: 'error', message: 'Access denied' }
      ]
    });

    expect(toRefreshStatusView(history)).toEqual({ label: 'Error', icon: 'error', error: 'Access denied' });
  });

  it('has no message when no stage says why', () => {
    expect(toRefreshStatusView(new RefreshSchemaHistory({ status: 'error', stages: [] })).error).toBeUndefined();
  });
});

describe('refreshPollInterval', () => {
  it('polls while running only', () => {
    expect(refreshPollInterval(new RefreshSchemaHistory({ status: 'running' }))).toBe(REFRESH_POLL_MS);
    expect(refreshPollInterval(new RefreshSchemaHistory({ status: 'success' }))).toBe(false);
    expect(refreshPollInterval(undefined)).toBe(false);
  });
});
