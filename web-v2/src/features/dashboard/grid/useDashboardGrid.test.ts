import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { Position } from '@/core/dashboard/Position';
import { useDashboardGrid, type DashboardGridOptions } from './useDashboardGrid';

const pos = (row: number, column: number, zIndex = 0): Position => ({ row, column, width: 4, height: 3, zIndex });
const positions = { 1: pos(0, 0, 1), 2: pos(0, 4, 5) };
const moved = [
  { i: '1', x: 8, y: 0, w: 4, h: 3 },
  { i: '2', x: 4, y: 0, w: 4, h: 3 }
];

function setup(options: Partial<DashboardGridOptions> = {}) {
  const onPositionsChange = vi.fn<NonNullable<DashboardGridOptions['onPositionsChange']>>();
  const { result } = renderHook(() =>
    useDashboardGrid({ positions, editable: true, overlap: false, mobile: false, onPositionsChange, ...options })
  );
  return { result, onPositionsChange };
}

describe('useDashboardGrid', () => {
  it('builds a 48-column layout from positions', () => {
    const { result } = setup();
    expect(result.current.grid.cols).toBe(48);
    expect(result.current.grid.layout).toEqual([
      { i: '1', x: 0, y: 0, w: 4, h: 3 },
      { i: '2', x: 4, y: 0, w: 4, h: 3 }
    ]);
    expect(result.current.grid.topZIndex).toBe(6);
  });

  it('reports only the widgets the layout changed', () => {
    const { result, onPositionsChange } = setup();
    result.current.onLayoutChange(moved);
    expect(onPositionsChange).toHaveBeenCalledWith({ 1: { ...pos(0, 8, 1) } });
  });

  it('does not report a layout that matches the positions', () => {
    const { result, onPositionsChange } = setup();
    result.current.onLayoutChange(result.current.grid.layout);
    expect(onPositionsChange).not.toHaveBeenCalled();
  });

  it('never reports in view mode', () => {
    const { result, onPositionsChange } = setup({ editable: false, overlap: true });
    expect(result.current.grid.editable).toBe(false);
    result.current.onLayoutChange(moved);
    result.current.onItemPointerDown(1);
    expect(onPositionsChange).not.toHaveBeenCalled();
  });

  describe('on mobile', () => {
    it('stacks widgets in one column, read only, without layering', () => {
      const { result } = setup({ mobile: true, overlap: true });
      expect(result.current.grid).toMatchObject({ cols: 1, editable: false, zIndexes: undefined });
      expect(result.current.grid.layout.map(item => item.w)).toEqual([1, 1]);
    });

    it('never reports the stacked layout as changes', () => {
      const { result, onPositionsChange } = setup({ mobile: true });
      result.current.onLayoutChange(result.current.grid.layout);
      expect(onPositionsChange).not.toHaveBeenCalled();
    });
  });

  describe('overlap', () => {
    it('lets widgets overlap without compaction and layers them by z-index', () => {
      const { result } = setup({ overlap: true });
      expect(result.current.grid.compactor).toMatchObject({ type: null, allowOverlap: true });
      expect(result.current.grid.zIndexes).toEqual({ 1: 1, 2: 5 });
    });

    it('brings the pressed widget to front', () => {
      const { result, onPositionsChange } = setup({ overlap: true });
      result.current.onItemPointerDown(1);
      expect(onPositionsChange).toHaveBeenCalledWith({ 1: pos(0, 0, 6) });
    });

    it('does nothing when the pressed widget is already on top', () => {
      const { result, onPositionsChange } = setup({ overlap: true });
      result.current.onItemPointerDown(2);
      expect(onPositionsChange).not.toHaveBeenCalled();
    });
  });

  it('compacts vertically without overlap and ignores z-index', () => {
    const { result, onPositionsChange } = setup();
    expect(result.current.grid.compactor).toMatchObject({ type: 'vertical', allowOverlap: false });
    expect(result.current.grid.zIndexes).toBeUndefined();
    result.current.onItemPointerDown(1);
    expect(onPositionsChange).not.toHaveBeenCalled();
  });
});
