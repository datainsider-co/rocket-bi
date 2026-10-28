import { describe, expect, it } from 'vitest';
import { listingPageFromJson, listingRequestToJson } from './Listing';

describe('listingRequestToJson', () => {
  it('writes paging, keyword and sorts', () => {
    expect(
      listingRequestToJson({ from: 20, size: 10, keyword: 'sales', sorts: [{ field: 'name', order: 'ASC' }] })
    ).toEqual({ from: 20, size: 10, keyword: 'sales', sorts: [{ field: 'name', order: 'ASC' }] });
  });

  it.each([undefined, ''])('leaves out a keyword of %j and missing sorts', keyword => {
    expect(listingRequestToJson({ from: 0, size: 10, keyword })).toEqual({ from: 0, size: 10 });
  });

  it('copies the sorts', () => {
    const sorts = [{ field: 'name', order: 'DESC' as const }];

    expect(listingRequestToJson({ from: 0, size: 1, sorts })['sorts']).not.toBe(sorts);
  });
});

describe('listingPageFromJson', () => {
  it('parses every row and reads the total', () => {
    expect(listingPageFromJson({ data: [1, 2], total: 7 }, value => Number(value) * 10)).toEqual({
      total: 7,
      data: [10, 20]
    });
  });

  it.each([undefined, null, {}, { data: 'x', total: '3' }])('reads %j as an empty page', json => {
    expect(listingPageFromJson(json, value => value)).toEqual({ total: 0, data: [] });
  });
});
