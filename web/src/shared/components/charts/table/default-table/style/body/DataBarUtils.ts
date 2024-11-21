/*
 * @author: tvc12 - Thien Vi
 * @created: 7/22/21, 6:41 PM
 */

import { Log, NumberUtils } from '@core/utils';
import { ChartUtils } from '@/utils';
import { ConditionalFormattingData, DataBarFormatting, MinMaxData, TableResponse } from '@core/common/domain';
import { ConditionalFormattingUtils } from '@core/utils/ConditionalFormattingUtils';
import { CustomStyleData } from '@chart/custom-table/TableData';
import { ColorUtils } from '@/utils/ColorUtils';

export class DataBarUtils {
  /**
   * Get positive ratio
   * @param min: min
   * @param value
   * @return if value > 0 || min value > 0 => 0
   * otherwise, return ratio of value from [min, 0]. Max is 1, min is 0
   */
  static getPositiveRatio(min: number, value: number): number {
    if (NumberUtils.isNegative(min) && NumberUtils.isNegative(value)) {
      return ChartUtils.calculateRatio(-value, MinMaxData.from(0, -min));
    } else {
      return 0;
    }
  }

  /**
   * Get negative ratio
   * @param max
   * @param value
   * @return value in [0, 1]. 0 when max < 0 || value < 0
   * otherwise return ratio of value in [0, max]
   */
  static getNegativeRatio(max: number, value: number): number {
    if (NumberUtils.isNegative(max) || NumberUtils.isNegative(value)) {
      return 0;
    } else {
      return ChartUtils.calculateRatio(value, MinMaxData.from(0, max));
    }
  }

  /**
   * Calculated minmax
   * @param formattingData
   * @param tableResponse
   */
  static calculatedMinMax(formattingData: ConditionalFormattingData, tableResponse: TableResponse): MinMaxData {
    const { min, max } = formattingData.dataBar!;
    const minMax = ConditionalFormattingUtils.findDataBarMinMax(tableResponse, formattingData.label ?? '');
    const minValue = ConditionalFormattingUtils.getValueFormatting(min!, minMax.min);
    const maxValue = ConditionalFormattingUtils.getValueFormatting(max!, minMax.max);

    return new MinMaxData(minMax.valueName, minValue, maxValue);
  }

  /**
   * return negative size
   * if min < 0 && max >= 0 return ratio of min in [0, abs(min) + max]
   * if min < 0 && max < 0 return ratio of min in [abs(max), abs(min) + max]
   * otherwise return 0;
   * @param minMax
   */
  static calculateNegativeSize(minMax: MinMaxData): number {
    if (NumberUtils.isNegative(minMax.min)) {
      if (NumberUtils.isNegative(minMax.max)) {
        const absMin = -minMax.min;
        const absMax = -minMax.max;
        return ChartUtils.calculateRatio(absMin, MinMaxData.from(absMax, absMax + absMin));
      } else {
        const absMin = -minMax.min;
        return ChartUtils.calculateRatio(absMin, MinMaxData.from(0, absMin + minMax.max));
      }
    } else {
      return 0;
    }
  }

  static buildDataBarStyle(formattingData: ConditionalFormattingData, tableResponse: TableResponse, value: number) {
    const dataBar = formattingData.dataBar!;
    const minMax = DataBarUtils.calculatedMinMax(formattingData, tableResponse);

    const negativeSize = DataBarUtils.calculateNegativeSize(minMax);

    const negativeRatio = DataBarUtils.getPositiveRatio(minMax.min, value);
    const positiveRatio = DataBarUtils.getNegativeRatio(minMax.max, value);

    switch (dataBar.direction) {
      case 'right':
        return DataBarUtils.buildRightToLeft(negativeSize, negativeRatio, positiveRatio, dataBar);
      default:
        return DataBarUtils.buildLeftToRight(negativeSize, negativeRatio, positiveRatio, dataBar);
    }
  }

  //Position: Positive | Negative
  private static buildRightToLeft(negativeSize: number, negativeRatio: number, positiveRatio: number, dataBar: DataBarFormatting): CustomStyleData {
    const positiveSize = 1 - negativeSize;
    const negatePositionLeft = `${NumberUtils.percentage(positiveSize)}%`;
    const negativeBarSize = negativeRatio * negativeSize;

    // calculate size of bar in 1 cell
    const positiveBarSize = positiveRatio * positiveSize;
    const positivePositionLeft = `${NumberUtils.percentage(positiveSize - positiveBarSize)}%`;
    const axisColor = dataBar.axisColor || '#E6E6E600';
    const isShowBorderLeft = negativeBarSize > 0 || !ColorUtils.isAlpha0(axisColor);
    const borderLeftStyle = isShowBorderLeft ? 'solid' : 'unset';
    return {
      css: {} as any,
      dataBar: {
        positiveStyle: {
          backgroundColor: dataBar.positiveColor || '#6289d2',
          width: `${NumberUtils.percentage(positiveBarSize)}%`,
          left: positivePositionLeft
        },
        negativeStyle: {
          backgroundColor: dataBar.negativeColor || '#d8bc71',
          width: `${NumberUtils.percentage(negativeBarSize)}%`,
          left: negatePositionLeft,
          borderLeftColor: axisColor,
          borderLeftStyle: borderLeftStyle,
          borderLeftWidth: '1px'
        }
      }
    } as CustomStyleData;
  }

  /**
   * Position: Negative | Positive
   * Position of Axis = positive size
   * @param negativeSize
   * @param negativeRatio
   * @param positiveRatio
   * @param dataBar
   * @private
   */
  private static buildLeftToRight(negativeSize: number, negativeRatio: number, positiveRatio: number, dataBar: DataBarFormatting): CustomStyleData {
    const positiveSize = 1 - negativeSize;
    const positivePositionLeft = `${NumberUtils.percentage(negativeSize)}%`;
    const positiveBarSize = positiveRatio * positiveSize;

    // calculate size of bar in 1 cell
    const negativeBarSize = negativeRatio * negativeSize;
    const negativePositionLeft = `${NumberUtils.percentage(negativeSize - negativeBarSize)}%`;
    const axisColor = dataBar.axisColor || '#E6E6E600';
    const isShowBorderLeft = positiveBarSize < 0 || !ColorUtils.isAlpha0(axisColor);
    const borderLeftStyle = isShowBorderLeft ? 'solid' : 'unset';
    return {
      css: {} as any,
      dataBar: {
        positiveStyle: {
          background: dataBar.positiveColor || '#6289d2',
          width: `${NumberUtils.percentage(positiveBarSize)}%`,
          left: positivePositionLeft,
          borderLeftColor: axisColor,
          borderLeftWidth: '1px',
          borderLeftStyle: borderLeftStyle
        },
        negativeStyle: {
          background: dataBar.negativeColor || '#d8bc71',
          width: `${NumberUtils.percentage(negativeBarSize)}%`,
          left: negativePositionLeft
        }
      }
    } as CustomStyleData;
  }
}
