import { describe, expect, it } from 'vitest';
import {
  isUnplaced,
  maxZIndex,
  normalizeZIndex,
  positionEntries,
  positionFromJson,
  positionsFromJson,
  positionsToJson,
  positionToJson,
  type Position
} from './Position';

const at = (row: number, column: number, zIndex = 0): Position => ({ row, column, width: 4, height: 3, zIndex });

describe('positionFromJson', () => {
  it('maps z_index to zIndex', () => {
    // `widget_positions` value from the local backend.
    expect(positionFromJson({ row: 1, column: 2, width: 5, height: 6, z_index: 3 })).toEqual({
      row: 1,
      column: 2,
      width: 5,
      height: 6,
      zIndex: 3
    });
  });

  it('falls back to an unplaced 1x1 position for missing or invalid fields', () => {
    expect(positionFromJson({ row: 'x', width: Number.NaN })).toEqual({ row: -1, column: -1, width: 1, height: 1, zIndex: 0 });
  });

  it.each([null, undefined, 'a', 3])('accepts %s', json => {
    expect(positionFromJson(json)).toEqual({ row: -1, column: -1, width: 1, height: 1, zIndex: 0 });
  });
});

describe('positionToJson', () => {
  it('maps zIndex to z_index', () => {
    expect(positionToJson(at(1, 2, 3))).toEqual({ row: 1, column: 2, width: 4, height: 3, z_index: 3 });
  });
});

describe('positionsFromJson', () => {
  it('keys positions by numeric widget id', () => {
    const positions = positionsFromJson({ '1': { row: 0, column: 0, width: 4, height: 3, z_index: 0 }, '-2': {} });

    expect(positions[1]).toEqual(at(0, 0));
    expect(positions[-2]).toEqual({ row: -1, column: -1, width: 1, height: 1, zIndex: 0 });
  });

  it('drops keys that are not integer ids', () => {
    expect(Object.keys(positionsFromJson({ abc: {}, '1.5': {}, '': {}, '7': {} }))).toEqual(['7']);
  });

  it.each([null, undefined, [], 'x'])('returns an empty map for %s', json => {
    expect(positionsFromJson(json)).toEqual({});
  });
});

describe('positionsToJson', () => {
  it('round-trips with positionsFromJson', () => {
    const json = { '1': { row: 0, column: 1, width: 4, height: 3, z_index: 2 } };
    expect(positionsToJson(positionsFromJson(json))).toEqual(json);
  });
});

describe('positionEntries', () => {
  it('returns numeric ids in ascending order', () => {
    expect(positionEntries({ 10: at(0, 0), 2: at(1, 1), [-1]: at(2, 2) }).map(([id]) => id)).toEqual([-1, 2, 10]);
  });
});

describe('isUnplaced', () => {
  it.each([
    [at(-1, -1), true],
    [at(-1, 0), true],
    [at(0, -1), true],
    [at(0, 0), false]
  ])('%o -> %s', (position, expected) => {
    expect(isUnplaced(position)).toBe(expected);
  });
});

describe('maxZIndex', () => {
  it('returns the highest z-index', () => {
    expect(maxZIndex({ 1: at(0, 0, 4), 2: at(0, 0, 9) })).toBe(9);
  });

  it('is at least 1', () => {
    expect(maxZIndex({})).toBe(1);
    expect(maxZIndex({ 1: at(0, 0, 0) })).toBe(1);
  });
});

describe('normalizeZIndex', () => {
  it('shifts z-indexes so the lowest is 0', () => {
    const result = normalizeZIndex({ 1: at(0, 0, 5), 2: at(0, 0, 8) });
    expect(result[1]?.zIndex).toBe(0);
    expect(result[2]?.zIndex).toBe(3);
  });

  it('keeps z-indexes when the lowest is already 0', () => {
    const positions = { 1: at(0, 0, 0), 2: at(0, 0, 8) };
    expect(normalizeZIndex(positions)).toEqual(positions);
  });

  it('handles an empty map', () => {
    expect(normalizeZIndex({})).toEqual({});
  });

  it('does not mutate the input', () => {
    const positions = { 1: at(0, 0, 5) };
    normalizeZIndex(positions);
    expect(positions[1].zIndex).toBe(5);
  });
});
