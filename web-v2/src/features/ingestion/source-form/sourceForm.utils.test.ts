import { describe, expect, it } from 'vitest';
import { dataSourceFromJson, JdbcDatabaseType, type JdbcSource } from '@/core/ingestion/DataSource';
import fixture from '@/core/ingestion/ingestion.fixture.json';
import { JDBC_SOURCE_KINDS } from '../sourceKinds';
import { OracleTarget } from './jdbcUrl.utils';
import {
  databaseLabel,
  formValuesToSource,
  initialSourceFormValues,
  newSourceFormValues,
  showsProperties,
  sourceFormSchema,
  sourceToFormValues,
  type SourceFormValues
} from './sourceForm.utils';

function savedSource(overrides: Partial<JdbcSource> = {}): JdbcSource {
  const source = dataSourceFromJson(fixture.sourceGet.response);
  if (source.kind !== 'jdbc') throw new Error('expected a JDBC source');
  return { ...source, ...overrides };
}

function filled(databaseType: JdbcDatabaseType, overrides: Partial<SourceFormValues> = {}): SourceFormValues {
  return {
    ...newSourceFormValues(databaseType),
    displayName: 'Sales',
    host: 'db',
    database: 'sales',
    jdbcUrl: 'jdbc:sqlite:/tmp/x.db',
    username: 'root',
    ...overrides
  };
}

function errorsOf(values: SourceFormValues): Record<string, string> {
  const result = sourceFormSchema.safeParse(values);
  if (result.success) return {};
  return Object.fromEntries(result.error.issues.map(issue => [issue.path.join('.'), issue.message]));
}

describe('databaseLabel', () => {
  it('names the database of each kind like v1', () => {
    expect(databaseLabel(JDBC_SOURCE_KINDS.Postgres, OracleTarget.ServiceName)).toBe('Database name');
    expect(databaseLabel(JDBC_SOURCE_KINDS.Oracle, OracleTarget.ServiceName)).toBe('Service name');
    expect(databaseLabel(JDBC_SOURCE_KINDS.Oracle, OracleTarget.Sid)).toBe('SID');
  });
});

describe('showsProperties', () => {
  it('shows them for MySQL and Oracle fields only', () => {
    expect(showsProperties(JDBC_SOURCE_KINDS.MySql, false)).toBe(true);
    expect(showsProperties(JDBC_SOURCE_KINDS.Oracle, false)).toBe(true);
    expect(showsProperties(JDBC_SOURCE_KINDS.MySql, true)).toBe(false);
    expect(showsProperties(JDBC_SOURCE_KINDS.Postgres, false)).toBe(false);
  });
});

describe('newSourceFormValues', () => {
  it('starts MySQL on its port with v1 connect timeout', () => {
    expect(newSourceFormValues(JdbcDatabaseType.MySql)).toMatchObject({
      rawUrl: false,
      port: '3306',
      oracleTarget: 'service_name',
      properties: [{ key: 'connectTimeout', value: '30000' }]
    });
  });

  it('types the URL of Generic JDBC', () => {
    expect(newSourceFormValues(JdbcDatabaseType.GenericJdbc)).toMatchObject({ rawUrl: true, port: '', properties: [] });
  });
});

describe('sourceFormSchema', () => {
  it.each(Object.values(JdbcDatabaseType))('accepts a filled %s form', databaseType => {
    expect(errorsOf(filled(databaseType))).toEqual({});
  });

  it('needs display name, host, port and username', () => {
    expect(errorsOf(filled(JdbcDatabaseType.MySql, { displayName: ' ', host: '', port: '0', username: '' }))).toEqual({
      displayName: 'Display name is required!',
      host: 'Host is required!',
      port: 'Port must be from 1 to 65535',
      username: 'Username is required!'
    });
  });

  it('needs the database where the type has one', () => {
    expect(errorsOf(filled(JdbcDatabaseType.MySql, { database: '' }))).toEqual({});
    expect(errorsOf(filled(JdbcDatabaseType.SqlServer, { database: '' }))).toEqual({ database: 'Database name is required!' });
    expect(errorsOf(filled(JdbcDatabaseType.Oracle, { database: '', oracleTarget: OracleTarget.Sid }))).toEqual({
      database: 'SID is required!'
    });
  });

  it('checks property keys only where the type takes properties', () => {
    const properties = [{ key: '', value: '1' }];
    expect(errorsOf(filled(JdbcDatabaseType.Oracle, { properties }))).toEqual({ 'properties.0.key': 'Key is required!' });
    expect(errorsOf(filled(JdbcDatabaseType.Postgres, { properties }))).toEqual({});
  });

  it('needs only the URL when it is typed', () => {
    expect(errorsOf(filled(JdbcDatabaseType.GenericJdbc, { jdbcUrl: '', host: '', port: '' }))).toEqual({
      jdbcUrl: 'JDBC URL is required!'
    });
  });
});

