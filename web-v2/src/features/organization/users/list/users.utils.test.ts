import { describe, expect, it } from 'vitest';
import { initialListingState } from '@/shared/listing/listing.utils';
import { NO_USER_SORT, rowNumber, toUserSearch, usersBody } from './users.utils';

const state = initialListingState(NO_USER_SORT);

describe('toUserSearch', () => {
  it('turns the page into from and size', () => {
    expect(toUserSearch({ ...state, page: 3, pageSize: 20 })).toEqual({ from: 40, size: 20, keyword: undefined });
  });

  it('trims the keyword and leaves a blank one out', () => {
    expect(toUserSearch({ ...state, keyword: '  os0 ' }).keyword).toBe('os0');
    expect(toUserSearch({ ...state, keyword: '   ' }).keyword).toBeUndefined();
  });
});

describe('rowNumber', () => {
  it('counts from 1 on the first page', () => {
    expect(rowNumber(state, 0)).toBe(1);
  });

  it('continues from previous pages', () => {
    expect(rowNumber({ ...state, page: 2, pageSize: 20 }, 4)).toBe(25);
  });
});

describe('usersBody', () => {
  it.each([
    [true, 3, 'error'],
    [false, 0, 'empty'],
    [false, 5, 'table'],
    [false, undefined, 'table']
  ] as const)('error %s, total %s → %s', (hasError, total, expected) => {
    expect(usersBody(hasError, total)).toBe(expected);
  });
});
