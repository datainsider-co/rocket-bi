import { describe, expect, it } from 'vitest';
import { ClickhouseConnection } from '@/core/connection/ClickhouseConnection';
import { ConnectionType } from '@/core/connection/ConnectionType';
import { BigQueryConnection } from '@/core/connection/BigQueryConnection';
import { MySqlConnection } from '@/core/connection/MySqlConnection';
import { PostgreSqlConnection } from '@/core/connection/PostgreSqlConnection';
import { RedshiftConnection } from '@/core/connection/RedshiftConnection';
import { VerticaConnection } from '@/core/connection/VerticaConnection';
import type { ConnectionFormValues } from './connectionForm.utils';
import {
  TEST_SSH_TIMEOUT_MS,
  connectionFormSchema,
  defaultFormValues,
  hasSshTunnel,
  jsonObjectError,
  toConnection,
  toFormValues
} from './connectionForm.utils';

const NO_SSH = { host: '', port: '', username: '', publicKey: '' };

function clickhouseValues(overrides: Partial<ConnectionFormValues> = {}): ConnectionFormValues {
  return {
    ...defaultFormValues(ConnectionType.Clickhouse),
    host: 'clickhouse',
    httpPort: '8123',
    tcpPort: '9000',
    username: 'default',
    ...overrides
  };
}

function mysqlValues(overrides: Partial<ConnectionFormValues> = {}): ConnectionFormValues {
  return { ...defaultFormValues(ConnectionType.MySql), host: 'db', port: '3306', username: 'root', ...overrides };
}

/** Error message per field path, for the values that fail. */
function errorsOf(values: ConnectionFormValues): Record<string, string> {
  const result = connectionFormSchema.safeParse(values);
  if (result.success) return {};
  return Object.fromEntries(result.error.issues.map(issue => [issue.path.join('.'), issue.message]));
}

describe('hasSshTunnel', () => {
  it('is off when host, port and username are blank', () => {
    expect(hasSshTunnel({ host: ' ', port: '', username: '', publicKey: 'key' })).toBe(false);
  });

  it.each([{ host: 'h' }, { port: '22' }, { username: 'u' }])('is on with %j', field => {
    expect(hasSshTunnel({ ...NO_SSH, ...field })).toBe(true);
  });
});

describe('connectionFormSchema', () => {
  it('accepts valid ClickHouse and MySQL values', () => {
    expect(errorsOf(clickhouseValues())).toEqual({});
    expect(errorsOf(mysqlValues())).toEqual({});
  });

  it('requires the ClickHouse fields', () => {
    expect(errorsOf(defaultFormValues(ConnectionType.Clickhouse))).toEqual({
      host: 'Host is required!',
      username: 'Username is required!',
      httpPort: 'HTTP port is required!',
      tcpPort: 'TCP port is required!'
    });
  });

  it('requires the MySQL port, not the ClickHouse ones', () => {
    expect(errorsOf(mysqlValues({ port: '' }))).toEqual({ port: 'Port is required!' });
  });

  it('does not require a password', () => {
    expect(errorsOf(mysqlValues({ password: '' }))).toEqual({});
  });

  it('checks the SSH fields only once the tunnel is used', () => {
    expect(errorsOf(mysqlValues({ ssh: { ...NO_SSH, publicKey: 'k' } }))).toEqual({});
    expect(errorsOf(mysqlValues({ ssh: { ...NO_SSH, host: 'bastion' } }))).toEqual({
      'ssh.port': 'SSH port is required!',
      'ssh.username': 'SSH username is required!',
      'ssh.publicKey': 'Public key is required!'
    });
  });

  it('checks property keys', () => {
    const properties = [
      { key: 'a', value: '1' },
      { key: 'a', value: '2' }
    ];
    expect(errorsOf(mysqlValues({ properties }))).toEqual({ 'properties.1.key': 'This key is already used' });
  });
});