describe('sourceToFormValues', () => {
  it('splits the DI0 MySQL source into fields', () => {
    expect(sourceToFormValues(savedSource())).toEqual({
      databaseType: 'MySql',
      displayName: 'DI0 MySQL',
      rawUrl: false,
      jdbcUrl: fixture.sourceGet.response.jdbc_url,
      host: 'rocket-bi-mysql',
      port: '3306',
      database: '',
      oracleTarget: 'service_name',
      username: 'root',
      password: fixture.sourceGet.response.password,
      properties: []
    });
  });

  it('keeps a URL the fields can not hold as text', () => {
    const source = savedSource({ databaseType: 'Postgres', jdbcUrl: 'jdbc:postgresql://h:5432/db?ssl=true' });
    expect(sourceToFormValues(source)).toMatchObject({ rawUrl: true, jdbcUrl: 'jdbc:postgresql://h:5432/db?ssl=true', host: '' });
  });

  it('types the URL of Generic JDBC', () => {
    const source = savedSource({ databaseType: 'GenericJdbc', jdbcUrl: 'jdbc:clickhouse://h:8123' });
    expect(sourceToFormValues(source)).toMatchObject({ rawUrl: true, jdbcUrl: 'jdbc:clickhouse://h:8123' });
  });

  it('reads Oracle SID and properties', () => {
    const source = savedSource({ databaseType: 'Oracle', jdbcUrl: 'jdbc:oracle:thin:@//h:1521:orcl?a=1' });
    expect(sourceToFormValues(source)).toMatchObject({
      oracleTarget: 'sid',
      database: 'orcl',
      properties: [{ key: 'a', value: '1' }]
    });
  });
});

describe('formValuesToSource', () => {
  it('creates a new source with a built, trimmed URL', () => {
    const values = filled(JdbcDatabaseType.MySql, { displayName: ' Sales ', host: ' db ', port: ' 3306 ', password: ' p ' });
    expect(formValuesToSource(values)).toEqual({
      kind: 'jdbc',
      id: -1,
      creatorId: '',
      lastModify: 0,
      json: {},
      displayName: 'Sales',
      databaseType: 'MySql',
      jdbcUrl: 'jdbc:mysql://db:3306?connectTimeout=30000',
      username: 'root',
      password: ' p '
    });
  });

  it('merges edits onto the saved source', () => {
    const saved = savedSource();
    const source = formValuesToSource({ ...sourceToFormValues(saved), displayName: 'Renamed' }, saved);
    expect(source).toEqual({ ...saved, displayName: 'Renamed' });
  });

  it('leaves out the database of MySQL and properties of other types', () => {
    expect(formValuesToSource(filled(JdbcDatabaseType.MySql, { properties: [] })).jdbcUrl).toBe('jdbc:mysql://db:3306');
    const postgres = filled(JdbcDatabaseType.Postgres, { port: '5432', properties: [{ key: 'a', value: '1' }] });
    expect(formValuesToSource(postgres).jdbcUrl).toBe('jdbc:postgresql://db:5432/sales');
  });

  it('sends a typed URL as is, trimmed', () => {
    expect(formValuesToSource(filled(JdbcDatabaseType.GenericJdbc, { jdbcUrl: ' jdbc:x ' })).jdbcUrl).toBe('jdbc:x');
    expect(formValuesToSource(filled(JdbcDatabaseType.Postgres, { rawUrl: true, jdbcUrl: 'jdbc:postgresql://h/db?x' })).jdbcUrl).toBe(
      'jdbc:postgresql://h/db?x'
    );
  });
});

describe('initialSourceFormValues', () => {
  it('starts empty for a new source', () => {
    expect(initialSourceFormValues({ mode: 'create', databaseType: 'Oracle' })).toEqual(newSourceFormValues('Oracle'));
  });

  it('loads a saved source', () => {
    const source = savedSource();
    expect(initialSourceFormValues({ mode: 'edit', source })).toEqual(sourceToFormValues(source));
  });
});
