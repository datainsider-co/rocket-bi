import { describe, expect, it } from 'vitest';
import { menuIconClass } from './menuIcons.utils';

describe('menuIconClass', () => {
  it.each([
    ['rename', 'di-icon-under-text'],
    ['config', 'di-icon-add-chart'],
    ['copy', 'di-icon-copy-2'],
    ['duplicate', 'di-icon-duplicate'],
    ['delete', 'di-icon-delete'],
    ['add-tab', 'di-icon-add-tab'],
    ['config-tab', 'di-icon-config'],
    ['config-panel', 'di-icon-setting'],
    ['remove-widgets', 'di-icon-close']
  ])('gives %s v1 icon', (key, icon) => {
    expect(menuIconClass(key)).toBe(icon);
  });

  it('has no icon for other items', () => {
    expect(menuIconClass('csv')).toBeUndefined();
    expect(menuIconClass('')).toBeUndefined();
  });
});
