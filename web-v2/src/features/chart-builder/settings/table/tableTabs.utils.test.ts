import { describe, expect, it } from 'vitest';
import type { VizOptions } from '@/core/query/vizOptions';
import { gridRevert, headerRevert, TABLE_THEME_OPTIONS, tableThemeChanges, tableThemeOf, tableTooltipRevert, THICKNESSES, valuesRevert } from './tableTabs.utils';

const viz = (options: object) => options as VizOptions;

describe('table themes', () => {
  it("offers v1's themes", () => {
    expect(TABLE_THEME_OPTIONS.map(option => option.value)).toEqual(['aqua', 'default', 'venus', 'saturn', 'moon', 'mar']);
  });

  it('reads the theme, Default otherwise', () => {
    expect(tableThemeOf(viz({ theme: 'moon' }))).toBe('moon');
    expect(tableThemeOf(viz({ theme: 'style_1' }))).toBe('default');
    expect(tableThemeOf(viz({}))).toBe('default');
  });

  it("writes the theme's name and settings, without the keys nothing reads", () => {
    const changes = tableThemeChanges('saturn');
    expect(changes).toMatchObject({ theme: 'saturn', 'header.backgroundColor': '#BC6E00', 'value.style.fontFamily': 'Arial, sans-serif', background: '#C38307' });
    expect(Object.keys(changes).some(key => key.startsWith('total.') || key === 'value.isWordWrap' || key === 'value.style.color')).toBe(false);
  });

  it('changes nothing for an unknown theme', () => {
    expect(tableThemeChanges('x')).toEqual({});
  });
});

describe('THICKNESSES', () => {
  it('runs from 1px to 10px', () => {
    expect(THICKNESSES[0]).toEqual({ label: '1px', value: '1px' });
    expect(THICKNESSES).toHaveLength(10);
  });
});

describe('reverts', () => {
  it("puts back a new table's grid", () => {
    expect(gridRevert()).toMatchObject({ 'grid.vertical.applyBody': false, 'grid.horizontal.applyBody': true, 'grid.horizontal.rowPadding': '0px' });
  });

  it('puts back the header', () => {
    expect(headerRevert()).toEqual({
      'header.style.fontFamily': 'var(--widget-primary-font-family, Roboto)',
      'header.style.color': 'var(--text-color)',
      'header.style.fontSize': '12px',
      'header.align': 'left',
      'header.backgroundColor': 'var(--header-background-color)',
      'header.isWordWrap': false
    });
  });

  it("puts back the rows' theme colors", () => {
    expect(valuesRevert()).toMatchObject({
      'value.backgroundColor': 'var(--row-even-background-color)',
      'value.alternateBackgroundColor': 'var(--row-odd-background-color)',
      'value.style.isWordWrap': false
    });
  });

  it("puts back a new table's tooltip", () => {
    expect(tableTooltipRevert()).toEqual({
      'tooltip.valueColor': 'var(--secondary-text-color)',
      'tooltip.backgroundColor': 'var(--tooltip-background-color)',
      'tooltip.fontFamily': 'var(--widget-secondary-font-family, Roboto)'
    });
  });
});
