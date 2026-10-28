import { describe, expect, it } from 'vitest';
import { defaultVizOptions } from '@/core/chart-builder/defaultVizOptions';
import { ChartType } from '@/core/chart-builder/chartType';
import { vizFromSetting, type VizOptions } from '@/core/query/vizOptions';
import { headingStyleOf, tableLookOf, tableStyleVars, tableTooltipStyle } from './tableStyle.utils';

const viz = (options: object) => options as VizOptions;
const defaults = vizFromSetting({ options: defaultVizOptions(ChartType.Table) }).options;

describe('tableStyleVars', () => {
  it("reads a new table's options", () => {
    expect(tableStyleVars(defaults)).toEqual({
      '--ft-header-color': 'var(--text-color)',
      '--ft-header-bg': 'var(--header-background-color)',
      '--ft-header-font': 'var(--widget-primary-font-family, Roboto)',
      '--ft-header-size': '12px',
      '--ft-header-align': 'left',
      '--ft-row-even-color': 'var(--text-color)',
      '--ft-row-odd-color': 'var(--text-color)',
      '--ft-row-even-bg': 'var(--row-even-background-color)',
      '--ft-row-odd-bg': 'var(--row-odd-background-color)',
      '--ft-row-font': 'var(--widget-secondary-font-family, Roboto)',
      '--ft-row-size': '12px',
      '--ft-row-padding': '0px',
      '--ft-grid-body-horizontal': '1px solid var(--table-grid-line-color)',
      '--ft-card-bg': 'var(--chart-background-color)',
      '--ft-toggle-bg': 'var(--toggle-color)',
      '--ft-toggle-color': 'var(--text-color)'
    });
  });

  it("reads a new collapse table's header font and toggle", () => {
    const vars = tableStyleVars(vizFromSetting({ options: defaultVizOptions(ChartType.CollapseTable) }).options);
    expect(vars).toMatchObject({ '--ft-header-font': 'var(--widget-secondary-font-family, Roboto)', '--ft-toggle-bg': 'var(--toggle-color)', '--ft-toggle-color': 'var(--text-color)' });
  });

  it('sets nothing it has no value for', () => {
    expect(tableStyleVars(viz({}))).toEqual({});
    expect(tableStyleVars(viz({ header: { style: { color: '' } } }))).toEqual({});
  });

  it('wraps text when asked', () => {
    expect(tableStyleVars(viz({ header: { isWordWrap: true }, value: { style: { isWordWrap: true } } }))).toEqual({ '--ft-header-white-space': 'pre-wrap', '--ft-row-white-space': 'normal' });
  });

  it('draws the grid lines that apply, numbers as pixels', () => {
    const vars = tableStyleVars(viz({ grid: { vertical: { applyHeader: true, applyBody: true, thickness: 2, color: '#fff' }, horizontal: { applyBody: false } } }));
    expect(vars).toEqual({ '--ft-grid-header-vertical': '2px solid #fff', '--ft-grid-body-vertical': '2px solid #fff' });
  });

  it('takes sizes in pixels', () => {
    expect(tableStyleVars(viz({ value: { style: { fontSize: '14' } }, grid: { horizontal: { rowPadding: 4 } } }))).toEqual({ '--ft-row-size': '14px', '--ft-row-padding': '4px' });
  });
});

describe('tableTooltipStyle', () => {
  it('reads the tooltip, the theme by default', () => {
    expect(tableTooltipStyle(viz({ tooltip: { backgroundColor: '#000', valueColor: '#fff' } }))).toEqual({
      background: '#000',
      color: '#fff',
      fontFamily: 'var(--widget-secondary-font-family, Roboto)'
    });
    expect(tableTooltipStyle(viz({})).background).toBe('var(--tooltip-background-color)');
  });
});

describe('headingStyleOf', () => {
  it('reads the font, color and alignment', () => {
    expect(headingStyleOf(viz({ title: { align: 'left', style: { color: '#123', fontFamily: 'Roboto', fontSize: '20px' } } }), 'title')).toEqual({
      color: '#123',
      fontFamily: 'Roboto',
      fontSize: '20px',
      textAlign: 'left'
    });
    expect(headingStyleOf(viz({}), 'subtitle')).toEqual({});
  });
});

describe('tableLookOf', () => {
  it('gathers the look', () => {
    expect(Object.keys(tableLookOf(defaults))).toEqual(['vars', 'tooltip', 'title', 'subtitle']);
  });
});
