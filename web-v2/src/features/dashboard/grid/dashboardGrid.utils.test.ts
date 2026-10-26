import { describe, expect, it } from 'vitest';
import type { Position, PositionMap } from '@/core/dashboard/Position';
import {
  bringToFront,
  changedPositions,
  findFreeSlot,
  gridMetrics,
  placeUnplaced,
  toLayout,
  toStackedLayout
} from './dashboardGrid.utils';

const pos = (row: number, column: number, width = 4, height = 3, zIndex = 0): Position => ({
  row,
  column,
  width,
  height,
  zIndex
});

describe('gridMetrics', () => {
  it('keeps the v1 cell pitch', () => {
    const { rowHeight, margin } = gridMetrics(10);
    // Height of an item 3 rows high: 3 rows + 2 gaps, as gridstack's 3 * 32 - 10.
    expect(3 * rowHeight + 2 * margin[1]).toBe(3 * 32 - 10);
  });

  it('pads the edges with half a margin', () => {
    expect(gridMetrics(8)).toEqual({ rowHeight: 24, margin: [8, 8], containerPadding: [4, 4] });
  });

  it('takes a custom cell height', () => {
    expect(gridMetrics(10, 40).rowHeight).toBe(30);
  });
});

describe('findFreeSlot', () => {
  it('returns the top left of an empty grid', () => {
    expect(findFreeSlot([], 5, 5, 48)).toEqual({ row: 0, column: 0 });
  });

  it('places next to an item on the same row when there is room', () => {
    expect(findFreeSlot([{ x: 0, y: 0, w: 10, h: 4 }], 5, 2, 48)).toEqual({ row: 0, column: 10 });
  });

  it('goes to the next free row when the row is full', () => {
    expect(findFreeSlot([{ x: 0, y: 0, w: 46, h: 2 }], 5, 2, 48)).toEqual({ row: 2, column: 0 });
  });

  it('fills a gap that is large enough', () => {
    const occupied = [
      { x: 0, y: 0, w: 4, h: 4 },
      { x: 8, y: 0, w: 40, h: 4 }
    ];
    expect(findFreeSlot(occupied, 4, 4, 48)).toEqual({ row: 0, column: 4 });
  });

  it('clamps a width wider than the grid', () => {
    expect(findFreeSlot([], 100, 1, 12)).toEqual({ row: 0, column: 0 });
  });

  it('treats a zero size as 1x1', () => {
    expect(findFreeSlot([{ x: 0, y: 0, w: 1, h: 1 }], 0, 0, 2)).toEqual({ row: 0, column: 1 });
  });
});

describe('placeUnplaced', () => {
  it('returns the same object when everything is placed', () => {
    const positions = { 1: pos(0, 0) };
    expect(placeUnplaced(positions)).toBe(positions);
  });

  it('places unplaced widgets around placed ones, in id order', () => {
    const placed = placeUnplaced({ 3: pos(-1, -1, 4, 2), 1: pos(0, 0, 44, 2), 2: pos(-1, -1, 4, 2) }, 48);
    expect(placed[1]).toEqual(pos(0, 0, 44, 2));
    expect(placed[2]).toEqual(pos(0, 44, 4, 2));
    expect(placed[3]).toEqual(pos(2, 0, 4, 2));
  });

  it('places a widget with only one coordinate missing', () => {
    expect(placeUnplaced({ 1: pos(3, -1) })[1]).toEqual(pos(0, 0));
  });

  it('does not mutate the input', () => {
    const positions = { 1: pos(-1, -1) };
    placeUnplaced(positions);
    expect(positions[1]).toEqual(pos(-1, -1));
  });
});

describe('toLayout', () => {
  it('maps positions to layout items keyed by id', () => {
    expect(toLayout({ 7: pos(1, 2, 3, 4) })).toEqual([{ i: '7', x: 2, y: 1, w: 3, h: 4 }]);
  });

  it('places unplaced widgets', () => {
    expect(toLayout({ 1: pos(-1, -1, 4, 2) })).toEqual([{ i: '1', x: 0, y: 0, w: 4, h: 2 }]);
  });

  it('clamps items that overflow the grid', () => {
    expect(toLayout({ 1: pos(0, 10, 20, 0) }, 12)).toEqual([{ i: '1', x: 0, y: 0, w: 12, h: 1 }]);
    expect(toLayout({ 1: pos(0, 10, 4) }, 12)).toEqual([{ i: '1', x: 8, y: 0, w: 4, h: 3 }]);
  });

  it('returns an empty layout for no positions', () => {
    expect(toLayout({})).toEqual([]);
  });
});

describe('toStackedLayout', () => {
  it('stacks widgets in reading order, full width, keeping heights', () => {
    const positions: PositionMap = {
      1: pos(5, 0, 10, 2),
      2: pos(0, 20, 10, 3),
      3: pos(0, 0, 10, 4)
    };
    expect(toStackedLayout(positions)).toEqual([
      { i: '3', x: 0, y: 0, w: 1, h: 4 },
      { i: '2', x: 0, y: 4, w: 1, h: 3 },
      { i: '1', x: 0, y: 7, w: 1, h: 2 }
    ]);
  });

  it('keeps id order for widgets at the same cell', () => {
    expect(toStackedLayout({ 2: pos(0, 0, 4, 1), 1: pos(0, 0, 4, 1) }).map(item => item.i)).toEqual(['1', '2']);
  });

  it('handles no positions', () => {
    expect(toStackedLayout({})).toEqual([]);
  });
});

describe('changedPositions', () => {
  const positions = { 1: pos(0, 0, 4, 3, 5), 2: pos(0, 4) };

  it('returns moved and resized widgets, keeping z-index', () => {
    const layout = [
      { i: '1', x: 1, y: 2, w: 6, h: 7 },
      { i: '2', x: 4, y: 0, w: 4, h: 3 }
    ];
    expect(changedPositions(positions, layout)).toEqual({ 1: pos(2, 1, 6, 7, 5) });
  });

  it('returns nothing when the layout matches', () => {
    expect(changedPositions(positions, toLayout(positions))).toEqual({});
  });

  it('reports unplaced widgets once the grid has placed them', () => {
    expect(changedPositions({ 1: pos(-1, -1) }, [{ i: '1', x: 0, y: 0, w: 4, h: 3 }])).toEqual({ 1: pos(0, 0) });
  });

  it('ignores items without a position', () => {
    expect(changedPositions(positions, [{ i: '__dropping-elem__', x: 0, y: 0, w: 1, h: 1 }])).toEqual({});
  });
});

describe('bringToFront', () => {
  it('raises the widget above the highest other widget', () => {
    expect(bringToFront({ 1: pos(0, 0, 4, 3, 1), 2: pos(0, 0, 4, 3, 7) }, 1)).toEqual(pos(0, 0, 4, 3, 8));
  });

  it('raises a widget that ties for the top', () => {
    expect(bringToFront({ 1: pos(0, 0, 4, 3, 7), 2: pos(0, 0, 4, 3, 7) }, 1)?.zIndex).toBe(8);
  });

  it('returns undefined when the widget is already on top', () => {
    expect(bringToFront({ 1: pos(0, 0, 4, 3, 9), 2: pos(0, 0, 4, 3, 7) }, 1)).toBeUndefined();
  });

  it('returns undefined for the only widget', () => {
    expect(bringToFront({ 1: pos(0, 0) }, 1)).toBeUndefined();
  });

  it('returns undefined for an unknown widget', () => {
    expect(bringToFront({ 1: pos(0, 0) }, 2)).toBeUndefined();
  });
});
