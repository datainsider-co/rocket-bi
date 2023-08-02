import { ChartUtils, HighchartUtils, ListUtils, MetricNumberMode } from '@/utils';
import Highcharts from 'highcharts';
import { Log } from '@core/utils';

export interface RangeData {
  divider: number;
  suffix: string;
}

export enum NumberFormatType {
  US = 'US',
  UK = 'UK'
}

/**
 * Formatter cho 1 số
 */
export class NumberFormatter {
  public precision: number;
  public ranges: RangeData[];
  public decimalPoint: string;
  public thousandSep: string;

  constructor(ranges: RangeData[] | undefined, precision = 2, decimalPoint = '.', thousandsSep = ',') {
    this.precision = precision;
    this.ranges = ranges ?? [];
    this.decimalPoint = decimalPoint;
    this.thousandSep = thousandsSep;
  }

  setRanges(ranges: RangeData[] | undefined) {
    this.ranges = ranges ?? [];
  }

  formatWithType(data: number, type: string): string {
    if (ChartUtils.isNumberType(type)) {
      return this.format(data);
    } else {
      return data.toString();
    }
  }

  /**
   *format number -> string(number + suffix)
   *example with default precision = 2
   *1000 -> 1k
   *1.345 -> 1.35
   *52150 -> 52,15k
   */
  format(data: number) {
    if (ListUtils.isNotEmpty(this.ranges)) {
      for (let rangeIndex = 0; rangeIndex < this.ranges.length; rangeIndex++) {
        const absData = Math.abs(data); //-100 -> 100
        const threshold = this.ranges[rangeIndex].divider;
        if (absData >= threshold) {
          const suffix = this.ranges[rangeIndex].suffix;
          return Highcharts.numberFormat(data / threshold, this.precision, this.decimalPoint, this.thousandSep) + suffix;
        }
      }
      return Highcharts.numberFormat(data, this.precision, this.decimalPoint, this.thousandSep);
    } else {
      return Highcharts.numberFormat(data, this.precision, this.decimalPoint, this.thousandSep);
    }
  }

  /**
   * @deprecated move to number utils
   * @param number
   * @param roundingPrecision
   */
  static round(number: number, roundingPrecision = 2): string {
    return number.toFixed(roundingPrecision);
  }

  static default(precision = 2) {
    const metricNumbers = HighchartUtils.toMetricNumbers(MetricNumberMode.Default);
    const ranges: RangeData[] | undefined = HighchartUtils.buildRangeData(metricNumbers);
    return new NumberFormatter(ranges, precision);
  }
}