describe('toFormValues', () => {
  it('maps a ClickHouse connection with a tunnel and properties', () => {
    const connection = new ClickhouseConnection({
      host: 'ch',
      http_port: 8123,
      tcp_port: 9000,
      username: 'default',
      password: 'p',
      use_ssl: true,
      cluster_name: 'main',
      tunnel_config: { host: 'b', port: 22, username: 'u', public_key: 'k' },
      properties: { 'ssl.mode': 'strict' }
    });

    expect(toFormValues(connection)).toEqual({
      type: 'clickhouse_connection',
      host: 'ch',
      port: '',
      httpPort: '8123',
      tcpPort: '9000',
      clusterName: 'main',
      useSsl: true,
      username: 'default',
      password: 'p',
      database: '',
      catalog: '',
      isLoadBalance: false,
      projectId: '',
      credentials: '',
      location: '',
      ssh: { host: 'b', port: '22', username: 'u', publicKey: 'k' },
      properties: [{ key: 'ssl.mode', value: 'strict' }]
    });
  });

  it('maps a MySQL connection and leaves the ClickHouse fields empty', () => {
    const values = toFormValues(new MySqlConnection({ host: 'db', port: 3306 }));

    expect(values).toMatchObject({ type: 'mysql_connection', port: '3306', httpPort: '', tcpPort: '', useSsl: false });
    expect(values.ssh).toEqual(NO_SSH);
  });
});

describe('defaultFormValues', () => {
  it.each(Object.values(ConnectionType))('starts %s empty', type => {
    expect(defaultFormValues(type)).toMatchObject({ type, host: '', port: '', httpPort: '', properties: [] });
  });
});

describe('toConnection', () => {
  it('builds a ClickHouse connection, trimming everything but the password', () => {
    const connection = toConnection(
      clickhouseValues({ host: ' ch ', username: ' default ', password: ' p ', clusterName: ' ', useSsl: true })
    );

    expect(connection).toBeInstanceOf(ClickhouseConnection);
    expect(connection).toMatchObject({
      host: 'ch',
      username: 'default',
      password: ' p ',
      httpPort: 8123,
      tcpPort: 9000,
      clusterName: '',
      useSsl: true,
      tunnelConfig: undefined
    });
  });

  it('builds a MySQL connection with properties', () => {
    const connection = toConnection(mysqlValues({ properties: [{ key: ' useSSL ', value: 'false' }] }));

    expect(connection).toBeInstanceOf(MySqlConnection);
    expect(connection).toMatchObject({ host: 'db', port: 3306, properties: { useSSL: 'false' } });
  });

  it('adds the tunnel when it is used, with the given timeout', () => {
    const ssh = { host: ' b ', port: '22', username: 'u', publicKey: 'k' };

    expect(toConnection(mysqlValues({ ssh })).tunnelConfig).toMatchObject({
      host: 'b',
      port: 22,
      username: 'u',
      publicKey: 'k',
      timeoutMs: 60_000
    });
    expect(toConnection(mysqlValues({ ssh }), TEST_SSH_TIMEOUT_MS).tunnelConfig?.timeoutMs).toBe(30_000);
  });

  it('round-trips through toFormValues', () => {
    const values = clickhouseValues({ clusterName: 'main', ssh: { host: 'b', port: '22', username: 'u', publicKey: 'k' } });

    expect(toFormValues(toConnection(values))).toEqual(values);
  });

  it('does not mutate the values', () => {
    const values = mysqlValues({ properties: [{ key: 'a', value: '1' }] });
    const copy = structuredClone(values);

    toConnection(values);

    expect(values).toEqual(copy);
  });
});

const SSH = { host: 'b', port: '22', username: 'u', publicKey: 'k' };
const CREDENTIALS = '{"project_id": "p"}';

function jdbcValues(type: ConnectionType, overrides: Partial<ConnectionFormValues> = {}): ConnectionFormValues {
  return { ...defaultFormValues(type), host: 'db', port: '5432', username: 'u', ...overrides };
}

