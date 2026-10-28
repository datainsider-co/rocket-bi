import { describe, expect, it } from 'vitest';
import { JdbcDatabaseType } from '@/core/ingestion/DataSource';
import fixture from '@/core/ingestion/ingestion.fixture.json';
import { buildJdbcUrl, OracleTarget, parseJdbcUrl, parseProperties, type JdbcEndpoint } from './jdbcUrl.utils';

const ENDPOINT: JdbcEndpoint = {
  host: 'db.local',
  port: '1521',
  database: 'orcl',
  oracleTarget: OracleTarget.ServiceName,
  properties: {}
};

describe('parseProperties', () => {
  it('is empty without a query', () => {
    expect(parseProperties(undefined)).toEqual({});
    expect(parseProperties('')).toEqual({});
  });

  it('reads pairs, decoding them and keeping dotted keys', () => {
    expect(parseProperties('connectTimeout=30000&ssl.mode=a%26b%3Dc&empty=')).toEqual({
      connectTimeout: '30000',
      'ssl.mode': 'a&b=c',
      empty: ''
    });
  });

  it.each([['noValue'], ['=x'], ['a=%E0%A4%A']])('gives up on %j', query => {
    expect(parseProperties(query)).toBeUndefined();
  });
});

describe('buildJdbcUrl', () => {
  it('builds MySQL with encoded properties and no database', () => {
    const endpoint = { ...ENDPOINT, port: '3306', properties: { connectTimeout: '30000', 'a b': 'x&y' } };
    expect(buildJdbcUrl(JdbcDatabaseType.MySql, endpoint)).toBe('jdbc:mysql://db.local:3306?connectTimeout=30000&a%20b=x%26y');
  });

  it('builds MySQL without properties', () => {
    expect(buildJdbcUrl(JdbcDatabaseType.MySql, { ...ENDPOINT, port: '3306' })).toBe('jdbc:mysql://db.local:3306');
  });

  it.each([
    [JdbcDatabaseType.SqlServer, 'jdbc:sqlserver://db.local:1521;databaseName=orcl'],
    [JdbcDatabaseType.Postgres, 'jdbc:postgresql://db.local:1521/orcl'],
    [JdbcDatabaseType.Redshift, 'jdbc:redshift://db.local:1521/orcl']
  ] as const)('builds %s with the database', (type, url) => {
    expect(buildJdbcUrl(type, { ...ENDPOINT, properties: { ignored: '1' } })).toBe(url);
  });

  it('builds Oracle by service name or SID, with properties', () => {
    expect(buildJdbcUrl(JdbcDatabaseType.Oracle, ENDPOINT)).toBe('jdbc:oracle:thin:@//db.local:1521/orcl');
    expect(buildJdbcUrl(JdbcDatabaseType.Oracle, { ...ENDPOINT, oracleTarget: OracleTarget.Sid, properties: { a: '1' } })).toBe(
      'jdbc:oracle:thin:@//db.local:1521:orcl?a=1'
    );
  });
});

describe('parseJdbcUrl', () => {
  it('reads the DI0 MySQL source', () => {
    expect(parseJdbcUrl(JdbcDatabaseType.MySql, fixture.sourceGet.response.jdbc_url)).toMatchObject({
      host: 'rocket-bi-mysql',
      port: '3306'
    });
  });

  it.each([
    [JdbcDatabaseType.MySql, { ...ENDPOINT, port: '3306', database: '', properties: { connectTimeout: '30000', 'k&': 'v=1' } }],
    [JdbcDatabaseType.SqlServer, ENDPOINT],
    [JdbcDatabaseType.Postgres, ENDPOINT],
    [JdbcDatabaseType.Redshift, { ...ENDPOINT, database: '' }],
    [JdbcDatabaseType.Oracle, { ...ENDPOINT, properties: { 'oracle.net.timeout': '10' } }],
    [JdbcDatabaseType.Oracle, { ...ENDPOINT, oracleTarget: OracleTarget.Sid }]
  ] as const)('round-trips %s', (type, endpoint) => {
    expect(parseJdbcUrl(type, buildJdbcUrl(type, endpoint))).toEqual(endpoint);
  });

  it('reads a MySQL URL with a trailing slash and v1 raw properties', () => {
    expect(parseJdbcUrl(JdbcDatabaseType.MySql, 'jdbc:mysql://h:3306/?useSSL=false')).toMatchObject({
      host: 'h',
      properties: { useSSL: 'false' }
    });
  });

  it.each([
    [JdbcDatabaseType.MySql, 'jdbc:mysql://h:3306/sales'],
    [JdbcDatabaseType.MySql, 'jdbc:mysql://h?x=1'],
    [JdbcDatabaseType.MySql, 'jdbc:mysql://h:3306?broken'],
    [JdbcDatabaseType.SqlServer, 'jdbc:sqlserver://h:1433;databaseName=a;encrypt=true'],
    [JdbcDatabaseType.Postgres, 'jdbc:postgresql://h:5432/db?ssl=true'],
    [JdbcDatabaseType.Postgres, 'jdbc:mysql://h:5432/db'],
    [JdbcDatabaseType.Oracle, 'jdbc:oracle:thin:@h:1521:orcl']
  ] as const)('can not read %s %s as fields', (type, url) => {
    expect(parseJdbcUrl(type, url)).toBeUndefined();
  });
});
