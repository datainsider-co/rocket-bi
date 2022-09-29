/*
 * @author: tvc12 - Thien Vi
 * @created: 7/8/21, 5:50 PM
 */

import { HeaderData } from '@/shared/models';
import { ColorFormatting, DefaultValueFormattingType, MinMaxData } from '@core/common/domain';
import { isNumber } from 'lodash';
import { ColorUtils } from '@/utils/ColorUtils';
import { ChartUtils } from '@/utils';
import { StringUtils } from '@/utils/StringUtils';
import { ConditionalFormattingUtils } from '@core/utils/ConditionalFormattingUtils';

enum FormatterType {
  DefaultAsZero,
  None,
  SpecificColor,
  NormalFormatting
}

export class ColorScaleUtils {
  static getColor(header: HeaderData, backgroundColor: ColorFormatting, minMaxData: MinMaxData, rowData: any): string | undefined {
    const value: number | undefined = rowData[header.key];
    return ColorScaleUtils.detectColor(header, backgroundColor, minMaxData, value);
  }

  static getFooterColor(header: HeaderData, backgroundColor: ColorFormatting, minMaxData: MinMaxData): string | undefined {
    const value: number | undefined = header.total;
    return ColorScaleUtils.detectColor(header, backgroundColor, minMaxData, value);
  }

  private static detectColor(header: HeaderData, backgroundColor: ColorFormatting, minMaxData: MinMaxData, value: any): string | undefined {
    const formatType = this.getFormatterType(value, backgroundColor);
    switch (formatType) {
      case FormatterType.DefaultAsZero:
        return this.getColorFormatting(header, backgroundColor, 0, minMaxData);
      case FormatterType.NormalFormatting:
        return this.getColorFormatting(header, backgroundColor, value!, minMaxData);
      case FormatterType.SpecificColor:
        return backgroundColor.scale?.default?.specificColor;
      default:
        return void 0;
    }
  }

  private static getFormatterType(value: any, backgroundColor: ColorFormatting): FormatterType {
    if (!isNumber(value) && StringUtils.isEmpty(value)) {
      const defaultFormatting = backgroundColor.scale?.default;
      switch (defaultFormatting?.formattingType) {
        case DefaultValueFormattingType.AsZero:
          return FormatterType.DefaultAsZero;
        case DefaultValueFormattingType.SpecificColor:
          return FormatterType.SpecificColor;
        default:
          return FormatterType.None;
      }
    } else {
      return FormatterType.NormalFormatting;
    }
  }

  private static getColorFormatting(header: HeaderData, backgroundColor: ColorFormatting, number: number, minMaxData: MinMaxData): string {
    if (backgroundColor.scale?.center?.enabled) {
      return this.formatUseCenterFormatting(backgroundColor, number, minMaxData);
    } else {
      return this.formatUseMinMaxFormatting(backgroundColor, number, minMaxData);
    }
  }

  private static formatUseCenterFormatting(backgroundColor: ColorFormatting, number: number, minMaxData: MinMaxData): string {
    const { scale } = backgroundColor;
    const minValue = ConditionalFormattingUtils.getValueFormatting(scale!.min!, minMaxData.min);
    const centerValue = ConditionalFormattingUtils.getValueFormatting(scale!.center!, (minMaxData.min + minMaxData.max) / 2);
    const maxValue = ConditionalFormattingUtils.getValueFormatting(scale!.max!, minMaxData.max);

    const ratioMinCenter = ChartUtils.calculateRatio(number, MinMaxData.from(minValue, centerValue));
    const ratioCenterMax = ChartUtils.calculateRatio(number, MinMaxData.from(centerValue, maxValue));
    const isInCenterToMax = ratioCenterMax > 0 && ratioCenterMax <= 1;
    if (isInCenterToMax) {
      const centerColor = scale?.center?.color ?? '#e5ff85';
      const maxColor = scale?.max?.color ?? '#2d95ff';
      return ColorUtils.getColorFromMinMax(ratioCenterMax, centerColor, maxColor);
    } else {
      const minColor = scale?.min?.color ?? '#d2f4ff';
      const centerColor = scale?.center?.color ?? '#e5ff85';
      return ColorUtils.getColorFromMinMax(ratioMinCenter, minColor, centerColor);
    }
  }

  private static formatUseMinMaxFormatting(backgroundColor: ColorFormatting, number: number, minMaxData: MinMaxData): string {
    const { scale } = backgroundColor;
    const minValue = ConditionalFormattingUtils.getValueFormatting(scale!.min!, minMaxData.min);
    const maxValue = ConditionalFormattingUtils.getValueFormatting(scale!.max!, minMaxData.max);
    const ratio = ChartUtils.calculateRatio(number, MinMaxData.from(minValue, maxValue));
    const minColor = scale?.min?.color ?? '#d2f4ff';
    const maxColor = scale?.max?.color ?? '#2d95ff';

    return ColorUtils.getColorFromMinMax(ratio, minColor, maxColor);
  }
}
