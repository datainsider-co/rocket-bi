import { describe, expect, it } from 'vitest';
import fixture from '@/core/dashboard/dashboard.fixture.json';
import { vizFromSetting, vizKey, vizToStored } from './vizOptions';

const columnSetting = fixture.widgets.find(widget => widget.id === 4)!.setting as Record<string, unknown>;

describe('vizFromSetting', () => {
  it('reads stored snake_case options as Highcharts options', () => {
    const viz = vizFromSetting(columnSetting);
    expect(viz.className).toBe('highcharts_series_chart_setting');
    expect(viz.options.chart?.type).toBe('column');
    expect(viz.options.affectedByFilter).toBe(true);
    expect(viz.options.plotOptions?.series?.dataLabels).toMatchObject({ enabled: false, style: { textOutline: 0 } });
    expect((viz.options.xAxis as { gridLineWidth?: string }[])[0]?.gridLineWidth).toBe('0');
    expect(viz.options.title).toMatchObject({ text: 'Revenue by region', style: { fontFamily: 'var(--widget-primary-font-family, Roboto)' } });
  });

  it('converts data keys the way v1 did', () => {
    const viz = vizFromSetting({ options: { options: { plot_options: { series: { response: { total_revenue: { color: '#f00' } } } } } } });
    // v1 looked the series "Total Revenue" up as camelCase("Total Revenue").
    expect(viz.options.plotOptions?.series).toMatchObject({ response: { [vizKey('Total Revenue')]: { color: '#f00' } } });
  });

  it('tolerates a setting without options', () => {
    expect(vizFromSetting({})).toEqual({ className: '', options: {} });
  });
});

describe('vizToStored', () => {
  it('writes the stored shape back', () => {
    expect(vizToStored(vizFromSetting(columnSetting))).toEqual(columnSetting['options']);
  });
});
