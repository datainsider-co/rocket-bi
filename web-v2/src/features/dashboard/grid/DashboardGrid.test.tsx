import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Position } from '@/core/dashboard/Position';
import { DashboardGrid, type DashboardGridProps } from './DashboardGrid';

const pos = (row: number, column: number, zIndex = 0): Position => ({ row, column, width: 4, height: 3, zIndex });

function renderGrid(props: Partial<DashboardGridProps> = {}) {
  const onPositionsChange = vi.fn<NonNullable<DashboardGridProps['onPositionsChange']>>();
  render(
    <DashboardGrid
      positions={{ 1: pos(0, 0), 2: pos(0, 4) }}
      renderItem={id => <span>widget {id}</span>}
      editable
      onPositionsChange={onPositionsChange}
      {...props}
    />
  );
  return { onPositionsChange };
}

// Drags need real layout, which jsdom lacks; they are covered by the hook tests and the Storybook stories.
describe('DashboardGrid', () => {
  it('renders every widget', () => {
    renderGrid();
    expect(screen.getByText('widget 1')).toBeInTheDocument();
    expect(screen.getByText('widget 2')).toBeInTheDocument();
  });

  it('reports nothing on mount when the stored layout is already compact', () => {
    const { onPositionsChange } = renderGrid();
    expect(onPositionsChange).not.toHaveBeenCalled();
  });

  it('reports the compaction of a stored layout with gaps in edit mode', () => {
    const { onPositionsChange } = renderGrid({ positions: { 1: pos(5, 0) } });
    expect(onPositionsChange).toHaveBeenCalledWith({ 1: pos(0, 0) });
  });

  it('does not report compaction in view mode', () => {
    const { onPositionsChange } = renderGrid({ positions: { 1: pos(5, 0) }, editable: false });
    expect(onPositionsChange).not.toHaveBeenCalled();
  });

  it('keeps gaps in overlap mode', () => {
    const { onPositionsChange } = renderGrid({ positions: { 1: pos(5, 0, 2) }, overlap: true });
    expect(onPositionsChange).not.toHaveBeenCalled();
    expect(screen.getByText('widget 1').parentElement).toHaveStyle({ zIndex: '2' });
  });
});
