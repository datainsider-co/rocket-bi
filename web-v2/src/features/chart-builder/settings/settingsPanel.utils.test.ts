import { describe, expect, it } from 'vitest';
import { ChartType } from '@/core/chart-builder/chartType';
import type { VisualizationResponse } from '@/core/query/VisualizationResponse';
import { hasStackTab, isLegendFirst, seriesResponseOf, settingsKindOf } from './settingsPanel.utils';

describe('settingsKindOf', () => {
  it.each([ChartType.Column, ChartType.Bar, ChartType.Lollipop, ChartType.Line, ChartType.Spline, ChartType.LineInverted, ChartType.Area, ChartType.AreaInverted])('gives %s the series settings', chartType => {
    expect(settingsKindOf(chartType)).toBe('series');
  });

  it.each([ChartType.StackedColumn, ChartType.StackedBar, ChartType.CircularBar])('gives %s the stacked settings', chartType => {
    expect(settingsKindOf(chartType)).toBe('stacked');
  });

  it.each([ChartType.Pie, ChartType.SemiPie, ChartType.Donut, ChartType.VariablePie, ChartType.Funnel, ChartType.Pyramid])('gives %s the pie settings', chartType => {
    expect(settingsKindOf(chartType)).toBe('pie');
  });

  it('gives the parliament its own settings', () => {
    expect(settingsKindOf(ChartType.Parliament)).toBe('parliament');
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

describe('isLegendFirst', () => {
  it('puts the legend first on pies, after the title on funnels and pyramids, like v1', () => {
    expect(isLegendFirst(ChartType.Pie)).toBe(true);
    expect(isLegendFirst(ChartType.VariablePie)).toBe(true);
    expect(isLegendFirst(ChartType.Funnel)).toBe(false);
    expect(isLegendFirst(ChartType.Pyramid)).toBe(false);
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
