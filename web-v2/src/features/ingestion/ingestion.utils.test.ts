import { describe, expect, it } from 'vitest';
import {
  getIngestionSection,
  INGESTION_SECTIONS,
  ingestionSectionFromPath,
  type IngestionSection
} from './ingestion.utils';

describe('INGESTION_SECTIONS', () => {
  it('lists the v1 sidebar without Streaming, at v1 paths', () => {
    expect(INGESTION_SECTIONS.map(section => [section.title, section.path])).toEqual([
      ['Data Sources', '/data-ingestion/data-source'],
      ['Jobs', '/data-ingestion/job'],
      ['Queued Jobs', '/data-ingestion/queued-job'],
      ['Jobs History', '/data-ingestion/job-history']
    ]);
  });
});

describe('getIngestionSection', () => {
  it('finds a section by key', () => {
    expect(getIngestionSection('queued-job').title).toBe('Queued Jobs');
  });

  it('throws on an unknown key', () => {
    expect(() => getIngestionSection('streaming' as IngestionSection)).toThrow('Unknown ingestion section');
  });
});

describe('ingestionSectionFromPath', () => {
  it.each([
    ['/data-ingestion/data-source', 'data-source'],
    ['/data-ingestion/job', 'job'],
    ['/data-ingestion/queued-job', 'queued-job'],
    ['/data-ingestion/job-history', 'job-history'],
    ['/data-ingestion/job/12', 'job'],
    ['/data-ingestion', 'data-source'],
    ['/data-ingestion/streaming', 'data-source'],
    ['/mydata/job', 'data-source'],
    ['', 'data-source']
  ])('%j → %s', (pathname, expected) => {
    expect(ingestionSectionFromPath(pathname)).toBe(expected);
  });
});
