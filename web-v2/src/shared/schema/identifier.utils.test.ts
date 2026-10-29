import { describe, expect, it } from 'vitest';
import { toIdentifier } from './identifier.utils';

describe('toIdentifier', () => {
  it.each([
    ['Đơn hàng 1', 'Don_hang_1'],
    ['Mã số', 'Ma_so'],
    ['  unit   price  ', 'unit_price'],
    ['a--b__c', 'a_b_c'],
    ['(x)', '_x_'],
    ['plain_name', 'plain_name'],
    ['', '']
  ])('turns %j into %j as the server does', (name, identifier) => {
    expect(toIdentifier(name)).toBe(identifier);
  });
});
