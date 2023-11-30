/*
 * @author: tvc12 - Thien Vi
 * @created: 8/6/21, 4:08 PM
 */

import { ChartType, DateRange } from '@/shared';
import { CompareMode as CompareModeEnum } from '@/shared/enums/CompareMode';
import { DateUtils } from '@/utils';
import {
  CompareMode,
  CompareRequest,
  Comparison,
  ComparisonOptionData,
  Condition,
  DataRange,
  Field,
  FieldRelatedCondition,
  FieldRelatedFunction,
  FilterRequest,
  MainDateMode,
  OrderBy,
  PastNDay,
  PastNMonth,
  PastNQuarter,
  PastNWeek,
  PastNYear,
  ScalarFunction,
  SeriesChartOption,
  SeriesQuerySetting,
  SortDirection,
  TableColumn
} from '@core/common/domain';
import { DateRelatedCondition } from '@core/common/domain/model/condition/DateRelatedCondition';
import { DateHistogramFunctionBuilder } from '@core/common/services';
import { ConditionUtils } from '@core/utils/ConditionUtils';
import { Log } from '@core/utils/Log';

export class ComparisonUtils {
  static getDateFilterRequests(compareOption: ComparisonOptionData): FilterRequest[] {
    const dataRange = compareOption.dataRange;
    const isDataRangeOn = ComparisonUtils.isDataRangeOn(compareOption);
    const isComparisonOff = !ComparisonUtils.isComparisonOn(compareOption);
    if (dataRange && isDataRangeOn && isComparisonOff) {
      return [FilterRequest.fromCondition(ConditionUtils.buildDateCondition(dataRange.dateField!, dataRange.dateRange))];
    } else {
      return [];
    }
  }

  static toCompareRequest(compareOption: ComparisonOptionData, compareMode: CompareMode): CompareRequest | undefined {
    Log.debug('ComparisonUtils::getCompareRequest::isComparisonOn', ComparisonUtils.isComparisonOn(compareOption));
    if (ComparisonUtils.isComparisonOn(compareOption)) {
      const firstRange: DataRange = compareOption.dataRange!;
      const firstCondition: FieldRelatedCondition | undefined = ConditionUtils.buildDateFilterCondition(
        firstRange.dateField!,
        firstRange.dateRange!,
        firstRange.mode!
      );
      const secondCondition: Condition | undefined = ComparisonUtils.buildSecondCondition(firstRange, compareOption.comparison!);
      return new CompareRequest(firstCondition, secondCondition, compareMode);
    } else {
      return void 0;
    }
  }

  /**
   * @deprecated use method DateUtils.getDateRange instead of this method.
   * Because method return all time when mode is all time. But method DateUtils.getDateRange return null
   */
  static getDateRange(mode: MainDateMode): DateRange | null {
    if (mode === MainDateMode.allTime) {
      return DateUtils.getAllTime();
    } else {
      return DateUtils.getDateRange(mode);
    }
  }

  private static buildSecondCondition(firstRange: DataRange, comparison: Comparison): Condition | undefined {
    const field: Field = Field.fromObject(firstRange.dateField!);
    const compareMode: CompareModeEnum = (comparison.mode as any) as CompareModeEnum;
    if (compareMode === CompareModeEnum.custom) {
      return ConditionUtils.buildBetweenConditionByDateRange(field, comparison.dateRange!);
    }

    switch (firstRange.mode) {
      case MainDateMode.custom: {
        const firstDateRange: DateRange = firstRange.dateRange ?? DateUtils.getAllTime();
        const secondDateRange: DateRange = DateUtils.getCompareDateRange(compareMode, firstDateRange) ?? comparison.dateRange ?? DateUtils.getAllTime();
        return ConditionUtils.buildBetweenConditionByDateRange(field, secondDateRange);
      }
      case MainDateMode.allTime: {
        const secondDateRange: DateRange = DateUtils.getCompareDateRange(compareMode, DateUtils.getAllTime()) ?? comparison.dateRange ?? DateUtils.getAllTime();
        return ConditionUtils.buildBetweenConditionByDateRange(field, secondDateRange);
      }
      default: {
        const intervalCompareFn: ScalarFunction | undefined = ComparisonUtils.getIntervalPeriodFn(firstRange.mode!, compareMode);
        const firstCondition: FieldRelatedCondition | undefined = ConditionUtils.buildDateFilterCondition(field, firstRange.dateRange!, firstRange.mode!);
        if (firstCondition) {
          ((firstCondition as any) as DateRelatedCondition).intervalFunction = intervalCompareFn;
          return firstCondition;
        } else {
          return void 0;
        }
      }
    }
  }

