import { ChartType } from '@/core/chart-builder/chartType';
import type { VizChanges } from '@/core/chart-builder/vizChanges';
import { asRecord, isRecord, type JsonObject } from '@/core/json/json';
import { pivotColumnsOf } from '@/core/query/pivotQuery';
import type { VizOptions } from '@/core/query/vizOptions';
import { PRIMARY_FONT, SECONDARY_FONT, TEXT_COLOR, type SettingOption } from '../settingOptions';
import themes from './tableThemes.json';

/** The style tabs of tables (v1 pivot-table `StyleTab`, `GridTab`, `HeaderTab`, `ValuesTab`, `TooltipTab`). */

interface TableTheme {
  readonly key: string;
  readonly name: string;
  readonly settings: Readonly<Record<string, unknown>>;
}

/**
 * v1 `TableTheme.json` (light): each theme sets the grid, header, values, total row, title and card colors. Kept
 * without the keys nothing reads (`value.isWordWrap`, `value.style.align`, `value.style.color`) and without
 * `total.enabled` (a style doesn't hide the totals), and with `Arial` as the font option names it.
 */
const TABLE_THEMES: readonly TableTheme[] = themes;

export const TABLE_THEME_OPTIONS: readonly SettingOption[] = TABLE_THEMES.map(theme => ({ label: theme.name, value: theme.key }));

export function tableThemeOf(viz: VizOptions): string {
  return typeof viz['theme'] === 'string' && TABLE_THEMES.some(theme => theme.key === viz['theme']) ? viz['theme'] : 'default';
}

/**
 * v1 `StyleTab.handleThemeChanged`: the theme's name and every setting of it, the total row's only for a table that has
 * one (v1 wrote them on every table).
 */
export function tableThemeChanges(key: string, withTotals = false): VizChanges {
  const theme = TABLE_THEMES.find(item => item.key === key);
  if (!theme) return {};
  const settings = Object.entries(theme.settings).filter(([path]) => withTotals || !path.startsWith('total.'));
  return { theme: key, ...Object.fromEntries(settings) };
}

/** v1 `GridTab`'s thicknesses. */
export const THICKNESSES: readonly SettingOption[] = Array.from({ length: 10 }, (_, index) => ({ label: `${index + 1}px`, value: `${index + 1}px` }));

/**
 * A new table's grid (v1 `FlattenTableChartOption`): horizontal lines between rows, no vertical ones. v1's tab fell back
 * to, and reverted to, a different grid (the dark theme's).
 */
export const GRID_DEFAULTS = {
  color: 'var(--table-grid-line-color)',
  thickness: '1px',
  vertical: { applyHeader: false, applyBody: false, applyTotal: false },
  horizontal: { applyHeader: true, applyBody: true, applyTotal: true }
} as const;

export function gridRevert(): VizChanges {
  return {
    'grid.vertical.color': GRID_DEFAULTS.color,
    'grid.vertical.thickness': GRID_DEFAULTS.thickness,
    'grid.vertical.applyHeader': false,
    'grid.vertical.applyBody': false,
    'grid.vertical.applyTotal': false,
    'grid.horizontal.color': GRID_DEFAULTS.color,
    'grid.horizontal.thickness': GRID_DEFAULTS.thickness,
    'grid.horizontal.applyHeader': true,
    'grid.horizontal.applyBody': true,
    'grid.horizontal.applyTotal': true,
    'grid.horizontal.rowPadding': '0px'
  };
}

/** v1 `HeaderTab.defaultStyle`. */
export const HEADER_DEFAULTS = {
  fontFamily: PRIMARY_FONT,
  color: TEXT_COLOR,
  fontSize: '12px',
  align: 'left',
  backgroundColor: 'var(--header-background-color)',
  isWordWrap: false
} as const;

export function headerRevert(): VizChanges {
  const { fontFamily, color, fontSize, align, backgroundColor, isWordWrap } = HEADER_DEFAULTS;
  return {
    'header.style.fontFamily': fontFamily,
    'header.style.color': color,
    'header.style.fontSize': fontSize,
    'header.align': align,
    'header.backgroundColor': backgroundColor,
    'header.isWordWrap': isWordWrap
  };
}

