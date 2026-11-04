import { describe, expect, it } from 'vitest';
import { asRecord, type JsonObject } from '@/core/json/json';
import { vizFromSetting } from '@/core/query/vizOptions';
import { ChartType } from './chartType';
import { defaultVizOptions, vizOptionsForType, vizTitleOf } from './defaultVizOptions';
import sent from './builderRequests.fixture.json';

const widgets = sent as Record<string, JsonObject>;

describe('defaultVizOptions', () => {
  it.each(Object.keys(widgets))('gives the options v1 sent for a new %s', key => {
    const widget = asRecord(widgets[key]);
    const chartType = String(asRecord(widget['extra_data'])['current_chart_type']);
    expect(defaultVizOptions(chartType)).toStrictEqual(asRecord(widget['setting'])['options']);
  });

  it.each(Object.values(ChartType))('has defaults for %s', chartType => {
    expect(defaultVizOptions(chartType)).toHaveProperty('class_name');
  });

  it('has none for a type v2 does not build', () => {
    expect(defaultVizOptions('arearange')).toBeUndefined();
  });

  it('builds the types v1 lacked from its source', () => {
    expect(vizFromSetting({ options: defaultVizOptions(ChartType.Spline) }).options.chart).toEqual({ type: 'spline' });
    expect(vizFromSetting({ options: defaultVizOptions(ChartType.LineInverted) }).options.chart).toEqual({ type: 'line', inverted: true });
    expect(vizFromSetting({ options: defaultVizOptions(ChartType.SemiPie) }).options).toMatchObject({ isSemiPie: true, legend: { enabled: false } });
    expect(vizFromSetting({ options: defaultVizOptions(ChartType.TabInnerFilter) }).options).toMatchObject({ displayAs: 'normal', search: { enabled: true } });
  });

  it('turns markers on for the lollipop only, like the running v1', () => {
    const marker = (chartType: string) => vizFromSetting({ options: defaultVizOptions(chartType) }).options.plotOptions?.series?.marker;
    expect(marker(ChartType.Lollipop)).toEqual({ enabled: true });
    expect(marker(ChartType.Column)).toEqual({ enabled: false });
  });

  it('gives the stacked charts their own classes', () => {
    expect(defaultVizOptions(ChartType.StackedBar)).toMatchObject({ class_name: 'stacking_series_chart_setting', options: { chart: { type: 'bar' } } });
    expect(defaultVizOptions(ChartType.CircularBar)).toMatchObject({ class_name: 'circular_bar_chart_setting', options: { chart: { polar: true, inverted: true } } });
  });

  it('gives the pie family their v1 classes and keys', () => {
    expect(defaultVizOptions(ChartType.Funnel)).toMatchObject({
      class_name: 'highcharts_funnel_chart_setting',
      options: { legend: { enabled: false }, neck_width: '20%', plot_options: { funnel: { data_labels: { enabled: true } } } }
    });
    expect(defaultVizOptions(ChartType.Funnel)?.['options']).not.toHaveProperty('theme_color');
    expect(defaultVizOptions(ChartType.Pyramid)).toMatchObject({ class_name: 'highcharts_pyramid_chart_setting', options: { width: '80%', theme_color: { enabled: true } } });
    expect(defaultVizOptions(ChartType.VariablePie)).toMatchObject({
      class_name: 'variablepie_chart_setting',
      options: { chart: { type: 'variablepie' }, x_axis: [], plot_options: { series: { data_labels: { enabled: false } } } }
    });
    expect(defaultVizOptions(ChartType.Parliament)).toMatchObject({ class_name: 'parliament_setting', options: { max_data_point: 1000, plot_options: { item: { data_labels: { enabled: false } } } } });
  });

  it('gives a fresh object each time', () => {
    const first = defaultVizOptions(ChartType.Column);
    expect(first).not.toBe(defaultVizOptions(ChartType.Column));
    expect(asRecord(first?.['options'])['title']).not.toBe(asRecord(defaultVizOptions(ChartType.Column)?.['options'])['title']);
  });
});

describe('vizOptionsForType', () => {
  const titled = (text: string) => ({ class_name: 'x', options: { title: { text } } });

  it("starts from the new type's defaults and keeps the old title", () => {
    const next = vizOptionsForType(ChartType.Pie, titled('Revenue'));
    expect(vizTitleOf(next ?? {})).toBe('Revenue');
    expect(next).toMatchObject({ class_name: 'highcharts_pie_chart_setting', options: { title: { align: 'center', enabled: true, text: 'Revenue' } } });
  });

  it('keeps the default title when the old one is empty', () => {
    expect(vizTitleOf(vizOptionsForType(ChartType.Table, titled('')) ?? {})).toBe('Untitled Chart');
    expect(vizTitleOf(vizOptionsForType(ChartType.Table, {}) ?? {})).toBe('Untitled Chart');
  });

  it('reads a title stored as a string', () => {
    expect(vizTitleOf({ options: { title: 'Plain' } })).toBe('Plain');
  });
});
