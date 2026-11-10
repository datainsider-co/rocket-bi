import { describe, expect, it } from 'vitest';
import { boxMenu, NOT_SUPPORTED_YET, operatorMenu, tableMenu } from './etlMenu.utils';

describe('tableMenu', () => {
  it("lists v1's items", () => {
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
    expect(menu.some(item => item.disabled)).toBe(false);
    expect(menu.at(-1)).toMatchObject({ key: 'remove', danger: true });
  });

  it('has no Edit Display Name on a source', () => {
    expect(tableMenu(true).map(item => item.key)).not.toContain('rename');
  });
});

describe('operatorMenu', () => {
  it.each(['sql', 'join', 'manageFields', 'transform', 'pivot'] as const)('edits a %s operator', kind => {
    expect(operatorMenu(kind).map(item => [item.key, item.disabled ?? false])).toEqual([
      ['edit', false],
      ['remove', false]
    ]);
  });

  it.each([
    ['python', 'Not supported'],
    ['unsupported', 'Not supported']
  ] as const)('does not edit a %s operator yet', (kind, title) => {
    expect(operatorMenu(kind)[0]).toMatchObject({ key: 'edit', disabled: true, title });
  });
});

describe('boxMenu', () => {
  it('edits a Save To Data Warehouse box', () => {
    expect(boxMenu('persist').map(item => [item.key, item.disabled ?? false])).toEqual([
      ['edit', false],
      ['remove', false]
    ]);
  });

  it.each(['thirdParty', 'email'] as const)('only removes a %s box for now', type => {
    expect(boxMenu(type)[0]).toMatchObject({ key: 'edit', disabled: true, title: NOT_SUPPORTED_YET });
  });
});
