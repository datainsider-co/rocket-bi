import { describe, expect, it } from 'vitest';
import { boxMenu, NOT_SUPPORTED_YET, operatorMenu, tableMenu } from './etlMenu.utils';

describe('tableMenu', () => {
  it("lists v1's items, the ones waiting for their steps disabled", () => {
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
    expect(menu.slice(0, 3).some(item => item.disabled)).toBe(false);
    expect(menu.slice(3, 6).every(item => item.disabled && item.title === NOT_SUPPORTED_YET)).toBe(true);
    expect(menu.at(-1)).toMatchObject({ key: 'remove', danger: true });
  });

  it('has no Edit Display Name on a source', () => {
    expect(tableMenu(true).map(item => item.key)).not.toContain('rename');
  });
});

describe('operatorMenu', () => {
  it.each(['sql', 'join', 'manageFields'] as const)('edits a %s operator', kind => {
    expect(operatorMenu(kind).map(item => [item.key, item.disabled ?? false])).toEqual([
      ['edit', false],
      ['remove', false]
    ]);
  });

  it.each([
    ['transform', NOT_SUPPORTED_YET],
    ['pivot', NOT_SUPPORTED_YET],
    ['python', 'Not supported'],
    ['unsupported', 'Not supported']
  ] as const)('does not edit a %s operator yet', (kind, title) => {
    expect(operatorMenu(kind)[0]).toMatchObject({ key: 'edit', disabled: true, title });
  });
});

describe('boxMenu', () => {
  it('offers Edit (later) and Remove', () => {
    expect(boxMenu().map(item => [item.key, item.disabled ?? false])).toEqual([
      ['edit', true],
      ['remove', false]
    ]);
  });
});
