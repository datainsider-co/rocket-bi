import { describe, expect, it } from 'vitest';
import { dashboardFromJson } from '@/core/dashboard/Dashboard';
import fixture from '@/core/dashboard/dashboard.fixture.json';
import { widgetFromJson } from '@/core/dashboard/Widget';
import {
  copiedText,
  copyPosition,
  editedPositions,
  isPasteError,
  layoutToSave,
  pastedWidget,
  tabsWithout,
  withoutWidget,
  withWidget
} from './dashboardEdit.utils';

// Charts, a text and the tab 12 at the top level; the pie 11 in the tab.
const dashboard = dashboardFromJson(fixture);
const note = widgetFromJson({ class_name: 'text_widget', id: 50, content: 'new' });
const at = (row: number, column: number) => ({ row, column, width: 4, height: 2, zIndex: 3 });

describe('withWidget', () => {
  it('adds a widget with its position', () => {
    const next = withWidget(dashboard, note, at(1, 1));
    expect(next.widgets.at(-1)).toBe(note);
    expect(next.positions[50]).toEqual(at(1, 1));
    expect(next.widgets).toHaveLength(dashboard.widgets.length + 1);
  });

  it('replaces a widget, keeping its position', () => {
    const renamed = widgetFromJson({ ...dashboard.widgets[0]!.json, name: 'Renamed' });
    const next = withWidget(dashboard, renamed);
    expect(next.widgets).toHaveLength(dashboard.widgets.length);
    expect(next.widgets.find(widget => widget.id === renamed.id)?.name).toBe('Renamed');
    expect(next.positions).toBe(dashboard.positions);
  });
});

describe('withoutWidget', () => {
  it('drops the widget, its position and its place in tabs', () => {
    expect(tabsWithout(dashboard, 11).map(tab => tab.kind !== 'chart' && 'tabItems' in tab && tab.tabItems[0]?.widgetIds)).toEqual([[]]);
    const next = withoutWidget(dashboard, 11);
    expect(next.widgets.some(widget => widget.id === 11)).toBe(false);
    expect(next.positions[11]).toBeUndefined();
    const tab = next.widgets.find(widget => widget.id === 12);
    expect(tab?.kind === 'tab' && tab.tabItems[0]?.widgetIds).toEqual([]);
  });

  it('touches no tab for a top level widget', () => {
    expect(tabsWithout(dashboard, 3)).toEqual([]);
  });
});

describe('layout', () => {
  it('shows the moves on top of the stored positions, for existing widgets only', () => {
    const positions = editedPositions(dashboard, { 3: at(9, 9), 999: at(0, 0) });
    expect(positions[3]).toEqual(at(9, 9));
    expect(positions[4]).toEqual(dashboard.positions[4]);
    expect(positions[999]).toBeUndefined();
  });

  it('saves one position per widget, unplaced ones placed in their own grid, z-index from 0', () => {
    const moved = withWidget(dashboard, note, { row: -1, column: -1, width: 8, height: 3, zIndex: 5 });
    const saved = layoutToSave(moved, { 3: { ...dashboard.positions[3]!, zIndex: 4 } });
    expect(Object.keys(saved).map(Number).sort((a, b) => a - b)).toEqual(moved.widgets.map(widget => widget.id).sort((a, b) => a - b));
    expect(saved[50]!.row).toBeGreaterThanOrEqual(0);
    expect(Math.min(...Object.values(saved).map(position => position.zIndex))).toBe(0);
    // The pie in the tab keeps its place in the tab's grid.
    expect(saved[11]).toMatchObject({ row: 0, column: 0 });
  });

  it('puts a copy in a free slot at the same size', () => {
    expect(copyPosition(at(3, 4), at(0, 0))).toEqual({ ...at(3, 4), row: -1, column: -1 });
    expect(copyPosition(undefined, at(0, 0))).toEqual({ ...at(0, 0), row: -1, column: -1 });
  });
});

describe('clipboard', () => {
  const origin = 'http://app.test';

  it('pastes what was copied here, with its size', () => {
    const text = copiedText(dashboard.widgets[0]!, at(1, 2), `${origin}/dashboard/v2-sample-1`);
    const pasted = pastedWidget(text, origin);
    expect(isPasteError(pasted)).toBe(false);
    expect(pasted).toEqual({ json: dashboard.widgets[0]!.json, size: { width: 4, height: 2 } });
    expect(JSON.parse(text)).toMatchObject({ type: 'chart', sourceUrl: `${origin}/dashboard/v2-sample-1` });
  });

  it.each([
    ['plain text', 'hello', 'Nothing to paste: copy a widget first'],
    ['another envelope', JSON.stringify({ a: 1 }), 'Nothing to paste: copy a widget first'],
    ['another origin', JSON.stringify({ type: 'chart', sourceUrl: 'http://other.test/x', transferData: '{}' }), 'Incompatible this chart data'],
    ['v1 data', JSON.stringify({ type: 'chart', sourceUrl: 'http://app.test/x', transferData: '{"widget":{"className":"chart_v3"}}' }), 'This widget was copied from the old app; copy it again here'],
    ['broken data', JSON.stringify({ type: 'chart', sourceUrl: 'http://app.test/x', transferData: '{' }), 'Incompatible this chart data']
  ])('refuses %s', (_case, text, error) => {
    expect(pastedWidget(text, origin)).toEqual({ error });
  });
});
