/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:47 PM
 */

import { ChartOption } from '@core/common/domain/model/chart-option/ChartOption';
import { ChartOptionClassName, ChartOptionData, Field, MainDateMode, PlotKPI, StyleSetting, TextSetting, TooltipSetting } from '@core/common/domain/model';
import { ChartType, DateFunctionTypes, DateRange } from '@/shared';
import { MetricNumberMode } from '@/utils';

export type CompareStyle = 'default' | 'percentage' | 'number' | 'text';
export type TrendLineDisplayAs = ChartType.Line | ChartType.Area | ChartType.Bar | ChartType.Column;
// see [DateFunctionTypes](src/shared/enums/builder.enum.ts)
export type TrendLineBy = string;

export enum TrendIcon {
  Up = 'di-icon-up',
  Down = 'di-icon-down'
}

export enum ColorType {
  Solid = 'solid',
  Gradient = 'gradient'
}

export enum BorderShape {
  Rectangle = 'rectangle',
  Circle = 'circle'
}

export enum KPIPositionValue {
  TopLeft = 'top-left',
  TopRight = 'top-right',
  BottomLeft = 'bottom-left',
  BottomRight = 'bottom-right'
}

export enum DisplayValue {
  Value = 'value',
  Percentage = 'percentage'
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
  color?: string;
  ///True => color will red (setting in percentage) when negative, green when positive
  ///
  ///False => using color key above
  colorByPercentage?: boolean;
}

export type ComparisonOptionData = {
  dataRange?: DataRange;
  comparison?: Comparison;
  trendLine?: TrendLine;
};

export interface IconSetting {
  enabled?: boolean;
  iconClass?: string;
  background?: string;
  color?: string;
  shape?: BorderShape;
  border?: string;
  borderColor?: string;
  position?: KPIPositionValue;
  shadow?: string;
}

export interface PercentageSetting {
  enabled?: boolean;
  icon?: IconSetting;
  display?: DisplayValue;
  position?: KPIPositionValue;
  colorByInherit?: boolean;
  increaseColor?: string;
  decreaseColor?: string;
}

export enum KPITheme {
  Style1 = 'style_1',
  Style2 = 'style_2',
  Style3 = 'style_3',
  Style4 = 'style_4',
  Style5 = 'style_5',
  Style6 = 'style_6',
  Style7 = 'style_7',
  Style8 = 'style_8',
  Style9 = 'style_9',
  Style10 = 'style_10',
  Style11 = 'style_11',
  Style12 = 'style_12',
  StyleArea1 = 'style_area_1'
}

export interface NumberOptionData extends ChartOptionData {
  prefix?: TextSetting;
  postfix?: TextSetting;
  style?: StyleSetting;
  tooltip?: TooltipSetting;
  //@deprecated
  plotOptions?: {
    kpi?: PlotKPI;
  };
  //@deprecated
  align?: AlignSetting;
  //@deprecated
  dataRange?: DataRange;
  //@deprecated
  comparison?: Comparison;
  //@deprecated
  trendLine?: TrendLine;

  //
  icon?: IconSetting;
  percentage?: PercentageSetting;
  theme?: KPITheme;
}

export class NumberChartOption extends ChartOption<NumberOptionData> {
  static readonly DEFAULT_SETTING = {
    prefix: '',
    postfix: ''
  };

  className = ChartOptionClassName.NumberSetting;

  constructor(options: ChartOptionData = {}) {
    super(options);
  }

  static fromObject(obj: NumberChartOption): NumberChartOption {
    return new NumberChartOption(obj.options);
  }

  static getDefaultChartOption(): NumberChartOption {
    // const textColor: string = this.getThemeTextColor();
    const textColor = '#000000';
    const options: NumberOptionData = {
      title: {
        align: 'left',
        enabled: true,
        text: 'Untitled chart',
        style: {
          color: ChartOption.getPrimaryTextColor(),
          fontFamily: ChartOption.getPrimaryFontFamily(),
          fontStyle: ChartOption.getPrimaryFontStyle(),
          fontWeight: ChartOption.getPrimaryFontWeight(),
          fontSize: '16px',
          lineHeight: '18.75px'
        }
      },
      subtitle: {
        align: 'left',
        enabled: true,
        text: 'Subtitle description',

        style: {
          color: ChartOption.getSecondaryTextColor(),
          fontFamily: ChartOption.getSecondaryFontFamily(),
          fontStyle: ChartOption.getSecondaryFontStyle(),
          textDecoration: ChartOption.getSecondaryFontUnderlined(),
          fontWeight: ChartOption.getSecondaryFontWeight(),
          fontSize: '14px',
          lineHeight: '16.41px'
        }
      },
      plotOptions: {
        kpi: {
          dataLabels: {
            displayUnit: MetricNumberMode.None
          }
        }
      },
      style: {
        color: '#11152D',
        fontFamily: ChartOption.getSecondaryFontFamily(),
        fontWeight: '600',
        fontSize: '42px',
        lineHeight: '42px'
      },
      align: 'left',
      prefix: {
        enabled: true,
        isWordWrap: false,
        style: {
          color: '#11152D',
          fontFamily: 'Montserrat',
          fontSize: '24px'
        }
      },
      postfix: {
        enabled: true,
        isWordWrap: false,
        text: '$',
        style: {
          color: '#11152D',
          fontFamily: 'Montserrat',
          fontSize: '24px'
        }
      },
      background: '#BEE2CA',
      icon: {
        enabled: true,
        color: '#BEE2CA',
        iconClass: 'setting-icon-wallet-money-bold',
        background: '#11152D',
        shape: BorderShape.Rectangle,
        border: '4px',
        shadow: '0px 2px 4px 0px #0000001A'
      },
      percentage: {
        enabled: true,
        icon: {
          enabled: false
        },
        display: DisplayValue.Percentage,
        position: KPIPositionValue.TopLeft,
        colorByInherit: true
      },
      theme: KPITheme.Style1,
      affectedByFilter: true,
      precision: 0,
      tooltip: {
        fontFamily: ChartOption.getSecondaryFontFamily(),
        backgroundColor: this.getThemeBackgroundColor(),
        valueColor: textColor
      },
      comparison: {
        enabled: false
      },
      dataRange: {
        enabled: false
      },
      trendLine: {
        enabled: false,
        trendBy: DateFunctionTypes.monthOf,
        displayAs: ChartType.Line,
        color: '#007126',
        colorByPercentage: false
      }
    };
    return new NumberChartOption(options);
  }

  isEnableControl(): boolean {
    return false;
  }
}
