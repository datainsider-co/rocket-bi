import { describe, expect, it } from 'vitest';
import { boxMenu, NOT_SUPPORTED_YET, operatorMenu, tableMenu } from './etlMenu.utils';

describe('tableMenu', () => {
  it("lists v1's items, the operators waiting for their steps", () => {
    const menu = tableMenu(false);

    expect(menu.map(item => item.label)).toEqual([
      'Join Table',
      'Manage Fields',
      'SQL Query',
      'Pivot Table',
      'Transform Table',
      'Save To Data Warehouse',
      'Edit Display Name',
      'Remove'
    ]);
    expect(menu.slice(0, 6).every(item => item.disabled && item.title === NOT_SUPPORTED_YET)).toBe(true);
    expect(menu.at(-1)).toMatchObject({ key: 'remove', danger: true });
  });

  it('has no Edit Display Name on a source', () => {
    expect(tableMenu(true).map(item => item.key)).not.toContain('rename');
  });
});

describe('operatorMenu and boxMenu', () => {
  it('offer Edit (later) and Remove', () => {
    for (const menu of [operatorMenu(), boxMenu()]) {
      expect(menu.map(item => [item.key, item.disabled ?? false])).toEqual([
        ['edit', true],
        ['remove', false]
      ]);
    }
  });
});
