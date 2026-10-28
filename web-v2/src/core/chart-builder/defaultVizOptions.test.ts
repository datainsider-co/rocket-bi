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
