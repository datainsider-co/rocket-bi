/*
 * @author: tvc12 - Thien Vi
 * @created: 8/6/21, 4:08 PM
 */

import {
  BetweenAndIncluding,
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
import { ConditionUtils } from '@core/utils/ConditionUtils';
import { ChartType, DateRange } from '@/shared';
import { DateHistogramFunctionBuilder } from '@core/common/services';
import { Log } from '@core/utils/Log';
import { DateUtils } from '@/utils';
import { CompareMode as ComparisonMode } from '@/shared/enums/CompareMode.ts';
import { DateRelatedCondition } from '@core/common/domain/model/condition/DateRelatedCondition';

export class ComparisonUtils {
  static getDateFilterRequests(compareOption: ComparisonOptionData): FilterRequest[] {
    const dataRange = compareOption.dataRange;
    if (dataRange && ComparisonUtils.isDataRangeOn(compareOption) && !ComparisonUtils.isComparisonOn(compareOption)) {
      return [FilterRequest.fromCondition(ConditionUtils.buildDateCondition(dataRange.dateField!, dataRange.dateRange))];
    } else {
      return [];
    }
  }

  static getCompareRequest(compareOption: ComparisonOptionData, compareMode: CompareMode): CompareRequest | undefined {
    Log.debug('getCompareRequest::', ComparisonUtils.isComparisonOn(compareOption), compareOption);
    if (ComparisonUtils.isComparisonOn(compareOption)) {
      const dataRange: DataRange = compareOption.dataRange!;
      const firstCondition: FieldRelatedCondition | undefined = ConditionUtils.buildMainDateCondition(
        dataRange.dateField!,
        dataRange.dateRange!,
        dataRange.mode!
      );
      const secondCondition: Condition | undefined = ComparisonUtils.buildSecondCondition(dataRange, compareOption.comparison!);
      return new CompareRequest(firstCondition, secondCondition, compareMode);
      return void 0;
    } else {
      return void 0;
    }
  }

  static getDateRange(mode: MainDateMode): DateRange | null {
    if (mode === MainDateMode.allTime) {
      return DateUtils.getAllTime();
    } else {
      return DateUtils.getDateRange(mode);
    }
  }

  private static buildSecondCondition(dataRange: DataRange, comparison: Comparison): Condition | undefined {
    const field: Field = dataRange.dateField!;
    const firstCondition: FieldRelatedCondition | undefined = ConditionUtils.buildMainDateCondition(field, dataRange.dateRange!, dataRange.mode!);
    const compareMode: ComparisonMode = comparison.mode as any;
    if (dataRange.mode === MainDateMode.custom || dataRange.mode === MainDateMode.allTime) {
      const dateRange = ComparisonUtils.getDateRange(dataRange.mode!) || dataRange.dateRange || DateUtils.getAllTime();
      const compareRange = DateUtils.getCompareDateRange(compareMode, dateRange) ?? DateUtils.getAllTime();
      return ConditionUtils.buildDateCondition(dataRange.dateField!, compareRange);
    } else {
      switch (compareMode) {
        case ComparisonMode.previousPeriod: {
          const dateCondition: DateRelatedCondition = firstCondition as any;
          if (dateCondition) {
            dateCondition.intervalFunction = ComparisonUtils.getIntervalPreviousPeriodFunction(dataRange.mode!);
            return dateCondition;
          } else {
            return void 0;
          }
        }
        case ComparisonMode.custom: {
          const dateRange = ConditionUtils.formatDateRange(comparison.dateRange);
          return new BetweenAndIncluding(field, dateRange.start, dateRange.end);
        }
        case ComparisonMode.samePeriodLastMonth: {
          const dateCondition: DateRelatedCondition = firstCondition as any;
          if (dateCondition) {
            dateCondition.intervalFunction = new PastNMonth(1);
            return firstCondition;
          } else {
            return void 0;
          }
        }
        case ComparisonMode.samePeriodLastQuarter: {
          const dateCondition: DateRelatedCondition = firstCondition as any;
          if (dateCondition) {
            dateCondition.intervalFunction = new PastNQuarter(1);
            return firstCondition;
          } else {
            return void 0;
          }
        }
        case ComparisonMode.samePeriodLastYear: {
          const dateCondition: DateRelatedCondition = firstCondition as any;
          if (dateCondition) {
            dateCondition.intervalFunction = new PastNYear(1);
            return firstCondition;
          } else {
            return void 0;
          }
        }
        default:
          return void 0;
      }
    }
  }

  private static getIntervalPreviousPeriodFunction(mode: MainDateMode): ScalarFunction | undefined {
    switch (mode) {
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
    seriesChartOption.setOption('background', '#00000000');
    seriesChartOption.setOption('themeColor.enabled', false);
    seriesChartOption.setOption('themeColor.colors', [isDecreaseComparison ? '#ea6b6b' : '#4dcf36']);
    seriesChartOption.setOption('plotOptions.area.fillColor', isDecreaseComparison ? '#ffeded' : '#eaffe7');
    return seriesChartOption;
  }
}
