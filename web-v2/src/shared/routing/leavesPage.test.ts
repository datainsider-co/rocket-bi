import { describe, expect, it } from 'vitest';
import { leavesPage } from './leavesPage';

describe('leavesPage', () => {
  const here = { pathname: '/data-warehouse/relationship', search: '' };

  it('is false for the same URL', () => {
    expect(leavesPage(here, { ...here })).toBe(false);
  });

  it('is true for another page or other search params', () => {
    expect(leavesPage(here, { pathname: '/data-warehouse/schema', search: '' })).toBe(true);
    expect(leavesPage(here, { ...here, search: '?x=1' })).toBe(true);
  });
});
