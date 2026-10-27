import { describe, expect, it } from 'vitest';
import { ChartType } from '@/core/chart-builder/chartType';
import type { SeriesOneResponse } from '@/core/query/VisualizationResponse';
import type { VizOptions } from '@/core/query/vizOptions';
import {
  axisTabNames,
  axisTitlesOf,
  boundToggle,
  dataLabelPath,
  dataLabelRevert,
  dataLabelSettingsOf,
  displayRevert,
  dualAxisRevert,
  dualAxisToggle,
  gridToggle,
  hasDash,
  hasMarker,
  legendHeightToggle,
  legendRevert,
  legendStyleChanges,
  seriesChoicesOf,
  seriesPath,
  seriesTypeOf,
  stackChanges,
  stackingOf,
  xAxisRevert,
  yAxisRevert,
  yAxisToggle
} from './seriesTabs.utils';

const response: SeriesOneResponse = {
  kind: 'series_one',
  xAxis: ['A'],
  yAxis: [],
  series: [
    { name: 'total_profit', data: [1] },
    { name: 'Revenue', data: [2] }
  ]
};

describe('legendStyleChanges', () => {
  it('styles the legend title and items alike', () => {
    expect(legendStyleChanges('color', '#fff')).toEqual({ 'legend.title.style.color': '#fff', 'legend.itemStyle.color': '#fff' });
  });
});

describe('legendHeightToggle', () => {
  it('starts a manual height at 60', () => {
    expect(legendHeightToggle(true)).toEqual({ 'legend.maxHeight': 60 });
  });

  it('removes the height when turned off', () => {
    expect(legendHeightToggle(false)).toEqual({ 'legend.maxHeight': undefined });
  });
});

describe('legendRevert', () => {
  it('puts the legend back and keeps its layout', () => {
    const changes = legendRevert();
    expect(changes).toMatchObject({ 'legend.enabled': true, 'legend.verticalAlign': 'bottom', 'legend.itemStyle.fontSize': '12px', 'legend.title.text': '' });
    expect(changes).toHaveProperty(['legend.maxHeight'], undefined);
    expect(changes).not.toHaveProperty(['legend.layout']);
  });
});

describe('seriesChoicesOf', () => {
  it('keys the series like v1 and sorts them by name', () => {
    expect(seriesChoicesOf(response)).toEqual([
      { label: 'Revenue', value: 'revenue' },
      { label: 'total_profit', value: 'totalProfit' }
    ]);
  });

  it('gives nothing without a response', () => {
    expect(seriesChoicesOf(undefined)).toEqual([]);
  });

  it('keeps the response untouched', () => {
    seriesChoicesOf(response);
    expect(response.series[0]?.name).toBe('total_profit');
  });
});

describe('seriesTypeOf', () => {
  const viz = { chart: { type: 'column' }, plotOptions: { series: { response: { revenue: { type: 'line' } } } } } as VizOptions;

  it("takes the series' own type", () => {
    expect(seriesTypeOf(viz, 'revenue')).toBe('line');
  });

  it("falls back to the chart's type", () => {
    expect(seriesTypeOf(viz, 'profit')).toBe('column');
  });

  it('falls back to a line', () => {
    expect(seriesTypeOf({}, 'profit')).toBe('line');
  });
});

describe('hasMarker / hasDash', () => {
  it.each([
    ['column', false, false],
    ['bar', false, false],
    ['line', true, true],
    ['spline', true, true],
    ['area', true, true]
  ])('%s → marker %s, dash %s', (type, marker, dash) => {
    expect(hasMarker(type)).toBe(marker);
    expect(hasDash(type)).toBe(dash);
  });
});

describe('displayRevert', () => {
  it("resets the series' display and drops its own type", () => {
    expect(displayRevert('revenue', 'Revenue')).toEqual({
      [seriesPath('revenue', 'lineWidth')]: 2,
      [seriesPath('revenue', 'dashStyle')]: 'Solid',
      [seriesPath('revenue', 'marker.enabled')]: false,
      [seriesPath('revenue', 'type')]: undefined,
      [seriesPath('revenue', 'name')]: 'Revenue',
      [seriesPath('revenue', 'yAxis')]: 0
    });
  });
});

describe('axisTitlesOf', () => {
  it("names the axes after the zones' fields", () => {
    const setting = { x_axis: { name: 'Region' }, y_axis: [{ name: 'Revenue' }, { name: 'Profit' }] };
    expect(axisTitlesOf(setting)).toEqual({ x: 'Region', y: 'Revenue', dual: 'Profit' });
  });

  it('falls back like v1', () => {
    expect(axisTitlesOf(undefined)).toEqual({ x: '', y: 'Untitled', dual: 'Untitled' });
  });
});

describe('axisTabNames', () => {
  it('swaps the names on bars', () => {
    expect(axisTabNames(ChartType.Bar)).toEqual({ x: 'Y Axis', y: 'X Axis' });
    expect(axisTabNames(ChartType.Column)).toEqual({ x: 'X Axis', y: 'Y Axis' });
  });
});

