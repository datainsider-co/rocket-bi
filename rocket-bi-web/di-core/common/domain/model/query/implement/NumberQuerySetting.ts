/*
 * @author: tvc12 - Thien Vi
 * @created: 12/3/20, 10:38 AM
 */

import {
  Comparable,
  Condition,
  Function,
  getFiltersAndSorts,
  InlineSqlView,
  KPITheme,
  MainDateMode,
  OrderBy,
  QuerySettingClassName,
  TableColumn,
  WidgetId
} from '@core/common/domain/model';
import { QuerySetting } from '../QuerySetting';
import { CompareMode, CompareRequest, FilterRequest } from '@core/common/domain/request';
import { ComparisonUtils } from '@core/utils/ComparisonUtils';
import { DateRange } from '@/shared';
import { Log } from '@core/utils';
import { ConfigDataUtils } from '@/screens/chart-builder/config-builder/config-panel/ConfigDataUtils';
import { KPILayout } from '@chart/widget-renderer/number-render/layout-implement/KPILayout';

export class NumberQuerySetting extends QuerySetting implements Comparable {
  readonly className = QuerySettingClassName.Number;
  compareRequest: CompareRequest | null;

  constructor(
    public value: TableColumn,
    filters: Condition[] = [],
    sorts: OrderBy[] = [],
    options: Record<string, any> = {},
    sqlViews: InlineSqlView[] = [],
    compareRequest?: CompareRequest | null,
    parameters: Record<string, string> = {}
  ) {
    super(filters, sorts, options, sqlViews, parameters);
    this.compareRequest = compareRequest || null;
  }

  getDateFilterRequests(): FilterRequest[] {
    return ComparisonUtils.getDateFilterRequests(this.getChartOption()?.options ?? {});
  }

  getCompareRequest(): CompareRequest | undefined {
    return ComparisonUtils.toCompareRequest(this.getChartOption()?.options ?? {}, CompareMode.RawValues);
  }

  static fromObject(obj: NumberQuerySetting): NumberQuerySetting {
    const [filters, sorts] = getFiltersAndSorts(obj);
    const value = TableColumn.fromObject(obj.value);
    const sqlViews: InlineSqlView[] = (obj.sqlViews ?? []).map((view: any) => InlineSqlView.fromObject(view));
    const compareRequest: CompareRequest | null = obj.compareRequest ? CompareRequest.fromObject(obj.compareRequest) : null;
    return new NumberQuerySetting(value, filters, sorts, obj.options, sqlViews, compareRequest, obj.parameters);
  }

  getAllFunction(): Function[] {
    return [this.value.function];
  }

  getAllTableColumns(): TableColumn[] {
    return [this.value];
  }

  setDateRange(compareDateRange: DateRange | null, filterMode: MainDateMode) {
    const numberChartOption = this.getChartOption();
    Log.debug('setDateRange::', numberChartOption?.options.dataRange);
    if (numberChartOption && numberChartOption.options.dataRange) {
      numberChartOption.options.dataRange.dateRange = compareDateRange ?? undefined;
      numberChartOption.options.dataRange.mode = filterMode;
    }
  }

  static isNumberQuerySetting(setting: QuerySetting): setting is NumberQuerySetting {
    return setting.className === QuerySettingClassName.Number;
  }

  applyDynamicFunctions(functions: Map<WidgetId, TableColumn[]>): void {
    this.value = ConfigDataUtils.replaceDynamicFunction(this.value, functions);
  }

  getDefaultSize(): [number, number] {
    switch (this.getChartOption()?.options.theme) {
      case KPITheme.Style9:
      case KPITheme.Style10:
      case KPITheme.Style11:
      case KPITheme.Style12:
        return [8, 8];
      case KPITheme.Style8:
      case KPITheme.Style7:
        return [15, 5];
      default:
        return [16, 8];
    }
  }
}
