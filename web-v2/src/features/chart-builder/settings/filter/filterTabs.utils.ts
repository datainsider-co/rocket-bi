import { ChartType } from '@/core/chart-builder/chartType';
import type { VizChanges } from '@/core/chart-builder/vizChanges';
import type { VizOptions } from '@/core/query/vizOptions';
import { SECONDARY_FONT, TEXT_COLOR, type SettingOption } from '../settingOptions';

/** The tabs of filter widgets (v1 `TabFilterSetting`, `SlicerFilterSetting`, `DateFilterSetting`, ...). */

export type FilterControlKind = 'tab' | 'slicer' | 'date' | 'input' | 'tree';

const CONTROL_KINDS: Readonly<Record<string, FilterControlKind>> = {
  [ChartType.TabFilter]: 'tab',
  [ChartType.SingleChoice]: 'tab',
  [ChartType.MultiChoice]: 'tab',
  [ChartType.DropDown]: 'tab',
  [ChartType.DropDownInnerFilter]: 'tab',
  [ChartType.TabInnerFilter]: 'tab',
  [ChartType.SlicerFilter]: 'slicer',
  [ChartType.DateSelectFilter]: 'date',
  [ChartType.InputFilter]: 'input',
  [ChartType.SingleTreeFilter]: 'tree',
  [ChartType.MultiTreeFilter]: 'tree'
};

/** Which control tab a filter has; `undefined` for a chart that is not a filter. */
export function filterControlKindOf(chartType: string): FilterControlKind | undefined {
  return CONTROL_KINDS[chartType];
}

/** A chart's own filter (v1 `DropDownFilter`, `TabInnerFilter`): no title, background or direction. */
export function isInnerFilter(chartType: string): boolean {
  return chartType === ChartType.DropDownInnerFilter || chartType === ChartType.TabInnerFilter;
}

/** v1 `FilterTitleTab.defaultStyle`: a filter's title is in the secondary font. */
export const FILTER_TITLE_DEFAULTS = { text: 'Untitled chart', enabled: true, fontFamily: SECONDARY_FONT, color: TEXT_COLOR, fontSize: '20px' } as const;

/** v1 `FilterTitleTab.handleRevert`: the style back, the text kept. */
export function filterTitleRevert(): VizChanges {
  const { enabled, fontFamily, color, fontSize } = FILTER_TITLE_DEFAULTS;
  return { 'title.enabled': enabled, 'title.style.fontFamily': fontFamily, 'title.style.color': color, 'title.style.fontSize': fontSize };
}

const DROPDOWN = 'drop_down';
const CHOICES = new Set(['single_choice', 'multi_choice']);

export function displayAsOf(viz: VizOptions): string {
  return typeof viz['displayAs'] === 'string' && viz['displayAs'] !== '' ? viz['displayAs'] : 'normal';
}

/** Which tab control settings a filter shows (v1 `TabFilterControlTab`): a dropdown has none of the tab's look. */
export function tabControlSettingsOf(chartType: string, displayAs: string) {
  const dropdown = displayAs === DROPDOWN;
  return { direction: !dropdown && !isInnerFilter(chartType), colors: !dropdown, search: !dropdown };
}

/**
 * Where a tab filter's colors live: choices (radio, checkbox) have their own (v1 `TabFilterControlTab`). v1 saved the
 * inactive color under `deActiveColor` but read `deactivateColor`; v2 reads and writes `deActiveColor`, which the
 * renderers read.
 */
export function tabColorKeys(displayAs: string): { active: string; deActive: string } {
  return CHOICES.has(displayAs) ? { active: 'choiceActiveColor', deActive: 'choiceDeActiveColor' } : { active: 'activeColor', deActive: 'deActiveColor' };
}

/** v1 `Direction`. */
export const DIRECTIONS: readonly SettingOption[] = [
  { label: 'Row', value: 'row' },
  { label: 'Column', value: 'column' }
];

/**
 * v1 `TabFilterControlTab.handleRevert`. v1 also dropped the default value; v2 keeps it, it has its own Reset.
 */
export function tabControlRevert(): VizChanges {
  return {
    direction: 'row',
    activeColor: 'var(--tab-filter-background-active)',
    deActiveColor: 'var(--tab-filter-background-de-active)',
    choiceActiveColor: 'var(--choice-filter-background-active)',
    choiceDeActiveColor: 'var(--choice-filter-background-de-active)',
    'search.enabled': true,
    'search.placeholder': 'Search...'
  };
}

/** v1 `TreeFilterControlTab.handleRevert`: the tree's default colors (v1 `TreeFilterOption`). */
export function treeControlRevert(): VizChanges {
  return { activeColor: 'var(--tab-filter-background-active)', deActiveColor: '#9799AC' };
}
