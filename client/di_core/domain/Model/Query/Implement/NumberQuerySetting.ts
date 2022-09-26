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
  MainDateMode,
  NumberChartOption,
  OrderBy,
  QuerySettingType,
  TableColumn,
  WidgetId
} from '@core/domain/Model';
import { QuerySetting } from '../QuerySetting';
import { CompareMode, CompareRequest, FilterRequest } from '@core/domain/Request';
import { ComparisonUtils } from '@core/utils/ComparisonUtils';
import { DateRange } from '@/shared';
import { Log } from '@core/utils';
import { ConfigDataUtils } from '@/screens/ChartBuilder/ConfigBuilder/ConfigPanel/ConfigDataUtils';

export class NumberQuerySetting extends QuerySetting<NumberChartOption> implements Comparable {
  readonly className = QuerySettingType.Number;
  compareRequest: CompareRequest | null;

  constructor(
    public value: TableColumn,
    filters: Condition[] = [],
    sorts: OrderBy[] = [],
    options: Record<string, any> = {},
    sqlViews: InlineSqlView[] = [],
    compareRequest?: CompareRequest | null
  ) {
    super(filters, sorts, options, sqlViews);
    this.compareRequest = compareRequest || null;
  }

  getDateFilterRequests(): FilterRequest[] {
    return ComparisonUtils.getDateFilterRequests(this.getChartOption()?.options ?? {});
  }

  getCompareRequest(): CompareRequest | undefined {
    return ComparisonUtils.getCompareRequest(this.getChartOption()?.options ?? {}, CompareMode.RawValues);
  }

  static fromObject(obj: NumberQuerySetting): NumberQuerySetting {
    const [filters, sorts] = getFiltersAndSorts(obj);
    const value = TableColumn.fromObject(obj.value);
    const sqlViews: InlineSqlView[] = (obj.sqlViews ?? []).map((view: any) => InlineSqlView.fromObject(view));
    const compareRequest: CompareRequest | null = obj.compareRequest ? CompareRequest.fromObject(obj.compareRequest) : null;
    return new NumberQuerySetting(value, filters, sorts, obj.options, sqlViews, compareRequest);
  }

  getAllFunction(): Function[] {
    return [this.value.function];
  }

  getAllTableColumn(): TableColumn[] {
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
    return setting.className === QuerySettingType.Number;
  }

  setDynamicFunctions(functions: Map<WidgetId, TableColumn[]>): void {
    this.value = ConfigDataUtils.replaceDynamicFunction(this.value, functions);
  }
}