/** v1 `ValuesTab.defaultStyle`: even rows, odd rows (alternate), font. */
export const VALUE_DEFAULTS = {
  color: TEXT_COLOR,
  backgroundColor: 'var(--row-even-background-color)',
  alternateColor: TEXT_COLOR,
  alternateBackgroundColor: 'var(--row-odd-background-color)',
  isWordWrap: false,
  fontFamily: SECONDARY_FONT,
  fontSize: '12px'
} as const;

/**
 * v1 `ValuesTab.handleRevert`, without its bugs: v1 wrote `var(----row-even-background-color)` and
 * `--row-odd-background-color` (rows went white and transparent) and reset word wrap at a path nothing reads.
 */
export function valuesRevert(): VizChanges {
  const { color, backgroundColor, alternateColor, alternateBackgroundColor, isWordWrap, fontFamily, fontSize } = VALUE_DEFAULTS;
  return {
    'value.color': color,
    'value.backgroundColor': backgroundColor,
    'value.alternateColor': alternateColor,
    'value.alternateBackgroundColor': alternateBackgroundColor,
    'value.style.isWordWrap': isWordWrap,
    'value.style.fontFamily': fontFamily,
    'value.style.fontSize': fontSize
  };
}

/** A new table's tooltip (v1 reverted its color to the text color, unlike a new table). */
export const TABLE_TOOLTIP_DEFAULTS = { valueColor: 'var(--secondary-text-color)', backgroundColor: 'var(--tooltip-background-color)', fontFamily: SECONDARY_FONT } as const;

export function tableTooltipRevert(): VizChanges {
  const { valueColor, backgroundColor, fontFamily } = TABLE_TOOLTIP_DEFAULTS;
  return { 'tooltip.valueColor': valueColor, 'tooltip.backgroundColor': backgroundColor, 'tooltip.fontFamily': fontFamily };
}

/** A new collapse table's plus / minus square (v1 `CollapseTab.defaultValue`). */
export const TOGGLE_ICON_DEFAULTS = { backgroundColor: 'var(--toggle-color)', color: TEXT_COLOR } as const;

export function toggleIconRevert(): VizChanges {
  return { 'toggleIcon.backgroundColor': TOGGLE_ICON_DEFAULTS.backgroundColor, 'toggleIcon.color': TOGGLE_ICON_DEFAULTS.color };
}

/** v1 pivot `TotalTab.defaultStyle`. */
export const TOTAL_DEFAULTS = {
  enabled: true,
  label: 'Total',
  color: TEXT_COLOR,
  backgroundColor: 'var(--total-background-color)',
  fontFamily: SECONDARY_FONT,
  fontSize: '12px',
  align: 'right'
} as const;

/** v1 `TotalTab.handleRevert`: shown again, its style back, its label kept. */
export function totalRevert(): VizChanges {
  const { enabled, color, backgroundColor, fontFamily, fontSize, align } = TOTAL_DEFAULTS;
  return {
    'total.enabled': enabled,
    'total.label.style.color': color,
    'total.label.style.fontFamily': fontFamily,
    'total.label.style.fontSize': fontSize,
    'total.label.align': align,
    'total.backgroundColor': backgroundColor
  };
}

const isGroupColumn = (column: unknown) => isRecord(column) && asRecord(column['function'])['class_name'] === 'group';

/**
 * v1 `TableSetting.enableCollapseTab` / `PivotSetting.enableCollapseTab`: only tables with rows to expand, a collapse
 * table with two group by columns or more, a pivot table with two row groups or more.
 */
export function hasCollapseTab(chartType: string, setting: JsonObject | undefined): boolean {
  if (!setting) return false;
  if (chartType === ChartType.PivotTable) return pivotColumnsOf(setting, 'rows').length > 1;
  return chartType === ChartType.CollapseTable && pivotColumnsOf(setting, 'columns').filter(isGroupColumn).length > 1;
}
