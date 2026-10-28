import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { JdbcDatabaseType } from '@/core/ingestion/DataSource';
import { isAvailableSource, SOURCE_CATALOG, type SourceCatalogEntry } from './sourceCatalog';

/** Vitest runs from `web-v2/`; `import.meta.url` isn't a file URL under jsdom. */
const PUBLIC_DIR = resolve(process.cwd(), 'public');

describe('SOURCE_CATALOG', () => {
  it("lists the types in v1's order, without Universal Analytics and the SDKs", () => {
    expect(SOURCE_CATALOG.map(entry => entry.title)).toEqual([
      'Generic JDBC',
      'MySQL',
      'Oracle',
      'Microsoft SQL',
      'MongoDB',
      'Redshift',
      'BigQuery',
      'PostgreSQL',
      'Google Analytics 4',
      'Google Ads',
      'Google Search Console',
      'CSV',
      'Google Sheets',
      'Shopify',
      'S3',
      'Facebook Ads',
      'TikTok Ads',
      'Palexy',
      'Hubspot',
      'Mixpanel'
    ]);
  });

  it('has unique keys', () => {
    const keys = SOURCE_CATALOG.map(entry => entry.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('makes the six JDBC types and CSV available, each with its form', () => {
    const available = SOURCE_CATALOG.filter(isAvailableSource).map(entry => [entry.key, entry.form]);
    expect(available).toEqual([
      ['generic_jdbc', { kind: 'jdbc', databaseType: JdbcDatabaseType.GenericJdbc }],
      ['mysql', { kind: 'jdbc', databaseType: JdbcDatabaseType.MySql }],
      ['oracle', { kind: 'jdbc', databaseType: JdbcDatabaseType.Oracle }],
      ['sql_server', { kind: 'jdbc', databaseType: JdbcDatabaseType.SqlServer }],
      ['redshift', { kind: 'jdbc', databaseType: JdbcDatabaseType.Redshift }],
      ['postgresql', { kind: 'jdbc', databaseType: JdbcDatabaseType.Postgres }],
      ['csv', { kind: 'csv' }]
    ]);
  });

  it('covers every JDBC database type exactly once', () => {
    const types = SOURCE_CATALOG.filter(isAvailableSource).flatMap(entry => (entry.form.kind === 'jdbc' ? [entry.form.databaseType] : []));
    expect(types.toSorted()).toEqual(Object.values(JdbcDatabaseType).toSorted());
  });

  it('marks the rest coming soon', () => {
    expect(SOURCE_CATALOG.filter(entry => !isAvailableSource(entry))).toHaveLength(13);
    expect(SOURCE_CATALOG.find(entry => entry.key === 'mongodb')?.status).toBe('coming-soon');
  });

  it.each(SOURCE_CATALOG.map(entry => [entry.title, entry.iconUrl]))('has an icon file for %s', (_title, iconUrl) => {
    expect(iconUrl).toMatch(/^\/ingestion\/sources\//);
    expect(existsSync(`${PUBLIC_DIR}${iconUrl}`)).toBe(true);
  });
});

describe('isAvailableSource', () => {
  const base = { key: 'mysql', title: 'MySQL', iconUrl: '/x.png' } as const;

  it('returns true for an available entry', () => {
    const entry: SourceCatalogEntry = { ...base, status: 'available', form: { kind: 'csv' } };
    expect(isAvailableSource(entry)).toBe(true);
  });

  it('returns false for a coming-soon entry', () => {
    const entry: SourceCatalogEntry = { ...base, status: 'coming-soon' };
    expect(isAvailableSource(entry)).toBe(false);
  });
});
