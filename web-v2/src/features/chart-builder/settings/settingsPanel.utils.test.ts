import { describe, expect, it } from 'vitest';
import { ChartType } from '@/core/chart-builder/chartType';
import type { VisualizationResponse } from '@/core/query/VisualizationResponse';
import { hasStackTab, seriesResponseOf, settingsKindOf } from './settingsPanel.utils';

describe('settingsKindOf', () => {
  it.each([ChartType.Column, ChartType.Bar, ChartType.Lollipop, ChartType.Line, ChartType.Spline, ChartType.LineInverted, ChartType.Area, ChartType.AreaInverted])('gives %s the series settings', chartType => {
    expect(settingsKindOf(chartType)).toBe('series');
  });

  it.each([ChartType.StackedColumn, ChartType.StackedBar, ChartType.CircularBar])('gives %s the stacked settings', chartType => {
    expect(settingsKindOf(chartType)).toBe('stacked');
  });

  it.each([ChartType.Pie, ChartType.SemiPie, ChartType.Donut])('gives %s the pie settings', chartType => {
    expect(settingsKindOf(chartType)).toBe('pie');
  });

  it('gives number charts and tables their settings', () => {
    expect(settingsKindOf(ChartType.Number)).toBe('number');
    expect(settingsKindOf(ChartType.Table)).toBe('table');
    expect(settingsKindOf(ChartType.CollapseTable)).toBe('table');
    expect(settingsKindOf(ChartType.PivotTable)).toBe('table');
  });

  it.each([ChartType.DropDown, ChartType.DropDownInnerFilter, ChartType.SlicerFilter, ChartType.MultiTreeFilter])('gives %s the filter settings', chartType => {
    expect(settingsKindOf(chartType)).toBe('filter');
  });

  it.each(['arearange', 'gauge'])('has none yet for %s', chartType => {
    expect(settingsKindOf(chartType)).toBeUndefined();
  });
});

describe('hasStackTab', () => {
  it('stacks areas only', () => {
    expect(hasStackTab(ChartType.Area)).toBe(true);
    expect(hasStackTab(ChartType.AreaInverted)).toBe(false);
    expect(hasStackTab(ChartType.Column)).toBe(false);
  });
});

describe('seriesResponseOf', () => {
  it('keeps a series response', () => {
    const response: VisualizationResponse = { kind: 'series_one', series: [], xAxis: [], yAxis: [] };
    expect(seriesResponseOf(response)).toBe(response);
  });

  it('drops other responses', () => {
    expect(seriesResponseOf({ kind: 'table', headers: [], records: [], total: 0 })).toBeUndefined();
    expect(seriesResponseOf(undefined)).toBeUndefined();
  });
});
