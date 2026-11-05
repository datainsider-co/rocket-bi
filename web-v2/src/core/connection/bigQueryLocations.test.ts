import { describe, expect, it } from 'vitest';
import { BIGQUERY_LOCATIONS, bigQueryLocationLabel } from './bigQueryLocations';

describe('bigQueryLocationLabel', () => {
  it('gives the label of a known location', () => {
    expect(bigQueryLocationLabel('asia-east1')).toBe('asia-east1 (Taiwan)');
  });

  it('falls back to the value', () => {
    expect(bigQueryLocationLabel('US')).toBe('US');
  });

  it('lists every v1 location once', () => {
    expect(new Set(BIGQUERY_LOCATIONS.map(location => location.value)).size).toBe(28);
  });
});
