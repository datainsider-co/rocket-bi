import { describe, expect, it } from 'vitest';
import { bezierPath, curvedBezier, rowCenter } from './curvedPath.utils';

const W = 200;

describe('curvedBezier', () => {
  it('runs from the right side to the left side of a table far to the right', () => {
    expect(curvedBezier({ x: 100, y: 10 }, { x: 500, y: 50 }, W)).toEqual({
      start: { x: 200, y: 10 },
      control1: { x: 300, y: 10 },
      control2: { x: 300, y: 50 },
      end: { x: 400, y: 50 }
    });
  });

  it('runs from the left side to the right side of a table far to the left', () => {
    expect(curvedBezier({ x: 500, y: 10 }, { x: 100, y: 50 }, W)).toEqual({
      start: { x: 400, y: 10 },
      control1: { x: 300, y: 10 },
      control2: { x: 300, y: 50 },
      end: { x: 200, y: 50 }
    });
  });

  it('loops out of the right sides when the target overlaps on the right', () => {
    expect(curvedBezier({ x: 100, y: 10 }, { x: 150, y: 50 }, W)).toEqual({
      start: { x: 200, y: 10 },
      control1: { x: 350, y: 30 },
      control2: { x: 250, y: 50 },
      end: { x: 250, y: 50 }
    });
  });

  it('loops out of the left sides when the target overlaps on the left or is right below', () => {
    expect(curvedBezier({ x: 100, y: 10 }, { x: 100, y: 90 }, W)).toEqual({
      start: { x: 0, y: 10 },
      control1: { x: -100, y: 50 },
      control2: { x: 0, y: 90 },
      end: { x: 0, y: 90 }
    });
  });

  it('switches to the S-curve at one and a half table widths', () => {
    expect(curvedBezier({ x: 0, y: 0 }, { x: 300, y: 0 }, W).end).toEqual({ x: 200, y: 0 });
    expect(curvedBezier({ x: 0, y: 0 }, { x: 299, y: 0 }, W).end).toEqual({ x: 399, y: 0 });
  });

  it('ends at the pointer while dragging', () => {
    expect(curvedBezier({ x: 100, y: 10 }, { x: 500, y: 50 }, W, true).end).toEqual({ x: 500, y: 50 });
    expect(curvedBezier({ x: 500, y: 10 }, { x: 100, y: 50 }, W, true).end).toEqual({ x: 100, y: 50 });
    expect(curvedBezier({ x: 100, y: 10 }, { x: 150, y: 50 }, W, true).end).toEqual({ x: 150, y: 50 });
    expect(curvedBezier({ x: 100, y: 10 }, { x: 90, y: 50 }, W, true).end).toEqual({ x: 90, y: 50 });
  });
});

describe('bezierPath', () => {
  it('writes an SVG cubic curve', () => {
    expect(
      bezierPath({ start: { x: 0, y: 1 }, control1: { x: 2, y: 3 }, control2: { x: 4, y: 5 }, end: { x: 6, y: 7 } })
    ).toBe('M0,1 C2,3 4,5 6,7');
  });
});

describe('rowCenter', () => {
  it('moves from the left edge to the middle of the row', () => {
    expect(rowCenter({ x: 10, y: 20 }, W)).toEqual({ x: 110, y: 20 });
  });
});
