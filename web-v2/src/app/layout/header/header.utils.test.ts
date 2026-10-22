import { describe, expect, it } from 'vitest';
import { DEFAULT_BRAND_NAME, activeLinkKeys, activeNavKeys, avatarInitial, brandName, isPathActive } from './header.utils';
import type { HeaderLink, HeaderNavItem } from './header.utils';

describe('isPathActive', () => {
  it.each([
    ['/mydata', true],
    ['/mydata/folder-1', true],
    ['/mydatax', false],
    ['/', false],
    ['/trash', true]
  ])('%s against /mydata and /trash → %s', (pathname, expected) => {
    expect(isPathActive(pathname, ['/mydata', '/trash'])).toBe(expected);
  });

  it('is false without prefixes', () => {
    expect(isPathActive('/mydata', [])).toBe(false);
  });
});

describe('activeLinkKeys', () => {
  const links: HeaderLink[] = [
    { key: 'schema', label: 'Schema', to: '/data-warehouse/schema' },
    { key: 'cook', label: 'Data Cook', to: '/data-warehouse/data-cook' }
  ];

  it('returns the key of the link the path is under', () => {
    expect(activeLinkKeys('/data-warehouse/schema/db-1', links)).toEqual(['schema']);
  });

  it('returns nothing when no link matches', () => {
    expect(activeLinkKeys('/data-warehouse', links)).toEqual([]);
  });

  it('returns nothing for no links', () => {
    expect(activeLinkKeys('/data-warehouse/schema', [])).toEqual([]);
  });
});

describe('brandName', () => {
  it('uses the organization name', () => {
    expect(brandName('Acme')).toBe('Acme');
  });

  it.each(['', '   '])('falls back to the default for %j', name => {
    expect(brandName(name)).toBe(DEFAULT_BRAND_NAME);
  });
});

describe('avatarInitial', () => {
  it('returns the first letter in upper case', () => {
    expect(avatarInitial('  khang pham')).toBe('K');
  });

  it('returns an empty string for an empty name', () => {
    expect(avatarInitial('')).toBe('');
  });
});

describe('activeNavKeys', () => {
  const items: HeaderNavItem[] = [
    { key: 'dashboards', label: 'Dashboards', to: '/mydata', activePaths: ['/mydata'] },
    {
      key: 'data-warehouse',
      label: 'Data Warehouse',
      to: '/data-warehouse',
      activePaths: ['/data-warehouse'],
      children: [{ key: 'schema', label: 'Schema', to: '/data-warehouse/schema' }]
    }
  ];

  it('selects an active plain entry', () => {
    expect(activeNavKeys('/mydata/x', items)).toEqual(['dashboards']);
  });

  it('selects the active link of a group, not the group', () => {
    expect(activeNavKeys('/data-warehouse/schema', items)).toEqual(['schema']);
  });

  it('selects nothing elsewhere', () => {
    expect(activeNavKeys('/', items)).toEqual([]);
  });
});
