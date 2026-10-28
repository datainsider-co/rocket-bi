import { describe, expect, it } from 'vitest';
import { dataSourceFromJson, jdbcSourceToJson, newJdbcSource } from './DataSource';
import fixture from './ingestion.fixture.json';

describe('dataSourceFromJson', () => {
  it('reads a JDBC source as the server sent it', () => {
    expect(dataSourceFromJson(fixture.sourceGet.response)).toEqual({
      kind: 'jdbc',
      id: 1,
      displayName: 'DI0 MySQL',
      databaseType: 'MySql',
      jdbcUrl: 'jdbc:mysql://rocket-bi-mysql:3306',
      username: 'root',
      password: '<password>',
      creatorId: 'root',
      lastModify: 1793208012201,
      json: fixture.sourceGet.response
    });
  });

  it.each(['MySql', 'SqlServer', 'Oracle', 'Redshift', 'Postgres', 'GenericJdbc'])('reads database type %s', type => {
    expect(dataSourceFromJson({ class_name: 'jdbc_source', database_type: type })).toMatchObject({
      kind: 'jdbc',
      databaseType: type
    });
  });

  it.each([
    [{ class_name: 'mongo_db_source', id: 7, display_name: 'Mongo' }, 'mongo_db_source'],
    [{ class_name: 'jdbc_source', database_type: 'Vertica', id: 8 }, 'jdbc_source'],
    [{}, '']
  ])('reads %j as unsupported, keeping its JSON', (json, className) => {
    expect(dataSourceFromJson(json)).toMatchObject({ kind: 'unsupported', className, json });
  });

  it('defaults missing fields', () => {
    expect(dataSourceFromJson(null)).toMatchObject({ id: -1, displayName: '', creatorId: '', lastModify: 0 });
  });
});

describe('jdbcSourceToJson', () => {
  it('writes a new source the way source/create accepted it', () => {
    const source = newJdbcSource({
      displayName: 'DI0 MySQL',
      databaseType: 'MySql',
      jdbcUrl: 'jdbc:mysql://rocket-bi-mysql:3306',
      username: 'root',
      password: 'secret'
    });

    expect(jdbcSourceToJson(source)).toEqual({
      class_name: 'jdbc_source',
      org_id: -1,
      id: -1,
      display_name: 'DI0 MySQL',
      database_type: 'MySql',
      jdbc_url: 'jdbc:mysql://rocket-bi-mysql:3306',
      username: 'root',
      password: 'secret'
    });
  });

  it('merges edits onto the JSON it was read from', () => {
    const source = dataSourceFromJson(fixture.sourceGet.response);
    if (source.kind !== 'jdbc') throw new Error('expected a JDBC source');

    expect(jdbcSourceToJson({ ...source, displayName: 'DI0 MySQL (edited)' })).toEqual({
      ...fixture.sourceGet.response,
      display_name: 'DI0 MySQL (edited)'
    });
  });

  it('does not change the source it writes', () => {
    const source = dataSourceFromJson(fixture.sourceGet.response);
    if (source.kind !== 'jdbc') throw new Error('expected a JDBC source');
    const before = structuredClone(source);

    jdbcSourceToJson({ ...source, username: 'other' });

    expect(source).toEqual(before);
  });
});
