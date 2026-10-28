import { describe, expect, it } from 'vitest';
import { ChartType } from '@/core/chart-builder/chartType';
import type { VizOptions } from '@/core/query/vizOptions';
import { displayAsOf, filterControlKindOf, filterTitleRevert, isInnerFilter, tabColorKeys, tabControlRevert, tabControlSettingsOf, treeControlRevert } from './filterTabs.utils';

describe('filterControlKindOf', () => {
  it.each([
    [ChartType.TabFilter, 'tab'],
    [ChartType.MultiChoice, 'tab'],
    [ChartType.DropDown, 'tab'],
    [ChartType.TabInnerFilter, 'tab'],
    [ChartType.SlicerFilter, 'slicer'],
    [ChartType.DateSelectFilter, 'date'],
    [ChartType.InputFilter, 'input'],
    [ChartType.SingleTreeFilter, 'tree'],
    [ChartType.Column, undefined]
  ])('%s → %s', (chartType, kind) => {
    expect(filterControlKindOf(chartType)).toBe(kind);
  });
});

describe('isInnerFilter', () => {
  it('tells inner filters apart', () => {
    expect(isInnerFilter(ChartType.DropDownInnerFilter)).toBe(true);
    expect(isInnerFilter(ChartType.TabInnerFilter)).toBe(true);
    expect(isInnerFilter(ChartType.DropDown)).toBe(false);
  });
});

describe('filterTitleRevert', () => {
  it('resets the title style in the secondary font', () => {
    expect(filterTitleRevert()).toEqual({
      'title.enabled': true,
      'title.style.fontFamily': 'var(--widget-secondary-font-family, Roboto)',
      'title.style.color': 'var(--text-color)',
      'title.style.fontSize': '20px'
    });
  });
});

describe('displayAsOf', () => {
  it('reads the display, a tab by default', () => {
    expect(displayAsOf({ displayAs: 'drop_down' } as VizOptions)).toBe('drop_down');
    expect(displayAsOf({})).toBe('normal');
  });
});

describe('tabControlSettingsOf', () => {
  it('gives a tab filter everything', () => {
    expect(tabControlSettingsOf(ChartType.TabFilter, 'normal')).toEqual({ direction: true, colors: true, search: true });
  });

  it('gives a dropdown nothing of the tab look', () => {
    expect(tabControlSettingsOf(ChartType.DropDown, 'drop_down')).toEqual({ direction: false, colors: false, search: false });
  });

  it('gives inner filters no direction', () => {
    expect(tabControlSettingsOf(ChartType.TabInnerFilter, 'normal')).toEqual({ direction: false, colors: true, search: true });
  });
});

describe('tabColorKeys', () => {
  it('uses the choice colors for radios and checkboxes', () => {
    expect(tabColorKeys('single_choice')).toEqual({ active: 'choiceActiveColor', deActive: 'choiceDeActiveColor' });
    expect(tabColorKeys('normal')).toEqual({ active: 'activeColor', deActive: 'deActiveColor' });
  });
});

describe('tabControlRevert / treeControlRevert', () => {
  it('resets the look and keeps the default value', () => {
    expect(tabControlRevert()).toMatchObject({ direction: 'row', 'search.enabled': true, 'search.placeholder': 'Search...' });
    expect(tabControlRevert()).not.toHaveProperty(['default.setting']);
  });

  it("resets the tree's colors", () => {
    expect(treeControlRevert()).toEqual({ activeColor: 'var(--tab-filter-background-active)', deActiveColor: '#9799AC' });
  });
});
