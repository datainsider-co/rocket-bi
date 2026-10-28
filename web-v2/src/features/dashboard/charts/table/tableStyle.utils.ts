import type { CSSProperties } from 'react';
import { get } from 'lodash-es';
import type { VizOptions } from '@/core/query/vizOptions';

/**
 * A table's look from its viz options (v1 `TableStyleUtils.getTableSettingStyle`), as CSS variables on the table. The
 * stored colors are often the theme's own variables (`var(--header-background-color)`), so v2 names its variables
 * apart (`--ft-*`) instead of resolving them to hex as v1 did.
 */

function text(options: VizOptions, path: string): string | undefined {
  const value: unknown = get(options, path);
  if (typeof value === 'number') return String(value);
  return typeof value === 'string' && value !== '' ? value : undefined;
}

/** v1 `toPx`: a bare number is pixels. */
function px(value: string | undefined): string | undefined {
  return value !== undefined && /^\d+(\.\d+)?$/.test(value) ? `${value}px` : value;
}

/** A grid line when it applies to that part (v1: `<thickness> solid <color>`). */
function gridLine(options: VizOptions, direction: 'vertical' | 'horizontal', part: 'applyHeader' | 'applyBody'): string | undefined {
  if (get(options, ['grid', direction, part]) !== true) return undefined;
  return `${px(text(options, `grid.${direction}.thickness`)) ?? '1px'} solid ${text(options, `grid.${direction}.color`) ?? 'var(--table-grid-line-color)'}`;
}

export function tableStyleVars(options: VizOptions): CSSProperties {
  const vars: Record<string, string | undefined> = {
    '--ft-header-color': text(options, 'header.style.color'),
    '--ft-header-bg': text(options, 'header.backgroundColor'),
    '--ft-header-font': text(options, 'header.style.fontFamily'),
    '--ft-header-size': px(text(options, 'header.style.fontSize')),
    '--ft-header-white-space': get(options, 'header.isWordWrap') === true ? 'pre-wrap' : undefined,
    '--ft-header-align': text(options, 'header.align'),
    '--ft-row-even-color': text(options, 'value.color'),
    '--ft-row-odd-color': text(options, 'value.alternateColor'),
    '--ft-row-even-bg': text(options, 'value.backgroundColor'),
    '--ft-row-odd-bg': text(options, 'value.alternateBackgroundColor'),
    '--ft-row-font': text(options, 'value.style.fontFamily'),
    '--ft-row-size': px(text(options, 'value.style.fontSize')),
    '--ft-row-white-space': get(options, 'value.style.isWordWrap') === true ? 'normal' : undefined,
    '--ft-row-padding': px(text(options, 'grid.horizontal.rowPadding')),
    // A flatten table has one header row, so the horizontal header lines (between header rows) never show.
    '--ft-grid-header-vertical': gridLine(options, 'vertical', 'applyHeader'),
    '--ft-grid-body-vertical': gridLine(options, 'vertical', 'applyBody'),
    '--ft-grid-body-horizontal': gridLine(options, 'horizontal', 'applyBody'),
    // Under a translucent header, so the sticky header hides the rows scrolling below it (v1 blended the colors).
    '--ft-card-bg': text(options, 'background'),
    // A collapse table's plus / minus square.
    '--ft-toggle-bg': text(options, 'toggleIcon.backgroundColor'),
    '--ft-toggle-color': text(options, 'toggleIcon.color')
  };
  return Object.fromEntries(Object.entries(vars).filter(([, value]) => value !== undefined)) as CSSProperties;
}

export interface TableTooltipStyle {
  background: string;
  color: string;
  fontFamily: string;
}

/** The cell tooltip's colors and font (v1 `TableTooltipUtils`, `tooltip.*`). */
export function tableTooltipStyle(options: VizOptions): TableTooltipStyle {
  return {
    background: text(options, 'tooltip.backgroundColor') ?? 'var(--tooltip-background-color)',
    color: text(options, 'tooltip.valueColor') ?? 'var(--text-color)',
    fontFamily: text(options, 'tooltip.fontFamily') ?? 'var(--widget-secondary-font-family, Roboto)'
  };
}

/** The title's or subtitle's font, color and alignment (v1 `TableHeader`). */
export function headingStyleOf(options: VizOptions, key: 'title' | 'subtitle'): CSSProperties {
  const style: Record<string, string | undefined> = {
    color: text(options, `${key}.style.color`),
    fontFamily: text(options, `${key}.style.fontFamily`),
    fontSize: px(text(options, `${key}.style.fontSize`)),
    textAlign: text(options, `${key}.align`)
  };
  return Object.fromEntries(Object.entries(style).filter(([, value]) => value !== undefined)) as CSSProperties;
}

export interface TableLook {
  vars: CSSProperties;
  tooltip: TableTooltipStyle;
  title: CSSProperties;
  subtitle: CSSProperties;
}

export function tableLookOf(options: VizOptions): TableLook {
  return { vars: tableStyleVars(options), tooltip: tableTooltipStyle(options), title: headingStyleOf(options, 'title'), subtitle: headingStyleOf(options, 'subtitle') };
}
