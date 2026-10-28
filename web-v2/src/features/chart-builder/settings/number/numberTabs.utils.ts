import { get } from 'lodash-es';
import type { VizChanges } from '@/core/chart-builder/vizChanges';
import type { VizOptions } from '@/core/query/vizOptions';
import { SECONDARY_FONT, TEXT_COLOR, type SettingOption } from '../settingOptions';
import iconGroups from './kpiIcons.json';
import themes from './kpiThemes.json';

/** The tabs of number charts (v1 `NumberSetting`): theme, icon and the value's label. */

type ThemeSetting = Readonly<Record<string, unknown>>;

const THEMES = themes as Readonly<Record<string, ThemeSetting>>;
const DEFAULT_THEME = 'style_1';

/** v1 `ThemeTab.themes`: the six themes v1 offers, with their preview images. */
export const KPI_THEMES: readonly { id: string; image: string }[] = [
  { id: 'style_1', image: 'theme_1' },
  { id: 'style_2', image: 'theme_2' },
  { id: 'style_3', image: 'theme_3' },
  { id: 'style_4', image: 'theme_4' },
  { id: 'style_5', image: 'theme_5' },
  { id: 'style_area_1', image: 'style_area_1' }
].map(({ id, image }) => ({ id, image: `/chart-builder/kpi-themes/${image}.jpg` }));

/** What a theme keeps from the chart (v1 `ThemeTab.handleThemeChanged`): its texts, icon and trend line choices. */
const KEPT: Readonly<Record<string, readonly string[]>> = {
  title: ['text'],
  subtitle: ['text'],
  prefix: ['text'],
  postfix: ['text'],
  icon: ['iconClass'],
  trendLine: ['enabled', 'trendBy', 'displayAs']
};

/** A theme replaces each of its keys (`title`, `style`, `icon`, ...) whole, keeping the chart's own texts and icon. */
export function kpiThemeChanges(themeId: string, viz: VizOptions): VizChanges {
  const theme = THEMES[themeId] ?? {};
  return Object.fromEntries(
    Object.entries(theme).map(([key, value]) => {
      const kept = KEPT[key];
      if (!kept) return [key, value];
      const own = Object.fromEntries(kept.map(prop => [prop, get(viz, [key, prop])]).filter(([, propValue]) => propValue !== undefined));
      return [key, { ...(value as object), ...own }];
    })
  );
}

interface KpiIcon {
  enabled: boolean;
  color: string;
  background: string;
  border: string;
  iconClass: string;
  borderColor?: string;
  [key: string]: unknown;
}

/** The icon of the chart's theme (v1 `IconSettingTab.defaultSetting`), style 1's without a theme. */
export function kpiIconDefaults(viz: VizOptions): KpiIcon {
  const theme = typeof viz['theme'] === 'string' ? THEMES[viz['theme']] : undefined;
  return ((theme ?? THEMES[DEFAULT_THEME])?.['icon'] ?? {}) as KpiIcon;
}

/**
 * v1 `IconSettingTab.handleEnableIconSetting`: a chart without an icon gets its theme's. v1 did that even when turning
 * the icon off, which turned it on; v2 keeps the choice.
 */
export function iconToggle(enabled: boolean, viz: VizOptions): VizChanges {
  if (typeof get(viz, 'icon.iconClass') === 'string') return { 'icon.enabled': enabled };
  return { icon: { ...kpiIconDefaults(viz), enabled } };
}

/** v1 `IconSettingTab.handleRevert`: the theme's icon, color, shape and background. */
export function iconRevert(viz: VizOptions): VizChanges {
  const icon = kpiIconDefaults(viz);
  return {
    'icon.iconClass': icon.iconClass,
    'icon.color': icon.color,
    'icon.border': icon.border,
    'icon.borderColor': icon.borderColor,
    'icon.background': icon.background
  };
}

/** v1 `IconConstant.IconBorders`: the icon's corner radius. */
export const ICON_SHAPES: readonly SettingOption[] = [
  { label: 'Light border', value: '4px' },
  { label: 'Circle', value: '50%' },
  { label: 'Heavy border', value: '12px' },
  { label: 'Square', value: '0' }
];

export interface IconGroup {
  readonly group: string;
  readonly icons: readonly string[];
}

export const KPI_ICON_GROUPS: readonly IconGroup[] = iconGroups;

/** The groups' icons whose class contains the keyword (v1 `IconPicker.allIcons`), without the groups left empty. */
export function searchIcons(groups: readonly IconGroup[], keyword: string): IconGroup[] {
  const text = keyword.trim().toLowerCase();
  if (!text) return [...groups];
  return groups.map(({ group, icons }) => ({ group, icons: icons.filter(icon => icon.includes(text)) })).filter(({ icons }) => icons.length > 0);
}

/** v1 `NumberDataLabelTab.defaultSetting`. */
export const NUMBER_LABEL_DEFAULTS = { fontFamily: SECONDARY_FONT, color: TEXT_COLOR, fontSize: '48px', affixMaxLength: 24 } as const;

/**
 * v1 `NumberDataLabelTab.handleRevert`: the value, prefix and postfix fonts back to default, without their texts kept.
 * v1 also wrote a top-level `displayUnit` nothing read; v2 leaves it out.
 */
export function numberLabelRevert(): VizChanges {
  const { fontFamily, color, fontSize } = NUMBER_LABEL_DEFAULTS;
  return Object.fromEntries(
    ['style', 'prefix.style', 'postfix.style'].flatMap(part => [
      [`${part}.fontFamily`, fontFamily],
      [`${part}.color`, color],
      [`${part}.fontSize`, fontSize]
    ]).concat([
      ['prefix.text', ''],
      ['postfix.text', '']
    ])
  );
}
