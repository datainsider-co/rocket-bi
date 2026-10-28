import type { CSSProperties } from 'react';
import type { SeriesOneResponse } from '@/core/query/VisualizationResponse';
import type { VizOptions } from '@/core/query/vizOptions';
import { createNumberFormat } from '../numberFormat';
import { titleText } from '../highchartsBase';
import { isTrendLineOn, kpiComparisonOf, kpiTrendOf, type KpiComparison, type KpiTrend } from './kpiComparison.utils';

interface TextStyle {
  color?: string;
  fontSize?: string;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  lineHeight?: string;
  textDecoration?: string;
}

interface Affix {
  enabled?: boolean;
  text?: string;
  style?: TextStyle;
}

interface KpiIcon {
  enabled?: boolean;
  iconClass?: string;
  color?: string;
  background?: string;
  border?: string;
  shadow?: string;
}

interface Heading {
  text: string;
  style: CSSProperties;
}

/**
 * v1 picks the KPI's layout by `options.theme`: without one, `NoneThemeLayout` (title and value centered in the card,
 * the trend line below); `style_area_1`, `AreaLayout` (the trend line along the bottom); any other theme,
 * `TrendLineLayout` with a trend line (drawn on the right), else `NormalLayout` (icon, title and value from the top
 * left).
 */
export type KpiLayout = 'plain' | 'themed' | 'trend' | 'area';

/** What the KPI card shows (v1 `NumberWidget` + its layouts). */
export interface KpiModel {
  layout: KpiLayout;
  title?: Heading;
  subtitle?: Heading;
  value: string;
  /** The full number, for the tooltip. */
  exactValue: string;
  prefix: string;
  postfix: string;
  valueStyle: CSSProperties;
  prefixStyle: CSSProperties;
  postfixStyle: CSSProperties;
  background?: string;
  icon?: { className: string; style: CSSProperties };
  /** The comparison with another period, when asked for and the compared value is known. */
  comparison?: KpiComparison;
  /** The trend line, when asked for and its data is in. */
  trend?: KpiTrend;
}

function textCss(style: TextStyle | undefined, fallbackSize: string): CSSProperties {
  return {
    color: style?.color,
    fontSize: style?.fontSize ?? fallbackSize,
    fontFamily: style?.fontFamily,
    fontWeight: style?.fontWeight,
    fontStyle: style?.fontStyle,
    lineHeight: style?.lineHeight,
    textDecoration: style?.textDecoration
  };
}

function heading(value: unknown): Heading | undefined {
  const text = titleText(value);
  if (!text) return undefined;
  const { style, align } = value as { style?: TextStyle; align?: CSSProperties['textAlign'] };
  return {
    text,
    style: { ...textCss(style, '20px'), textAlign: align ?? 'left', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }
  };
}

function affixText(affix: Affix | undefined): string {
  return affix?.enabled === false ? '' : (affix?.text ?? '');
}

function layoutOf(theme: unknown, trendOn: boolean): KpiLayout {
  if (typeof theme !== 'string' || theme === '') return 'plain';
  if (theme === 'style_area_1') return 'area';
  return trendOn ? 'trend' : 'themed';
}

/** The KPI from its options, its response and, with a trend line, the trend's values. */
export function buildKpi(options: VizOptions, response: SeriesOneResponse, trendData?: readonly (number | null)[]): KpiModel {
  const value = response.series[0]?.data[0];
  const kpi = options.plotOptions as { kpi?: { dataLabels?: { displayUnit?: string } } } | undefined;
  const numberOptions = { precision: options.precision, decimalPoint: options.decimalPoint, thousandSep: options.thousandSep };
  const format = createNumberFormat({ ...numberOptions, displayUnit: kpi?.kpi?.dataLabels?.displayUnit });
  const exact = createNumberFormat({ ...numberOptions, displayUnit: 'none' });
  const style = options['style'] as TextStyle | undefined;
  const prefix = options['prefix'] as Affix | undefined;
  const postfix = options['postfix'] as Affix | undefined;
  const icon = options['icon'] as KpiIcon | undefined;
  const hasValue = typeof value === 'number';
  const layout = layoutOf(options['theme'], isTrendLineOn(options));
  const comparison = kpiComparisonOf(options, hasValue ? value : undefined, response.compareValue, format);
  const trend = kpiTrendOf(options, trendData, comparison, layout !== 'plain');
  // v1 aligns the plain layout's value bar to the center by default, the themed one's value to the left.
  const align = options['align'] ?? (layout === 'plain' ? 'center' : 'left');

  return {
    layout,
    title: heading(options.title),
    subtitle: heading(options.subtitle),
    value: hasValue ? format(value) : '--',
    exactValue: hasValue ? exact(value) : '--',
    prefix: affixText(prefix),
    postfix: affixText(postfix),
    valueStyle: { ...textCss(style, '36px'), justifyContent: alignToFlex(align) },
    prefixStyle: textCss(prefix?.style, '36px'),
    postfixStyle: textCss(postfix?.style, '36px'),
    background: typeof options.background === 'string' ? options.background : undefined,
    icon: icon?.enabled
      ? {
          className: icon.iconClass ?? 'setting-icon-dollar',
          style: {
            color: icon.color ?? '#4f4f4f',
            background: icon.background ?? '#fff',
            borderRadius: icon.border ?? '4px',
            boxShadow: icon.shadow
          }
        }
      : undefined,
    ...(comparison && { comparison }),
    ...(trend && { trend })
  };
}

function alignToFlex(align: unknown): CSSProperties['justifyContent'] {
  if (align === 'center') return 'center';
  if (align === 'right') return 'flex-end';
  return 'flex-start';
}
