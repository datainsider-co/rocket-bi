import { describe, expect, it } from 'vitest';
import { columnKind } from './columnType.utils';
import { steppedZoom, zoomLabel } from './canvasZoom.utils';

describe('steppedZoom', () => {
  it.each([
    [1, 1, 1.2],
    [1, -1, 0.8],
    [1.38, 1, 1.58],
    [0.3, -1, 0.1]
  ] as const)('%d stepped by %d is %d', (zoom, direction, expected) => {
    expect(steppedZoom(zoom, direction)).toBe(expected);
  });

  it('stops below 10%', () => {
    expect(steppedZoom(0.2, -1)).toBeUndefined();
  });

  it('stops above the maximum', () => {
    expect(steppedZoom(3.9, 1)).toBeUndefined();
  });
});

describe('zoomLabel', () => {
  it.each([
    [1, '100%'],
    [1.2, '120%'],
    [1.3812, '139%'],
    [0.1, '10%']
  ])('%d -> %s', (zoom, label) => {
    expect(zoomLabel(zoom)).toBe(label);
  });
});

describe('columnKind', () => {
  it.each([
    ['date', 'date'],
    ['datetime64', 'date'],
    ['int64', 'number'],
    ['double', 'number'],
    ['string', 'text'],
    ['', 'text'],
    ['array', 'text']
  ])('%s -> %s', (type, kind) => {
    expect(columnKind(type)).toBe(kind);
  });
});
