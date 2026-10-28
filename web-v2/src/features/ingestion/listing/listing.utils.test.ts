import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import {
  columnSortOrder,
  countLabel,
  DEFAULT_PAGE_SIZE,
  formatDateTime,
  initialListingState,
  lastPage,
  listingPagination,
  PAGE_SIZE_OPTIONS,
  selectedOnPage,
  toListingRequest,
  withKeyword,
  withPage,
  withSortOn,
  type ListingState
} from './listing.utils';

type Field = 'name' | 'last_modified';

const state: ListingState<Field> = { page: 3, pageSize: 20, keyword: 'sales', sort: { field: 'name', order: 'ASC' } };

describe('initialListingState', () => {
  it('starts on page 1 with the default page size and no keyword', () => {
    expect(initialListingState<Field>({ field: 'last_modified', order: 'DESC' })).toEqual({
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      keyword: '',
      sort: { field: 'last_modified', order: 'DESC' }
    });
  });
});

describe('toListingRequest', () => {
  it('turns the page into an offset and sends the keyword and sort', () => {
    expect(toListingRequest(state)).toEqual({
      from: 40,
      size: 20,
      keyword: 'sales',
      sorts: [{ field: 'name', order: 'ASC' }]
    });
  });

  it.each(['', '   '])('leaves out a blank keyword %j', keyword => {
    expect(toListingRequest({ ...state, keyword }).keyword).toBeUndefined();
  });

  it('trims the keyword', () => {
    expect(toListingRequest({ ...state, keyword: ' sales ' }).keyword).toBe('sales');
  });
});

describe('withKeyword', () => {
  it('goes back to page 1 on a new keyword', () => {
    expect(withKeyword(state, 'jobs')).toEqual({ ...state, keyword: 'jobs', page: 1 });
  });

  it('keeps the same state for the same keyword', () => {
    expect(withKeyword(state, 'sales')).toBe(state);
  });
});

describe('withPage', () => {
  it('moves to a page', () => {
    expect(withPage(state, 5, 20)).toEqual({ ...state, page: 5 });
  });

  it('goes back to page 1 when the page size changes', () => {
    expect(withPage(state, 5, 50)).toEqual({ ...state, page: 1, pageSize: 50 });
  });
});

describe('withSortOn', () => {
  it('flips the order of the sorted column', () => {
    expect(withSortOn(state, 'name').sort).toEqual({ field: 'name', order: 'DESC' });
    expect(withSortOn({ ...state, sort: { field: 'name', order: 'DESC' } }, 'name').sort).toEqual({
      field: 'name',
      order: 'ASC'
    });
  });

  it('sorts another column ascending, from page 1', () => {
    expect(withSortOn(state, 'last_modified')).toEqual({
      ...state,
      page: 1,
      sort: { field: 'last_modified', order: 'ASC' }
    });
  });

  it('does not change the state it is given', () => {
    const before = structuredClone(state);
    withSortOn(state, 'last_modified');
    expect(state).toEqual(before);
  });
});

describe('columnSortOrder', () => {
  it.each([
    [{ field: 'name', order: 'ASC' }, 'name', 'ascend'],
    [{ field: 'name', order: 'DESC' }, 'name', 'descend'],
    [{ field: 'name', order: 'ASC' }, 'last_modified', null]
  ] as const)('%j on %s → %s', (sort, field, expected) => {
    expect(columnSortOrder<Field>(sort, field)).toBe(expected);
  });
});

describe('formatDateTime', () => {
  it('formats like v1, in local time', () => {
    const time = dayjs('2026-10-29T07:30:05').valueOf();
    expect(formatDateTime(time)).toBe('Oct 29, 2026 07:30:05');
  });

  it.each([0, -1])('shows -- for %d', time => {
    expect(formatDateTime(time)).toBe('--');
  });
});

describe('lastPage', () => {
  it.each([
    [0, 20, 1],
    [1, 20, 1],
    [20, 20, 1],
    [21, 20, 2],
    [100, 20, 5]
  ])('%d rows of %d per page → page %d', (total, pageSize, expected) => {
    expect(lastPage(total, pageSize)).toBe(expected);
  });
});

describe('listingPagination', () => {
  it('shows the total and v1 page sizes', () => {
    const pagination = listingPagination(2, 50, 123);

    expect(pagination).toMatchObject({ current: 2, pageSize: 50, total: 123, showSizeChanger: true });
    expect(pagination.pageSizeOptions).toEqual([20, 30, 50, 100, 200]);
    expect(pagination.showTotal(123)).toBe('Total: 123');
  });

  it('copies the page sizes', () => {
    expect(listingPagination(1, 20, 0).pageSizeOptions).not.toBe(PAGE_SIZE_OPTIONS);
  });
});

describe('selectedOnPage', () => {
  it('keeps the selected ids shown, in selection order', () => {
    expect(selectedOnPage([3, 1, 9], [1, 2, 3])).toEqual([3, 1]);
  });

  it('is empty when nothing is selected or the page is empty', () => {
    expect(selectedOnPage([], [1])).toEqual([]);
    expect(selectedOnPage([1], [])).toEqual([]);
  });
});

describe('countLabel', () => {
  it.each([
    [0, '0 jobs'],
    [1, '1 job'],
    [2, '2 jobs']
  ])('%i → %s', (count, label) => {
    expect(countLabel(count, 'job', 'jobs')).toBe(label);
  });
});
