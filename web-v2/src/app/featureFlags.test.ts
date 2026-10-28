import { describe, expect, it } from 'vitest';
import { readFeatureFlags } from './featureFlags';

describe('readFeatureFlags', () => {
  it.each(['true', 'TRUE', ' true '])('turns ingestion on for %j', value => {
    expect(readFeatureFlags({ VITE_ENABLE_INGESTION: value })).toEqual({ ingestion: true });
  });

  it.each([undefined, '', 'false', '1', 'yes', true])('keeps ingestion off for %j', value => {
    expect(readFeatureFlags({ VITE_ENABLE_INGESTION: value })).toEqual({ ingestion: false });
  });

  it('keeps everything off without env', () => {
    expect(readFeatureFlags({})).toEqual({ ingestion: false });
  });
});
