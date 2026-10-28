import { describe, expect, it } from 'vitest';
import { applyVizChanges, vizOptionsOf } from './vizChanges';

const stored = {
  class_name: 'highcharts_series_chart_setting',
  options: {
    title: { text: 'Sales', style: { font_size: '20px' } },
    y_axis: [{ visible: true }, { visible: false }],
    plot_options: { series: { response: { total_revenue: { name: 'Revenue' } } } }
  }
};

describe('vizOptionsOf', () => {
  it('reads the options in camelCase', () => {
    expect(vizOptionsOf(stored)).toEqual({
      title: { text: 'Sales', style: { fontSize: '20px' } },
      yAxis: [{ visible: true }, { visible: false }],
      plotOptions: { series: { response: { totalRevenue: { name: 'Revenue' } } } }
    });
  });

  it('reads nothing from empty options', () => {
    expect(vizOptionsOf({})).toEqual({});
  });
});

describe('applyVizChanges', () => {
  it('sets camelCase paths and stores them snake_case', () => {
    const next = applyVizChanges(stored, { 'title.style.fontFamily': 'Roboto', 'yAxis[1].visible': true });
    expect(next).toEqual({
      class_name: 'highcharts_series_chart_setting',
      options: {
        title: { text: 'Sales', style: { font_size: '20px', font_family: 'Roboto' } },
        y_axis: [{ visible: true }, { visible: true }],
        plot_options: { series: { response: { total_revenue: { name: 'Revenue' } } } }
      }
    });
  });

  it('creates missing objects along the path', () => {
    const next = applyVizChanges({ options: {} }, { 'plotOptions.series.response.totalProfit.yAxis': 1 });
    expect(next).toEqual({ options: { plot_options: { series: { response: { total_profit: { y_axis: 1 } } } } } });
  });

  it('removes a key set to undefined', () => {
    const next = applyVizChanges(stored, { 'title.style.fontSize': undefined });
    expect(next['options']).toMatchObject({ title: { text: 'Sales', style: {} } });
  });

  it('keeps the stored options untouched', () => {
    const before = structuredClone(stored);
    applyVizChanges(stored, { 'title.text': 'Profit', 'yAxis[0].visible': false });
    expect(stored).toEqual(before);
  });

  it('changes nothing without changes', () => {
    expect(applyVizChanges(stored, {})).toEqual(stored);
  });
});
