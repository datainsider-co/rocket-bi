import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { ClientRect, DragEndEvent, DragStartEvent, DroppableContainer } from '@dnd-kit/core';
import { sourceData, targetData, type DragSource, type DropTarget, type ZoneRules } from './fieldDnd.utils';
import { fieldCollision, useFieldDndHandlers, type FieldDndOptions } from './useFieldDndHandlers';

const zones: ZoneRules = { x: { size: 1 }, full: { size: 1, maxItems: 1 } };
const field: DragSource = { kind: 'external', payload: 'price' };

function setup(options: Partial<FieldDndOptions> = {}) {
  const onDrop = vi.fn<FieldDndOptions['onDrop']>();
  const hook = renderHook(() => useFieldDndHandlers({ zones, onDrop, ...options }));
  return { ...hook, onDrop };
}

const startEvent = (source: DragSource) => ({ active: { data: { current: sourceData(source) } } }) as unknown as DragStartEvent;

const endEvent = (source: DragSource, target: DropTarget | undefined) =>
  ({
    active: { data: { current: sourceData(source) } },
    over: target ? { data: { current: targetData(target) } } : null
  }) as unknown as DragEndEvent;

describe('useFieldDndHandlers', () => {
  it('calls onDrop with the resolved action', () => {
    const { result, onDrop } = setup();
    act(() => result.current.onDragEnd(endEvent(field, { kind: 'zone', zoneId: 'x' })));
    expect(onDrop).toHaveBeenCalledWith({ type: 'insert', zoneId: 'x', index: 1 }, field);
  });

  it('passes the transfer mode on', () => {
    const { result, onDrop } = setup({ zones: { a: { size: 1 }, b: { size: 0 } }, transferModeOf: () => 'copy' });
    act(() => result.current.onDragEnd(endEvent({ kind: 'zone', zoneId: 'a', index: 0 }, { kind: 'zone', zoneId: 'b' })));
    expect(onDrop).toHaveBeenCalledWith(expect.objectContaining({ type: 'transfer', mode: 'copy' }), expect.anything());
  });

  it('does not call onDrop for a refused drop', () => {
    const { result, onDrop } = setup();
    act(() => result.current.onDragEnd(endEvent(field, { kind: 'zone', zoneId: 'full' })));
    expect(onDrop).not.toHaveBeenCalled();
  });

  it('does not call onDrop when dropped outside any target', () => {
    const { result, onDrop } = setup();
    act(() => result.current.onDragEnd(endEvent(field, undefined)));
    expect(onDrop).not.toHaveBeenCalled();
  });

  it('tracks the active source for highlighting', () => {
    const { result } = setup();
    expect(result.current.state.canAccept('x')).toBe(false);

    act(() => result.current.onDragStart(startEvent(field)));
    expect(result.current.state.active).toEqual(field);
    expect(result.current.state.canAccept('x')).toBe(true);
    expect(result.current.state.canAccept('full')).toBe(true);
    expect(result.current.state.canDrop({ kind: 'zone', zoneId: 'full' })).toBe(false);
    expect(result.current.state.canDrop({ kind: 'item', zoneId: 'full', index: 0 })).toBe(true);

    act(() => result.current.onDragCancel());
    expect(result.current.state.active).toBeUndefined();
  });

  it('clears the active source on drop', () => {
    const { result } = setup();
    act(() => result.current.onDragStart(startEvent(field)));
    act(() => result.current.onDragEnd(endEvent(field, undefined)));
    expect(result.current.state.active).toBeUndefined();
  });
});

describe('fieldCollision', () => {
  const rect = (top: number, left: number, width: number, height: number): ClientRect => ({
    top,
    left,
    width,
    height,
    right: left + width,
    bottom: top + height
  });

  function collide(droppables: [string, DropTarget | undefined, ClientRect][], pointer: { x: number; y: number } | null) {
    const containers = droppables.map(
      ([id, target]) => ({ id, data: { current: target ? targetData(target) : {} }, disabled: false }) as unknown as DroppableContainer
    );
    const rects = new Map(droppables.map(([id, , r]) => [id, r]));
    return fieldCollision({
      active: { id: 'drag', data: { current: {} }, rect: { current: { initial: null, translated: null } } },
      collisionRect: rect(pointer?.y ?? 0, pointer?.x ?? 0, 10, 10),
      droppableRects: rects,
      droppableContainers: containers,
      pointerCoordinates: pointer
    }).map(collision => collision.id);
  }

  const zone: [string, DropTarget, ClientRect] = ['zone:x', { kind: 'zone', zoneId: 'x' }, rect(0, 0, 200, 100)];
  const item: [string, DropTarget, ClientRect] = ['item:x:a', { kind: 'item', zoneId: 'x', index: 0 }, rect(10, 0, 200, 30)];
  const gap: [string, DropTarget, ClientRect] = ['gap:x:0', { kind: 'gap', zoneId: 'x', index: 0 }, rect(4, 0, 200, 12)];

  it('picks the gap over the item and zone under the pointer', () => {
    expect(collide([zone, item, gap], { x: 50, y: 12 })).toEqual(['gap:x:0']);
  });

  it('picks the item when the pointer is past the gap', () => {
    expect(collide([zone, item, gap], { x: 50, y: 30 })).toEqual(['item:x:a']);
  });

  it('picks the zone below the items', () => {
    expect(collide([zone, item, gap], { x: 50, y: 80 })).toEqual(['zone:x']);
  });

  it('returns nothing outside every droppable', () => {
    expect(collide([zone, item, gap], { x: 500, y: 500 })).toEqual([]);
  });

  it('ignores droppables that are not field targets', () => {
    expect(collide([['other', undefined, rect(0, 0, 200, 100)]], { x: 50, y: 50 })).toEqual([]);
  });

  it('falls back to rect overlap without a pointer (keyboard)', () => {
    expect(collide([zone], null)).toEqual(['zone:x']);
  });
});
