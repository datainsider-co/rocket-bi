import { describe, expect, it } from 'vitest';
import { alreadyOnCanvasMessage, dropPosition } from './globalRelationship.utils';

describe('dropPosition', () => {
  it('puts the table a little left of the pointer, as v1', () => {
    expect(dropPosition({ x: 100, y: 50 })).toEqual({ x: 60, y: 50 });
    expect(dropPosition({ x: 0, y: -10 })).toEqual({ x: -40, y: -10 });
  });
});

describe('alreadyOnCanvasMessage', () => {
  it('names the table', () => {
    expect(alreadyOnCanvasMessage('sales')).toBe('sales is already on the canvas');
  });
});
