import { describe, expect, it } from 'vitest';
import { groupThousands, ungroupThousands } from './numberInput.utils';

describe('groupThousands', () => {
  it.each([
    ['9958', '9,958'],
    ['1234567', '1,234,567'],
    ['-1234567.891', '-1,234,567.891'],
    ['1,2345', '12,345'],
    ['999', '999'],
    ['0.12345', '0.12345']
  ])('groups %s as %s', (text, grouped) => {
    expect(groupThousands(text)).toBe(grouped);
  });

  it.each(['', '-', '1234.', '.5'])('keeps a number being typed editable: "%s"', text => {
    expect(groupThousands(text)).toBe(text === '1234.' ? '1,234.' : text);
  });

  it.each(['abc', '1e5', '12 34'])('leaves "%s", which is no plain number, as is', text => {
    expect(groupThousands(text)).toBe(text);
  });
});

describe('ungroupThousands', () => {
  it('drops the separators', () => {
    expect(ungroupThousands('1,234,567.5')).toBe('1234567.5');
    expect(ungroupThousands('')).toBe('');
    expect(ungroupThousands(undefined)).toBe('');
  });
});
