import { describe, expect, it } from 'vitest';
import { ChartType } from '@/core/chart-builder/chartType';
import type { VizOptions } from '@/core/query/vizOptions';
import {
  defaultDisplayUnit,
  displayUnitPath,
  hasTitleToggle,
  otherSettingsOf,
  paletteColorsOf,
  themeColorRevert,
  themeColorToggle,
  titleRevert,
  tooltipRevert
} from './commonTabs.utils';

const theme = ['#0', '#1', '#2', '#3', '#4', '#5', '#6', '#7', '#8', '#9', '#10'];

describe('titleRevert', () => {
  it('puts the title style back and keeps its text', () => {
    expect(titleRevert('title')).toEqual({
      'title.enabled': true,
      'title.style.fontFamily': 'var(--widget-primary-font-family, Roboto)',
      'title.style.color': 'var(--text-color)',
      'title.style.fontSize': '20px',
      'title.align': 'center'
    });
  });

  it('uses the secondary style for the subtitle', () => {
    expect(titleRevert('subtitle')).toMatchObject({ 'subtitle.style.fontSize': '11px', 'subtitle.style.color': 'var(--secondary-text-color)' });
    expect(titleRevert('subtitle')).not.toHaveProperty('subtitle.text');
  });
});

describe('hasTitleToggle', () => {
  it.each([
    [ChartType.Table, true],
    [ChartType.CollapseTable, true],
    [ChartType.Column, false],
    [ChartType.Pie, false]
  ])('%s → %s', (chartType, expected) => {
    expect(hasTitleToggle(chartType)).toBe(expected);
  });
});

describe('tooltipRevert', () => {
  it("goes back to the theme's tooltip", () => {
    expect(tooltipRevert()).toEqual({
      'tooltip.style.color': 'var(--text-color)',
      'tooltip.backgroundColor': 'var(--tooltip-background-color)',
      'tooltip.style.fontFamily': 'var(--widget-secondary-font-family, Roboto)'
    });
  });
});

describe('paletteColorsOf', () => {
  it("gives the theme's first ten colors when the chart has none", () => {
    expect(paletteColorsOf({}, theme)).toEqual(theme.slice(0, 10));
  });

  it("takes the chart's colors and fills the rest from the theme", () => {
    expect(paletteColorsOf({ themeColor: { colors: ['#a', '#b'] } } as VizOptions, theme)).toEqual(['#a', '#b', ...theme.slice(2, 10)]);
  });

  it('leaves a color empty when the theme has too few', () => {
    expect(paletteColorsOf({}, ['#a'])).toEqual(['#a', '', '', '', '', '', '', '', '', '']);
  });
});

describe('themeColorToggle', () => {
  it('only turns the theme colors on', () => {
    expect(themeColorToggle(true, theme)).toEqual({ 'themeColor.enabled': true });
  });

  it('keeps the colors shown when turning them off', () => {
    const changes = themeColorToggle(false, ['#a', '#b']);
    expect(changes).toEqual({ 'themeColor.enabled': false, 'themeColor.colors[0]': '#a', 'themeColor.colors[1]': '#b' });
  });
});

describe('themeColorRevert', () => {
  it("turns the theme colors on and resets the ten colors to the theme's", () => {
    const changes = themeColorRevert(theme);
    expect(changes['themeColor.enabled']).toBe(true);
    expect(changes['themeColor.colors[9]']).toBe('#9');
    expect(changes).not.toHaveProperty('themeColor.colors[10]');
  });
});

describe('otherSettingsOf', () => {
  it('gives series charts number formats, drilldown and zoom', () => {
    expect(otherSettingsOf(ChartType.Column)).toEqual({ numberFormat: true, crossFilter: false, drilldown: true, zoom: true });
  });

  it('gives pies cross filtering', () => {
    expect(otherSettingsOf(ChartType.Pie)).toMatchObject({ crossFilter: true, drilldown: true });
  });

  it('gives filters no number format', () => {
    expect(otherSettingsOf(ChartType.DropDown)).toEqual({ numberFormat: false, crossFilter: false, drilldown: false, zoom: false });
  });

  it('gives a spline no drilldown or zoom, like v1', () => {
    expect(otherSettingsOf(ChartType.Spline)).toMatchObject({ drilldown: false, zoom: false });
  });
});

describe('displayUnitPath', () => {
  it.each([
    [ChartType.Column, 'plotOptions.series.dataLabels.displayUnit'],
    [ChartType.Donut, 'plotOptions.pie.dataLabels.displayUnit'],
    [ChartType.Table, 'plotOptions.table.dataLabels.displayUnit'],
    [ChartType.CollapseTable, 'plotOptions.table.dataLabels.displayUnit'],
    [ChartType.Number, 'plotOptions.kpi.dataLabels.displayUnit']
  ])('%s → %s', (chartType, path) => {
    expect(displayUnitPath(chartType)).toBe(path);
  });
});

describe('defaultDisplayUnit', () => {
  it('shows plain numbers in tables', () => {
    expect(defaultDisplayUnit(ChartType.Table)).toBe('none');
    expect(defaultDisplayUnit(ChartType.CollapseTable)).toBe('none');
    expect(defaultDisplayUnit(ChartType.Line)).toBe('default');
  });
});
