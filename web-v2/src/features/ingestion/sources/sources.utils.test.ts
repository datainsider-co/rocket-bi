import { describe, expect, it } from 'vitest';
import { dataSourceFromJson, type DataSource } from '@/core/ingestion/DataSource';
import fixture from '@/core/ingestion/ingestion.fixture.json';
import type { SourceInfo } from '@/core/ingestion/DataSourceService';
import { UserProfile } from '@/core/user/UserProfile';
import {
  DEFAULT_SOURCE_SORT,
  ownerName,
  sortFieldOfColumn,
  SourceColumn,
  sourceRowKey,
  sourcesBody,
  sourceTypeLabel
} from './sources.utils';

function jdbc(databaseType: string): DataSource {
  return dataSourceFromJson({ ...fixture.sourceGet.response, database_type: databaseType });
}

function unsupported(className: string): DataSource {
  return dataSourceFromJson({ id: 7, class_name: className, display_name: 'Other' });
}

describe('DEFAULT_SOURCE_SORT', () => {
  it('is last modified, newest first, like v1', () => {
    expect(DEFAULT_SOURCE_SORT).toEqual({ field: 'last_modified', order: 'DESC' });
  });
});

describe('sortFieldOfColumn', () => {
  it.each([
    [SourceColumn.Name, 'name'],
    [SourceColumn.Owner, 'creator_id'],
    [SourceColumn.Type, 'data_source_type'],
    [SourceColumn.LastModified, 'last_modified']
  ])('maps the %s column to %s', (column, field) => {
    expect(sortFieldOfColumn(column)).toBe(field);
  });

  it.each([['action'], ['toString'], [''], [3], [undefined]])('has no field for %s', key => {
    expect(sortFieldOfColumn(key)).toBeUndefined();
  });
});

describe('sourceTypeLabel', () => {
  it.each([
    ['MySql', 'MySQL'],
    ['SqlServer', 'Microsoft SQL'],
    ['Oracle', 'Oracle'],
    ['Redshift', 'Redshift'],
    ['Postgres', 'PostgreSQL'],
    ['GenericJdbc', 'Generic JDBC']
  ])('names the JDBC type %s %s', (databaseType, label) => {
    expect(sourceTypeLabel(jdbc(databaseType))).toBe(label);
  });

  it.each([
    ['mongo_db_source', 'MongoDB'],
    ['gg_service_account_source', 'BigQuery'],
    ['ga4_source', 'Google Analytics 4'],
    ['tik_tok_ads_source', 'TikTok Ads'],
    ['amazon_s3', 'S3']
  ])('names the unsupported %s %s', (className, label) => {
    expect(sourceTypeLabel(unsupported(className))).toBe(label);
  });

  it('falls back to the raw class name of an unknown type', () => {
    expect(sourceTypeLabel(unsupported('new_source'))).toBe('new_source');
  });

  it('says Unknown with no class name, and ignores Object keys', () => {
    expect(sourceTypeLabel(unsupported(''))).toBe('Unknown');
    expect(sourceTypeLabel(unsupported('constructor'))).toBe('constructor');
  });

  it('labels a jdbc_source with an unknown database_type by its class name', () => {
    expect(sourceTypeLabel(jdbc('Sqlite'))).toBe('jdbc_source');
  });
});

describe('ownerName', () => {
  const source = jdbc('MySql');

  it('uses the creator display name', () => {
    const creator = new UserProfile({ username: 'root', full_name: 'Root User' });
    expect(ownerName({ source, creator })).toBe('Root User');
  });

  it('falls back to the username when the creator has no name', () => {
    expect(ownerName({ source, creator: new UserProfile({ username: 'alice' }) })).toBe('alice');
  });

  it('falls back to creator_id without a creator', () => {
    expect(ownerName({ source, creator: undefined })).toBe('root');
  });

  it('says Unknown with neither', () => {
    expect(ownerName({ source: unsupported('ga4_source'), creator: undefined })).toBe('Unknown');
  });
});

describe('sourceRowKey', () => {
  it('is the source id', () => {
    const info: SourceInfo = { source: jdbc('MySql'), creator: undefined };
    expect(sourceRowKey(info)).toBe(1);
  });
});

describe('sourcesBody', () => {
  const loaded = { hasError: false, total: 3, isPlaceholder: false, keyword: '' };

  it('shows the error first', () => {
    expect(sourcesBody({ ...loaded, hasError: true, total: undefined })).toBe('error');
    expect(sourcesBody({ ...loaded, hasError: true })).toBe('error');
  });

  it('shows the table (with its spinner) before the first page', () => {
    expect(sourcesBody({ ...loaded, total: undefined })).toBe('table');
  });

  it('shows the table while the previous page stands in, even if it was empty', () => {
    expect(sourcesBody({ ...loaded, total: 0, isPlaceholder: true, keyword: 'x' })).toBe('table');
  });

  it('shows the table with rows', () => {
    expect(sourcesBody(loaded)).toBe('table');
  });

  it('shows no data for an empty listing', () => {
    expect(sourcesBody({ ...loaded, total: 0 })).toBe('empty');
    expect(sourcesBody({ ...loaded, total: 0, keyword: '   ' })).toBe('empty');
  });

  it('shows no match for an empty search', () => {
    expect(sourcesBody({ ...loaded, total: 0, keyword: 'sales' })).toBe('no-match');
  });
});
