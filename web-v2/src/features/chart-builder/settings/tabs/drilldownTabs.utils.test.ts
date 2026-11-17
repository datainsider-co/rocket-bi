import { describe, expect, it } from 'vitest';
import { ChartType } from '@/core/chart-builder/chartType';
import { defaultVizOptions } from '@/core/chart-builder/defaultVizOptions';
import { applyVizChanges, vizOptionsOf } from '@/core/chart-builder/vizChanges';
import { withLevelLabels } from './drilldownTabs.utils';
import { dataLabelRevert } from './seriesTabs.utils';

describe('withLevelLabels', () => {
  it("writes the labels' switch under the first level too, like v1", () => {
    expect(withLevelLabels({ 'plotOptions.series.dataLabels.enabled': true })).toEqual({
      'plotOptions.series.dataLabels.enabled': true,
      'plotOptions.series.levels[0].dataLabels.enabled': true
    });
  });

  it("writes the labels' color under the first level too", () => {
    expect(withLevelLabels({ 'plotOptions.series.dataLabels.style.color': '#abc' })).toEqual({
      'plotOptions.series.dataLabels.style.color': '#abc',
      'plotOptions.series.levels[0].dataLabels.style.color': '#abc'
    });
  });

  it('leaves the other label settings, and other tabs, as they are', () => {
    const font = { 'plotOptions.series.dataLabels.style.fontSize': '14px' };
    expect(withLevelLabels(font)).toBe(font);
    const title = { 'title.text': 'Revenue', 'plotOptions.pie.dataLabels.enabled': true };
    expect(withLevelLabels(title)).toBe(title);
    expect(withLevelLabels({})).toEqual({});
  });

  it('mirrors a revert, and does not change what it was given', () => {
    const revert = dataLabelRevert(ChartType.ColumnDrilldown);
    const before = { ...revert };
    expect(withLevelLabels(revert)).toMatchObject({
      ...revert,
      'plotOptions.series.levels[0].dataLabels.enabled': false,
      'plotOptions.series.levels[0].dataLabels.style.color': 'var(--text-color)'
    });
    expect(revert).toEqual(before);
  });

  it('stores the level as v1 did, under snake_case keys', () => {
    const stored = defaultVizOptions(ChartType.PieDrilldown) ?? {};
    const next = applyVizChanges(stored, withLevelLabels({ 'plotOptions.series.dataLabels.enabled': true }));
    expect(next['options']).toMatchObject({ plot_options: { series: { data_labels: { enabled: true }, levels: [{ data_labels: { enabled: true } }] } } });
    expect(vizOptionsOf(next).plotOptions?.series?.dataLabels).toMatchObject({ enabled: true, style: { color: 'var(--text-color)' } });
  });
});
