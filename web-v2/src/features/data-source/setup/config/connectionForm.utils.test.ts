import { describe, expect, it } from 'vitest';
import { ClickhouseConnection } from '@/core/connection/ClickhouseConnection';
import { ConnectionType } from '@/core/connection/ConnectionType';
import { MySqlConnection } from '@/core/connection/MySqlConnection';
import type { ConnectionFormValues } from './connectionForm.utils';
import {
  TEST_SSH_TIMEOUT_MS,
  connectionFormSchema,
  defaultFormValues,
  hasSshTunnel,
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
  it.each([ConnectionType.Clickhouse, ConnectionType.MySql])('starts %s empty', type => {
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
