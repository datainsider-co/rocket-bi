import { describe, expect, it } from 'vitest';
import { HEADER_HEIGHT, bodyScrollHeight } from './table.utils';

describe('bodyScrollHeight', () => {
  it('leaves the header height out', () => {
    expect(bodyScrollHeight(600)).toBe(600 - HEADER_HEIGHT);
  });

  it('rounds down a fractional box', () => {
    expect(bodyScrollHeight(500.7, 48)).toBe(452);
  });

  it.each([0, 48, 30, -10])('is undefined for a box of %d', height => {
    expect(bodyScrollHeight(height)).toBeUndefined();
  });
});
