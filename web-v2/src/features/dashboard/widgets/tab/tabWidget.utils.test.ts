import { describe, expect, it } from 'vitest';
import { openTabIndex, tabHeaderCssVars } from './tabWidget.utils';

describe('openTabIndex', () => {
  it('keeps the picked tab', () => {
    expect(openTabIndex(1, 3)).toBe(1);
  });

  it('falls back to the last tab when the picked one is gone', () => {
    expect(openTabIndex(4, 2)).toBe(1);
  });

  it('is 0 without tabs or for a negative index', () => {
    expect(openTabIndex(2, 0)).toBe(0);
    expect(openTabIndex(-1, 3)).toBe(0);
  });
});

describe('tabHeaderCssVars', () => {
  it('maps the header style to the variables TabWidget.css reads', () => {
    expect(
      tabHeaderCssVars({ position: 'horizontal', fontSize: '16px', color: '#111', activeBackground: '#fff', inactiveBackground: '#eee' })
    ).toEqual({ '--tab-font-size': '16px', '--tab-color': '#111', '--tab-active-background': '#fff', '--tab-inactive-background': '#eee' });
  });
});
