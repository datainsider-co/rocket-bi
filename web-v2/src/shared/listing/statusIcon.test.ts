import { describe, expect, it } from 'vitest';
import { statusIconUrl } from './statusIcon';

describe('statusIconUrl', () => {
  it.each([
    ['synced', '/ingestion/status/synced.svg'],
    ['unknown', '/ingestion/status/unknown.svg']
  ] as const)('%s → %s', (icon, expected) => {
    expect(statusIconUrl(icon)).toBe(expected);
  });
});
