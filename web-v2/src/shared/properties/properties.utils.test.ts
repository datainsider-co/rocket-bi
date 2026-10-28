import { describe, expect, it } from 'vitest';
import { fromPropertyRows, propertyKeyErrors, toPropertyRows } from './properties.utils';

describe('propertyKeyErrors', () => {
  it('returns no entries for no rows', () => {
    expect(propertyKeyErrors([])).toEqual([]);
  });

  it('flags empty keys and repeated keys after the first', () => {
    expect(
      propertyKeyErrors([
        { key: 'a', value: '1' },
        { key: ' ', value: '2' },
        { key: ' a ', value: '3' },
        { key: 'b', value: '' }
      ])
    ).toEqual([undefined, 'Key is required!', 'This key is already used', undefined]);
  });
});

describe('toPropertyRows', () => {
  it('keeps keys with dots as they are', () => {
    expect(toPropertyRows({ 'ssl.mode': 'on', a: '' })).toEqual([
      { key: 'ssl.mode', value: 'on' },
      { key: 'a', value: '' }
    ]);
  });

  it('is empty for no properties', () => {
    expect(toPropertyRows({})).toEqual([]);
  });
});

describe('fromPropertyRows', () => {
  it('trims keys but not values', () => {
    expect(fromPropertyRows([{ key: ' ssl.mode ', value: ' on ' }])).toEqual({ 'ssl.mode': ' on ' });
  });

  it('does not change the rows', () => {
    const rows = [{ key: ' a ', value: '1' }];
    fromPropertyRows(rows);
    expect(rows).toEqual([{ key: ' a ', value: '1' }]);
  });
});
