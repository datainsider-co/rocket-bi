import { ChartType } from '@/core/chart-builder/chartType';
import type { VizChanges } from '@/core/chart-builder/vizChanges';
import type { VizOptions } from '@/core/query/vizOptions';
import { PRIMARY_FONT, SECONDARY_FONT, SECONDARY_TEXT_COLOR, TEXT_COLOR } from '../settingOptions';

/** What the Title & Subtitle tab shows for a missing value (v1 `TitleTab.defaultStyle`). */
export const TITLE_DEFAULTS = {
  title: { text: 'Untitled chart', enabled: true, fontFamily: PRIMARY_FONT, color: TEXT_COLOR, fontSize: '20px', align: 'center' },
  subtitle: { text: '', enabled: true, fontFamily: SECONDARY_FONT, color: SECONDARY_TEXT_COLOR, fontSize: '11px', align: 'center' }
} as const;

export type TitleKey = keyof typeof TITLE_DEFAULTS;

/** v1 `TitleTab.handleRevertTitle`: the style back to default, the text kept. */
export function titleRevert(key: TitleKey): VizChanges {
  const { enabled, fontFamily, color, fontSize, align } = TITLE_DEFAULTS[key];
  return {
    [`${key}.enabled`]: enabled,
    [`${key}.style.fontFamily`]: fontFamily,
    [`${key}.style.color`]: color,
    [`${key}.style.fontSize`]: fontSize,
    [`${key}.align`]: align
  };
}

const TABLES = new Set<string>([ChartType.Table, ChartType.CollapseTable]);

/** v1 shows the title and subtitle toggles on tables only; other charts always show them. */
export function hasTitleToggle(chartType: string): boolean {
  return TABLES.has(chartType);
}

/**
 * The tooltip's defaults. v1's tab reverted to a dark tooltip (`#333645`, white text) whatever the theme; v2 reverts to
 * the theme's, which is what a new chart gets.
 */
export const TOOLTIP_DEFAULTS = { color: TEXT_COLOR, backgroundColor: 'var(--tooltip-background-color)', fontFamily: SECONDARY_FONT } as const;

export function tooltipRevert(): VizChanges {
  return {
    'tooltip.style.color': TOOLTIP_DEFAULTS.color,
    'tooltip.backgroundColor': TOOLTIP_DEFAULTS.backgroundColor,
    'tooltip.style.fontFamily': TOOLTIP_DEFAULTS.fontFamily
  };
}

/** The card's background when the chart keeps the theme's. */
export const THEME_BACKGROUND = 'var(--chart-background-color)';

/** v1's Data Color tab edits the first ten colors. */
export const PALETTE_SIZE = 10;

/** The chart's ten colors: its own, or the theme's where it has none (v1 `ColorTab`). */
export function paletteColorsOf(viz: VizOptions, themeColors: readonly string[]): string[] {
  const own = viz.themeColor?.colors ?? [];
  return Array.from({ length: PALETTE_SIZE }, (_, index) => own[index] ?? themeColors[index] ?? '');
}

function colorChanges(colors: readonly string[]): VizChanges {
  return Object.fromEntries(colors.map((color, index) => [`themeColor.colors[${index}]`, color]));
}

/** v1 `ColorTab.handleThemeColorEnabled`: turning the theme's colors off starts from the colors shown. */
export function themeColorToggle(enabled: boolean, shown: readonly string[]): VizChanges {
  return enabled ? { 'themeColor.enabled': true } : { 'themeColor.enabled': false, ...colorChanges(shown) };
}

export function themeColorRevert(themeColors: readonly string[]): VizChanges {
  return { 'themeColor.enabled': true, ...colorChanges(Array.from({ length: PALETTE_SIZE }, (_, index) => themeColors[index] ?? '')) };
}

const FILTERS = new Set<string>([
  ChartType.TabFilter,
  ChartType.SingleChoice,
  ChartType.MultiChoice,
  ChartType.DropDown,
  ChartType.SlicerFilter,
  ChartType.DateSelectFilter,
  ChartType.InputFilter,
  ChartType.SingleTreeFilter,
  ChartType.MultiTreeFilter,
  ChartType.DropDownInnerFilter,
  ChartType.TabInnerFilter
]);
const PIES = new Set<string>([ChartType.Pie, ChartType.SemiPie, ChartType.Donut]);
/** v1 `VisualHeaderConfigs.drilldownWidgets` and `zoomWidgets`, for the types v2 builds: the same set. */
const DRILL_AND_ZOOM = new Set<string>([ChartType.Pie, ChartType.Bar, ChartType.Column, ChartType.Line, ChartType.Area, ChartType.StackedBar, ChartType.StackedColumn]);

/** Which settings the Other tab shows (v1 `VisualHeader`). */
export function otherSettingsOf(chartType: string) {
  return {
    /** Display unit and precision; filters have no numbers to format. */
    numberFormat: !FILTERS.has(chartType),
    crossFilter: chartType === ChartType.Pie,
    drilldown: DRILL_AND_ZOOM.has(chartType),
    zoom: DRILL_AND_ZOOM.has(chartType)
  };
}

/**
 * Where the display unit lives (v1 `VisualHeader.seriesKey`). v1 wrote a donut's under `series`, where its renderer
 * never read it; v2 writes it under `pie`, like the Data Label tab.
 */
export function displayUnitPath(chartType: string): string {
  if (PIES.has(chartType)) return 'plotOptions.pie.dataLabels.displayUnit';
  if (TABLES.has(chartType)) return 'plotOptions.table.dataLabels.displayUnit';
  if (chartType === ChartType.Number) return 'plotOptions.kpi.dataLabels.displayUnit';
  return 'plotOptions.series.dataLabels.displayUnit';
}

/** v1: tables show plain numbers unless told otherwise. */
export function defaultDisplayUnit(chartType: string): string {
  return TABLES.has(chartType) ? 'none' : 'default';
}
