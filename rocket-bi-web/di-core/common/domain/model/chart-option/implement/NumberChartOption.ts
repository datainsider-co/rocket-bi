/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:47 PM
 */

import { ChartOption } from '@core/common/domain/model/chart-option/ChartOption';
import { ChartFamilyType, ChartOptionData, Field, MainDateMode, StyleSetting, TextSetting, TooltipSetting, VizSettingType } from '@core/common/domain/model';
import { MetricNumberMode } from '@/utils';
import { ChartType, DateFunctionTypes, DateRange } from '@/shared';

export type CompareStyle = 'default' | 'percentage' | 'number' | 'text';
export type TrendLineDisplayAs = ChartType.Line | ChartType.Area | ChartType.Bar | ChartType.Column;
// see [DateFunctionTypes](src/shared/enums/builder.enum.ts)
export type TrendLineBy = string;

export enum TrendIcon {
  Up = 'di-icon-up',
  Down = 'di-icon-down'
}

export interface Comparison {
  enabled?: boolean;
  dateRange?: DateRange;
  mode?: MainDateMode;
  compareStyle?: CompareStyle;
  uptrendIcon?: string;
  uptrendIconColor?: string;
  downtrendIcon?: string;
  downtrendIconColor?: string;
}

export interface DataRange {
  enabled?: boolean;
  dateField?: Field;
  dateRange?: DateRange;
  mode?: MainDateMode;
}

export interface TrendLine {
  enabled?: boolean;
  displayAs?: TrendLineDisplayAs;
  trendBy?: TrendLineBy;
}

export type ComparisonOptionData = {
  dataRange?: DataRange;
  comparison?: Comparison;
  trendLine?: TrendLine;
};

export interface NumberOptionData extends ChartOptionData {
  prefix?: TextSetting;
  postfix?: TextSetting;
  style?: StyleSetting;
  tooltip?: TooltipSetting;
  displayUnit?: MetricNumberMode;
  align?: AlignSetting;
  dataRange?: DataRange;
  comparison?: Comparison;
  trendLine?: TrendLine;
}

export class NumberChartOption extends ChartOption<NumberOptionData> {
  static readonly DEFAULT_SETTING = {
    prefix: '',
    postfix: ''
  };
  chartFamilyType = ChartFamilyType.Number;
  className = VizSettingType.NumberSetting;

  constructor(options: ChartOptionData = {}) {
    super(options);
  }

  static fromObject(obj: NumberChartOption): NumberChartOption {
    return new NumberChartOption(obj.options);
  }

  static getDefaultChartOption(): NumberChartOption {
    const textColor: string = this.getThemeTextColor();
    const secondaryTextColor: string = this.getThemeSecondaryTextColor();
    const options: NumberOptionData = {
      title: {
        align: 'center',
        enabled: true,
        text: 'Untitled chart',
        style: {
          color: textColor,
          fontFamily: 'Roboto',
          fontSize: '20px'
        }
      },
      subtitle: {
        align: 'center',
        enabled: true,
        text: '',
        style: {
          color: secondaryTextColor,
          fontFamily: 'Roboto',
          fontSize: '11px'
        }
      },
      style: {
        color: textColor,
        fontFamily: 'Roboto',
        fontSize: '48px'
      },
      align: 'center',
      prefix: {
        enabled: true,
        text: '',
        isWordWrap: false,
        style: {
          color: textColor,
          fontFamily: 'Roboto',
          fontSize: '48px'
        }
      },
      postfix: {
        enabled: true,
        text: '',
        isWordWrap: false,
        style: {
          color: textColor,
          fontFamily: 'Roboto',
          fontSize: '48px'
        }
      },
      affectedByFilter: true,
      tooltip: {
        fontFamily: 'Roboto',
        backgroundColor: this.getThemeBackgroundColor(),
        valueColor: textColor
      },
      background: this.getThemeBackgroundColor(),
      comparison: {
        enabled: false
      },
      dataRange: {
        enabled: false
      },
      trendLine: {
        enabled: false,
        trendBy: DateFunctionTypes.monthOf,
        displayAs: ChartType.Line
      }
    };
    return new NumberChartOption(options);
  }
}
