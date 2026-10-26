import type { CSSProperties } from 'react';
import type { SeriesOneResponse } from '@/core/query/VisualizationResponse';
import type { VizOptions } from '@/core/query/vizOptions';
import { createNumberFormat } from '../numberFormat';
import { titleText } from '../highchartsBase';

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

/** What the KPI card shows (v1 `NumberWidget` + `NormalLayout`). Comparison and trend line come with M3/M4. */
export interface KpiModel {
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

export function buildKpi(options: VizOptions, response: SeriesOneResponse): KpiModel {
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

  return {
    title: heading(options.title),
    subtitle: heading(options.subtitle),
    value: hasValue ? format(value) : '--',
    exactValue: hasValue ? exact(value) : '--',
    prefix: affixText(prefix),
    postfix: affixText(postfix),
    valueStyle: { ...textCss(style, '36px'), justifyContent: alignToFlex(options['align']) },
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
      : undefined
  };
}

function alignToFlex(align: unknown): CSSProperties['justifyContent'] {
  if (align === 'center') return 'center';
  if (align === 'right') return 'flex-end';
  return 'flex-start';
}