describe('jsonObjectError', () => {
  it.each([
    ['', 'Credentials is required!'],
    ['  ', 'Credentials is required!'],
    ['{', 'Credentials must be valid JSON'],
    ['[]', 'Credentials must be a JSON object'],
    ['null', 'Credentials must be a JSON object'],
    ['"text"', 'Credentials must be a JSON object']
  ])('%j → %s', (text, message) => {
    expect(jsonObjectError(text, 'Credentials')).toBe(message);
  });

  it('accepts an object', () => {
    expect(jsonObjectError(CREDENTIALS, 'Credentials')).toBeUndefined();
  });
});

describe('connectionFormSchema, the OS4 types', () => {
  it.each([ConnectionType.PostgreSql, ConnectionType.Redshift])('requires the %s database', type => {
    expect(errorsOf(jdbcValues(type))).toEqual({ database: 'Database is required!' });
    expect(errorsOf(jdbcValues(type, { database: 'd' }))).toEqual({});
  });

  it('requires Vertica host, port and username, not the catalog', () => {
    expect(errorsOf(jdbcValues(ConnectionType.Vertica))).toEqual({});
    expect(errorsOf(jdbcValues(ConnectionType.Vertica, { host: '', port: '', username: '' }))).toEqual({
      host: 'Host is required!',
      port: 'Port is required!',
      username: 'Username is required!'
    });
  });

  it('requires the BigQuery fields and nothing else', () => {
    expect(errorsOf(defaultFormValues(ConnectionType.BigQuery))).toEqual({
      credentials: 'Credentials is required!',
      projectId: 'Project ID is required!',
      location: 'Location is required!'
    });
    expect(
      errorsOf({ ...defaultFormValues(ConnectionType.BigQuery), credentials: CREDENTIALS, projectId: 'p', location: 'US' })
    ).toEqual({});
  });

  it('ignores a half-filled tunnel on PostgreSQL, which has none', () => {
    expect(errorsOf(jdbcValues(ConnectionType.PostgreSql, { database: 'd', ssh: { ...NO_SSH, host: 'b' } }))).toEqual({});
  });
});

describe('toFormValues and toConnection, the OS4 types', () => {
  it('maps PostgreSQL without a tunnel', () => {
    const connection = toConnection(jdbcValues(ConnectionType.PostgreSql, { database: ' d ', ssh: SSH }));

    expect(connection).toBeInstanceOf(PostgreSqlConnection);
    expect(connection).toMatchObject({ host: 'db', port: 5432, database: 'd', tunnelConfig: undefined });
  });

  it('maps Redshift with its tunnel', () => {
    const connection = toConnection(jdbcValues(ConnectionType.Redshift, { database: 'd', ssh: SSH }));

    expect(connection).toBeInstanceOf(RedshiftConnection);
    expect(connection.tunnelConfig).toMatchObject({ host: 'b', port: 22 });
  });

  it('maps Vertica catalog and load balancing', () => {
    const connection = toConnection(jdbcValues(ConnectionType.Vertica, { catalog: ' c ', isLoadBalance: true }));

    expect(connection).toBeInstanceOf(VerticaConnection);
    expect(connection).toMatchObject({ catalog: 'c', isLoadBalance: true });
  });

  it('maps BigQuery and drops the properties it has none of', () => {
    const connection = toConnection({
      ...defaultFormValues(ConnectionType.BigQuery),
      projectId: ' p ',
      credentials: CREDENTIALS,
      location: 'asia-east1',
      properties: [{ key: 'a', value: '1' }]
    });

    expect(connection).toBeInstanceOf(BigQueryConnection);
    expect(connection).toMatchObject({ projectId: 'p', credentials: CREDENTIALS, location: 'asia-east1', properties: {} });
  });

  it.each([
    jdbcValues(ConnectionType.PostgreSql, { database: 'd' }),
    jdbcValues(ConnectionType.Redshift, { database: 'd', ssh: SSH }),
    jdbcValues(ConnectionType.Vertica, { catalog: 'c', isLoadBalance: true, properties: [{ key: 'k', value: 'v' }] }),
    { ...defaultFormValues(ConnectionType.BigQuery), projectId: 'p', credentials: CREDENTIALS, location: 'US' }
  ])('round-trips $type', formValues => {
    expect(toFormValues(toConnection(formValues))).toEqual(formValues);
  });
});
