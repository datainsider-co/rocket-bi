import Highcharts from 'highcharts';

/** v1 `MetricNumberMode`: the suffixes for thousands, millions, ... in data labels, axes and tooltips. */
export const DisplayUnit = {
  None: 'none',
  Mass: 'mass',
  Text: 'text',
  Default: 'default',
  Percentage: 'percentage'
} as const;

/** Suffixes for 1e3 up to 1e18 (v1 `HighchartUtils.toMetricNumbers`); `undefined` means plain numbers. */
export function unitSuffixes(displayUnit: string | undefined): readonly string[] | undefined {
  switch (displayUnit) {
    case DisplayUnit.None:
      return undefined;
    case DisplayUnit.Mass:
      return ['kg', 'Mg', 'Gg', 'Tg', 'Pg', 'Eg'];
    case DisplayUnit.Text:
      return [' Thousand', ' Million', ' Billion', ' Trillion', ' Quadrillion', ' Quintillion'];
    case DisplayUnit.Percentage:
      return ['%', '%', '%', '%', '%', '%'];
    default:
      return ['k', 'M', 'B', 'T', 'P', 'E'];
  }
}

export interface NumberFormatOptions {
  displayUnit?: string;
  precision?: number;
  decimalPoint?: string;
  thousandSep?: string;
}

/**
 * v1 `NumberFormatter.format`: scales by the largest unit the value reaches, then `Highcharts.numberFormat`.
 * 52150 → `52.15k`, 1.345 → `1.35` (precision 2).
 */
export function createNumberFormat({ displayUnit, precision = 2, decimalPoint = '.', thousandSep = ',' }: NumberFormatOptions) {
  const suffixes = unitSuffixes(displayUnit);
  const ranges = suffixes ? suffixes.map((suffix, index) => ({ divider: 10 ** (3 * (index + 1)), suffix })).reverse() : [];
  return (value: number): string => {
    const range = ranges.find(({ divider }) => Math.abs(value) >= divider);
    return range
      ? Highcharts.numberFormat(value / range.divider, precision, decimalPoint, thousandSep) + range.suffix
      : Highcharts.numberFormat(value, precision, decimalPoint, thousandSep);
  };
}