  static getIntervalPeriodFn(dateMode: MainDateMode, comparisonMode: CompareModeEnum): ScalarFunction | undefined {
    switch (comparisonMode) {
      case CompareModeEnum.previousPeriod: {
        return ComparisonUtils.getIntervalPreviousPeriodFn(dateMode);
      }
      case CompareModeEnum.samePeriodLastMonth: {
        return new PastNMonth(1);
      }
      case CompareModeEnum.samePeriodLastQuarter: {
        return new PastNQuarter(1);
      }
      case CompareModeEnum.samePeriodLastYear: {
        return new PastNYear(1);
      }
      default:
        return void 0;
    }
  }

  private static getIntervalPreviousPeriodFn(dateMode: MainDateMode): ScalarFunction | undefined {
    switch (dateMode) {
      case MainDateMode.thisDay:
      case MainDateMode.lastDay:
      case MainDateMode.last7Days:
      case MainDateMode.last30Days:
        return new PastNDay(1);

      case MainDateMode.thisWeek:
      case MainDateMode.lastWeek:
        return new PastNWeek(1);

      case MainDateMode.thisMonth:
      case MainDateMode.lastMonth:
        return new PastNMonth(1);

      case MainDateMode.thisQuarter:
      case MainDateMode.lastQuarter:
        return new PastNQuarter(1);

      case MainDateMode.thisYear:
      case MainDateMode.lastYear:
        return new PastNYear(1);

      default:
        return void 0;
    }
  }

  static isDataRangeOn(comparisonOption: ComparisonOptionData): boolean {
    return !!comparisonOption.dataRange?.enabled;
  }

  static isComparisonOn(comparisonOption: ComparisonOptionData): boolean {
    return ComparisonUtils.isDataRangeOn(comparisonOption) && !!comparisonOption.comparison?.enabled;
  }

  static isTrendLineOn(comparisonOption: ComparisonOptionData): boolean {
    return ComparisonUtils.isDataRangeOn(comparisonOption) && !!comparisonOption.trendLine?.enabled;
  }

  static buildTrendLineQuerySetting(comparisonOption: ComparisonOptionData, yAxisColumn: TableColumn[], isDecreaseComparison: boolean): SeriesQuerySetting {
    const chartType = comparisonOption.trendLine?.displayAs ?? ChartType.Line;
    const dataRange: DataRange = comparisonOption.dataRange!;
    const field: Field = dataRange.dateField!;
    const functionType = comparisonOption.trendLine?.trendBy;
    const dateFunction: FieldRelatedFunction = new DateHistogramFunctionBuilder().buildFunctionFromField(field, functionType)!;

    const seriesOption: SeriesChartOption = ComparisonUtils.getTrendLineChartOption(chartType, isDecreaseComparison);
    return new SeriesQuerySetting(
      new TableColumn(field.fieldName, dateFunction),
      yAxisColumn,
      void 0,
      [ConditionUtils.buildDateCondition(dataRange.dateField!, dataRange.dateRange)],
      [new OrderBy(dateFunction, SortDirection.Asc)],
      seriesOption
    );
  }

  private static getTrendLineChartOption(chartType: ChartType, isDecreaseComparison: boolean) {
    const seriesChartOption = SeriesChartOption.getDefaultChartOption(chartType);
    seriesChartOption.removeOption('title');
    seriesChartOption.removeOption('subtitle');
    seriesChartOption.setOption('legend.enabled', false);
    seriesChartOption.setOption('chart.spacing', [0, 0, 0, 0]);
    seriesChartOption.setOption('chart.margin', [0, 0, 0, 0]);
    seriesChartOption.setOption('yAxis[0].visible', false);
    seriesChartOption.setOption('xAxis[0].visible', false);
    seriesChartOption.setOption('background', 'var(--chart-background-color)');
    seriesChartOption.setOption('themeColor.enabled', false);
    seriesChartOption.setOption('themeColor.colors', [isDecreaseComparison ? '#ea6b6b' : '#4dcf36']);
    seriesChartOption.setOption('plotOptions.area.fillColor', isDecreaseComparison ? '#ffeded' : '#eaffe7');
    return seriesChartOption;
  }
}