describe('axis reverts', () => {
  it('shows the x axis without gridlines', () => {
    expect(xAxisRevert('Region')).toMatchObject({ 'xAxis[0].visible': true, 'xAxis[0].title.text': 'Region', 'xAxis[0].gridLineWidth': '0', 'xAxis[0].prefix.text': '' });
  });

  it('shows the y axis with gridlines and no range', () => {
    expect(yAxisRevert('Revenue')).toMatchObject({
      'yAxis[0].visible': true,
      'yAxis[0].title.text': 'Revenue',
      'yAxis[0].gridLineWidth': '0.5',
      'yAxis[0].condition.enabled': false,
      'yAxis[0].condition.max.value': 10000
    });
  });

  it('hides the dual axis on the opposite side', () => {
    expect(dualAxisRevert('Profit')).toMatchObject({ 'yAxis[1].visible': false, 'yAxis[1].opposite': true, 'yAxis[1].id': 'dual-axis', 'yAxis[1].title.text': 'Profit' });
  });
});

describe('yAxisToggle', () => {
  it('drops the range when hiding the axis', () => {
    expect(yAxisToggle(false)).toEqual({ 'yAxis[0].visible': false, 'yAxis[0].condition.enabled': false });
    expect(yAxisToggle(true)).toEqual({ 'yAxis[0].visible': true });
  });
});

describe('dualAxisToggle', () => {
  it('moves the second series onto the dual axis', () => {
    expect(dualAxisToggle(true, ['revenue', 'totalProfit'])).toEqual({ 'yAxis[1].visible': true, [seriesPath('totalProfit', 'yAxis')]: 1 });
  });

  it('only shows the axis with a single series', () => {
    expect(dualAxisToggle(true, ['revenue'])).toEqual({ 'yAxis[1].visible': true });
  });

  it('moves every series back when turned off', () => {
    expect(dualAxisToggle(false, ['revenue', 'totalProfit'])).toEqual({
      'yAxis[1].visible': false,
      'yAxis[1].condition.enabled': false,
      [seriesPath('revenue', 'yAxis')]: 0,
      [seriesPath('totalProfit', 'yAxis')]: 0
    });
  });
});

describe('gridToggle', () => {
  it('sets the grid width as v1 did', () => {
    expect(gridToggle('yAxis[0]', true)).toEqual({ 'yAxis[0].gridLineWidth': '0.5' });
    expect(gridToggle('yAxis[0]', false)).toEqual({ 'yAxis[0].gridLineWidth': '0' });
  });
});

describe('boundToggle', () => {
  it('keeps the value shown when turned on', () => {
    expect(boundToggle('yAxis[0].condition.min', true, 5)).toEqual({ 'yAxis[0].condition.min.enabled': true, 'yAxis[0].condition.min.value': 5 });
  });

  it('only turns it off', () => {
    expect(boundToggle('yAxis[0].condition.min', false, 5)).toEqual({ 'yAxis[0].condition.min.enabled': false });
  });
});

describe('dataLabelPath / dataLabelSettingsOf', () => {
  it('puts series labels under series, with a condition', () => {
    expect(dataLabelPath(ChartType.Line)).toBe('plotOptions.series.dataLabels');
    expect(dataLabelSettingsOf(ChartType.Line)).toEqual({ labelFormat: false, distance: false, condition: true });
  });

  it('puts pie labels under pie, with a format and distance', () => {
    expect(dataLabelPath(ChartType.Donut)).toBe('plotOptions.pie.dataLabels');
    expect(dataLabelSettingsOf(ChartType.Pie)).toEqual({ labelFormat: true, distance: true, condition: false });
  });
});

describe('dataLabelRevert', () => {
  it('resets series labels and their condition', () => {
    const changes = dataLabelRevert(ChartType.Column);
    expect(changes).toMatchObject({
      'plotOptions.series.dataLabels.enabled': false,
      'plotOptions.series.dataLabels.condition.enabled': false,
      'plotOptions.series.dataLabels.condition.max': { enabled: false, value: 100 }
    });
    expect(changes).not.toHaveProperty(['plotOptions.series.dataLabels.labelFormat']);
  });

  it('resets pie labels with their format and distance', () => {
    expect(dataLabelRevert(ChartType.Pie)).toMatchObject({ 'plotOptions.pie.dataLabels.labelFormat': 'name_and_value', 'plotOptions.pie.dataLabels.distance': 30 });
  });
});

describe('stackingOf / stackChanges', () => {
  it.each([
    [{ plotOptions: { area: { stacking: 'value' } } }, 'value'],
    [{ plotOptions: { area: { stacking: 'percent' } } }, 'percent'],
    [{ plotOptions: { area: { stacking: 'normal' } } }, 'none'],
    [{}, 'none']
  ])('reads %j as %s', (viz, stacking) => {
    expect(stackingOf(viz as VizOptions)).toBe(stacking);
  });

  it('removes the stacking when off', () => {
    expect(stackChanges('none')).toEqual({ 'plotOptions.area.stacking': undefined });
    expect(stackChanges('percent')).toEqual({ 'plotOptions.area.stacking': 'percent' });
  });
});
