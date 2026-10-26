import { describe, expect, it } from 'vitest';
import { conditionFamilyOf, isDateType, isNumberType, isTextType } from './fieldTypes';

describe('field type checks', () => {
  it.each(['int32', 'UInt64', 'double', 'Float64'])('%s is a number', type => {
    expect(isNumberType(type)).toBe(true);
    expect(isDateType(type)).toBe(false);
  });

  it.each(['date', 'DateTime', 'datetime64'])('%s is a date', type => {
    expect(isDateType(type)).toBe(true);
  });

  it('knows text by its one type', () => {
    expect(isTextType('String')).toBe(true);
    expect(isTextType('array')).toBe(false);
  });
});

describe('conditionFamilyOf', () => {
  it.each([
    ['string', 'string'],
    ['int64', 'number'],
    ['datetime', 'date'],
    ['bool', undefined],
    ['', undefined]
  ])('%s → %s', (type, family) => {
    expect(conditionFamilyOf(type)).toBe(family);
  });
});
