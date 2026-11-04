import { escape, get } from 'lodash-es';
import type { VizOptions } from '@/core/query/vizOptions';
import { createNumberFormat } from '../numberFormat';

/**
 * Data labels and tooltips of the pie family (pie, donut, variable pie, funnel, pyramid, parliament), which Highcharts
 * draws as HTML. Names come from the data, so they are escaped; v1 put them in as they were.
 */

/** v1 `DataLabelFormatterMode`. */
export const PieLabelFormat = {
  NameAndPercent: 'name_and_percent',
  NameAndValue: 'name_and_value',
  Name: 'name'
} as const;

/** What a chart's Data Label settings hold, at its own path (`plotOptions.<type>.dataLabels`). */
export interface LabelSettings {
  displayUnit?: string;
  labelFormat?: string;
  style?: { color?: string };
}

export function labelSettingsOf(options: VizOptions, path: string): LabelSettings {
  const settings: unknown = get(options, path);
  return typeof settings === 'object' && settings !== null ? (settings as LabelSettings) : {};
}

/** The values' format: the labels' display unit, and the chart's precision and separators. */
export function pointNumberFormat(options: VizOptions, displayUnit: string | undefined) {
  return createNumberFormat({ displayUnit, precision: options.precision, decimalPoint: options.decimalPoint, thousandSep: options.thousandSep });
}

export interface LabelPoint {
  name: string;
  y?: number | null;
  percentage?: number;
}

/** A point's data label (v1 `nameAndValueFormat`, `nameAndPercentFormat`, `nameFormat`); name and value by default. */
export function pointLabel(point: LabelPoint, settings: LabelSettings, format: (value: number) => string): string {
  const color = settings.style?.color ?? '#fff';
  const name = escape(point.name);
  switch (settings.labelFormat) {
    case PieLabelFormat.NameAndPercent:
      return `<div style="color:${color}">${name} : ${format(point.percentage ?? 0)} %</div>`;
    case PieLabelFormat.Name:
      return `<div style="color:${color}">${name}</div>`;
    default:
      return `<div style="color:${color}">${name} : ${format(point.y ?? 0)}</div>`;
  }
}

/** The point's color as a dot, before its value in a tooltip. */
export function colorDot(color: unknown): string {
  return `<span style="color:${String(color)}; padding-right: 5px;">●</span>`;
}

/**
 * v1's tooltip box: one line each, in the tooltip's font and color. Without a color of its own the text takes the
 * theme's, like series charts; v1 used white, unreadable on the theme's light tooltip.
 */
export function tooltipHtml(options: VizOptions, lines: readonly string[]): string {
  const style = (options.tooltip?.style ?? {}) as { color?: string; fontFamily?: string };
  const fontFamily = style.fontFamily ?? 'var(--widget-secondary-font-family, Roboto)';
  return `<div style="text-align: left; color: ${style.color ?? 'var(--text-color)'}; font-family: ${fontFamily}">${lines.join('<br/>')}</div>`;
}

/** A heading, then the point's dot, a label and its value (v1's pie, funnel, pyramid and parliament tooltips). */
export function pointTooltip(options: VizOptions, heading: string, color: unknown, label: string, value: string): string {
  return tooltipHtml(options, [`<span>${escape(heading)}</span>`, `${colorDot(color)}${escape(label)}: <b>${value}</b>`]);
}
