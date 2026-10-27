import type { CSSProperties } from 'react';
import { asRecord, asString, getPath, isRecord, type JsonObject } from '@/core/json/json';
import { TabFilterDisplay } from './filter.utils';

/** The title style keys v1 copied from `title.style` onto a filter's title (`TabFilter.titleStyle`). */
const TITLE_STYLE_KEYS = ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'textDecoration'] as const;

/**
 * A filter's title style (v1 `titleStyle`): the stored `title.style`, colored by `ChartOption.getTitleColor`, which is
 * white when the style has no color. The rest comes from v1's `.filter-chart` (14px, normal weight).
 */
export function filterTitleStyle(title: unknown): CSSProperties {
  const style = asRecord(isRecord(title) ? title['style'] : undefined);
  const css: Record<string, string> = {};
  for (const key of TITLE_STYLE_KEYS) {
    const value = style[key];
    if (typeof value === 'string' && value !== '') css[key] = value;
  }
  return { ...css, color: asString(style['color']) || '#fff' };
}

/** Colors of a tab filter's options, as v1 resolved them (`TabFilter.activeColor` and the item components). */
export interface TabFilterColors {
  active: string;
  deActive: string;
  /** Labels of choice items: the setting's `textColor`, white without it (v1 `ChartOption.getTextColor`). */
  text: string;
}

function isChoice(displayAs: string): boolean {
  return displayAs === TabFilterDisplay.MultiChoice || displayAs === TabFilterDisplay.SingleChoice;
}

/**
 * Choices fall back to v1's icon colors (`#57F`, `#9799AC`); tabs and the dropdown to the theme's tab filter colors.
 * v1's selected tab read a misspelled variable (`--tab-filter-backgroundr-active`), so without `activeColor` it had no
 * background; v2 uses the theme's.
 */
export function tabFilterColors(options: JsonObject, displayAs: string): TabFilterColors {
  const choice = isChoice(displayAs);
  const active = asString(options[choice ? 'choiceActiveColor' : 'activeColor']);
  const deActive = asString(options[choice ? 'choiceDeActiveColor' : 'deActiveColor']);
  return {
    active: active || (choice ? '#57F' : 'var(--tab-filter-background-active)'),
    deActive: deActive || (choice ? '#9799AC' : 'var(--tab-filter-background-de-active)'),
    text: asString(options['textColor']) || '#fff'
  };
}

export interface TabFilterLook {
  titleStyle: CSSProperties;
  colors: TabFilterColors;
  displayAs: string;
  direction: 'row' | 'column';
  /** Undefined when the search box is off; it never shows for the dropdown. */
  searchPlaceholder?: string;
  /** Title and options on one line: v1 does it for a row without search box. */
  inline: boolean;
}

/** How a tab filter looks (v1 `TabFilter` + `DefaultTabFilter`), from its viz options. */
export function tabFilterLook(options: JsonObject): TabFilterLook {
  const displayAs = asString(options['displayAs']) || TabFilterDisplay.Normal;
  const direction = options['direction'] === 'column' ? 'column' : 'row';
  const searchEnabled = getPath(options, ['search', 'enabled']) !== false && displayAs !== TabFilterDisplay.DropDown;
  return {
    titleStyle: filterTitleStyle(options['title']),
    colors: tabFilterColors(options, displayAs),
    displayAs,
    direction,
    searchPlaceholder: searchEnabled ? asString(getPath(options, ['search', 'placeholder'])) || 'Search...' : undefined,
    inline: direction === 'row' && !searchEnabled
  };
}

/** The variables `FilterWidget.css` reads for a tab filter's options. */
export function tabFilterCssVars(colors: TabFilterColors): CSSProperties {
  return {
    '--filter-active': colors.active,
    '--filter-de-active': colors.deActive,
    '--filter-choice-text': colors.text
  } as CSSProperties;
}

/**
 * A tree filter's colors as CSS variables (v1 `TreeSelection.treeStyle`). Unset ones fall back to v1's tree defaults
 * (`TreeFilterOption`): v1 drew checkboxes without a border when `deActiveColor` was missing, so they were invisible.
 */
export function treeFilterCssVars(options: JsonObject): CSSProperties {
  const item = asRecord(getPath(options, ['choice', 'style']));
  const vars: Record<string, string> = {
    '--tree-active': asString(options['activeColor']) || 'var(--tab-filter-background-active)',
    '--tree-de-active': asString(options['deActiveColor']) || '#9799AC'
  };
  const optional: Record<string, unknown> = {
    '--tree-switch-color': options['switchColor'],
    '--tree-item-color': item['color'],
    '--tree-item-size': item['fontSize']
  };
  for (const [name, value] of Object.entries(optional)) if (typeof value === 'string' && value !== '') vars[name] = value;
  return vars as CSSProperties;
}
