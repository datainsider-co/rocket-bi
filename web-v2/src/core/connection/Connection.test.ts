import { describe, expect, it } from 'vitest';
import { ClickhouseConnection } from './ClickhouseConnection';
import { createConnection, parseConnection } from './Connection';
import { ConnectionType, isConnectionType } from './ConnectionType';
import { MySqlConnection } from './MySqlConnection';
import { SshConfig } from './SshConfig';

/** Shape of `GET connection` from the local backend. */
const CLICKHOUSE_JSON = {
  class_name: 'clickhouse_connection',
  org_id: 0,
  host: 'clickhouse',
  username: 'default',
  password: 'secret',
  http_port: 8123,
  tcp_port: 9000,
  use_ssl: true,
  cluster_name: 'main',
  tunnel_config: { host: 'bastion', port: 22, username: 'ubuntu', public_key: 'ssh-rsa AAA', timeout_ms: 60000 },
  properties: { socket_timeout: '1000', 'ssl.mode': 'strict' },
  created_by: 'root',
  updated_by: 'root',
  created_at: 1,
  updated_at: 2
};

describe('parseConnection', () => {
  it('parses a ClickHouse connection with snake_case fields', () => {
    const connection = parseConnection(CLICKHOUSE_JSON);

    expect(connection).toBeInstanceOf(ClickhouseConnection);
    expect(connection).toMatchObject({
      host: 'clickhouse',
      httpPort: 8123,
      tcpPort: 9000,
      useSsl: true,
      clusterName: 'main',
      createdBy: 'root',
      updatedAt: 2
    });
    expect(connection?.tunnelConfig).toMatchObject({ host: 'bastion', port: 22, publicKey: 'ssh-rsa AAA' });
  });

  it('keeps property keys exactly as sent, dots and underscores included', () => {
    expect(parseConnection(CLICKHOUSE_JSON)?.properties).toEqual({ socket_timeout: '1000', 'ssl.mode': 'strict' });
  });

  it('parses a MySQL connection', () => {
    const connection = parseConnection({ class_name: 'mysql_connection', host: 'db', port: 3306, username: 'root' });

    expect(connection).toBeInstanceOf(MySqlConnection);
    expect(connection).toMatchObject({ host: 'db', port: 3306, username: 'root', password: '', properties: {} });
    expect(connection?.tunnelConfig).toBeUndefined();
  });

  it.each([{ class_name: 'bigquery_connection' }, {}, null, undefined, 'clickhouse_connection'])(
    'returns undefined for %j',
    json => {
      expect(parseConnection(json)).toBeUndefined();
    }
  );

  it('drops non-string property values', () => {
    const connection = parseConnection({ class_name: 'mysql_connection', properties: { a: '1', b: 2, c: null } });

    expect(connection?.properties).toEqual({ a: '1' });
  });

  it('defaults a missing cluster name to empty', () => {
    expect(parseConnection({ class_name: 'clickhouse_connection', cluster_name: null })).toMatchObject({
      clusterName: ''
    });
  });
});

describe('connection toJson', () => {
  it('writes the server field names and class_name, without audit fields', () => {
    const json = new ClickhouseConnection(CLICKHOUSE_JSON).toJson();

    expect(json).toEqual({
      class_name: 'clickhouse_connection',
      host: 'clickhouse',
      username: 'default',
      password: 'secret',
      http_port: 8123,
      tcp_port: 9000,
      use_ssl: true,
      cluster_name: 'main',
      tunnel_config: { host: 'bastion', port: 22, username: 'ubuntu', public_key: 'ssh-rsa AAA', timeout_ms: 60000 },
      properties: { socket_timeout: '1000', 'ssl.mode': 'strict' }
    });
  });

  it('leaves out an empty cluster name and a missing tunnel', () => {
    const connection = new ClickhouseConnection({ host: 'h' });

    const json = JSON.parse(JSON.stringify(connection.toJson())) as Record<string, unknown>;

    expect(json).not.toHaveProperty('cluster_name');
    expect(json).not.toHaveProperty('tunnel_config');
  });

  it('writes a MySQL connection', () => {
    const connection = new MySqlConnection({ host: 'db', port: 3306, username: 'root', password: 'x' });
    connection.tunnelConfig = new SshConfig({ host: 'b', port: 22, username: 'u', public_key: 'k' });

    expect(connection.toJson()).toEqual({
      class_name: 'mysql_connection',
      host: 'db',
      port: 3306,
      username: 'root',
      password: 'x',
      properties: {},
      tunnel_config: { host: 'b', port: 22, username: 'u', public_key: 'k', timeout_ms: 60000 }
    });
  });

  it('does not share the properties object with the entity', () => {
    const connection = new MySqlConnection({ properties: { a: '1' } });

    const json = connection.toJson() as { properties: Record<string, string> };
    json.properties.b = '2';

    expect(connection.properties).toEqual({ a: '1' });
  });
});

describe('createConnection', () => {
  it.each([
    [ConnectionType.Clickhouse, ClickhouseConnection],
    [ConnectionType.MySql, MySqlConnection]
  ])('creates an empty %s', (type, expected) => {
    const connection = createConnection(type);

    expect(connection).toBeInstanceOf(expected);
    expect(connection.className).toBe(type);
    expect(connection.host).toBe('');
  });
});

describe('isConnectionType', () => {
  it.each([
    ['clickhouse_connection', true],
    ['mysql_connection', true],
    ['bigquery_connection', false],
    [undefined, false]
  ])('%s → %s', (value, expected) => {
    expect(isConnectionType(value)).toBe(expected);
  });
});
