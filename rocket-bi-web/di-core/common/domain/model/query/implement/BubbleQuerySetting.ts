/*
 * @author: tvc12 - Thien Vi
 * @created: 12/3/20, 10:38 AM
 */

import {
  BubbleChartOption,
  Condition,
  Function,
  getFiltersAndSorts,
  InlineSqlView,
  OrderBy,
  QuerySettingClassName,
  TableColumn,
  WidgetId
} from '@core/common/domain/model';
import { QuerySetting } from '@core/common/domain/model/query/QuerySetting';
import { Paginatable } from '@core/common/domain/model/query/features/Paginatable';
import { ConfigDataUtils } from '@/screens/chart-builder/config-builder/config-panel/ConfigDataUtils';

export class BubbleQuerySetting extends QuerySetting implements Paginatable {
  private static readonly DEFAULT_NUM_DATA_POINT = 1000;
  readonly className = QuerySettingClassName.Bubble;

  constructor(
    public xAxis: TableColumn,
    public yAxis: TableColumn,
    public value: TableColumn,
    public legend?: TableColumn,
    filters: Condition[] = [],
    sorts: OrderBy[] = [],
    options: Record<string, any> = {},
    sqlViews: InlineSqlView[] = [],
    parameters: Record<string, string> = {}
  ) {
    super(filters, sorts, options, sqlViews, parameters);
  }

  static fromObject(obj: BubbleQuerySetting): BubbleQuerySetting {
    const [filters, sorts] = getFiltersAndSorts(obj);
    const xAxis = TableColumn.fromObject(obj.xAxis);
    const yAxis = TableColumn.fromObject(obj.yAxis);
    const value = TableColumn.fromObject(obj.value);
    const legend = obj.legend ? TableColumn.fromObject(obj.legend) : void 0;
    const sqlViews: InlineSqlView[] = (obj.sqlViews ?? []).map(view => InlineSqlView.fromObject(view));

    return new BubbleQuerySetting(xAxis, yAxis, value, legend, filters, sorts, obj.options, sqlViews, obj.parameters);
  }

  getAllFunction(): Function[] {
    if (this.legend) {
      return [this.xAxis.function, this.yAxis.function, this.value.function, this.legend.function];
    } else {
      return [this.xAxis.function, this.yAxis.function, this.value.function];
    }
  }

  getAllTableColumns(): TableColumn[] {
    if (this.legend) {
      return [this.xAxis, this.yAxis, this.value, this.legend];
    } else {
      return [this.xAxis, this.yAxis, this.value];
    }
  }

  applyDynamicFunctions(functions: Map<WidgetId, TableColumn[]>): void {
    this.xAxis = ConfigDataUtils.replaceDynamicFunction(this.xAxis, functions);
    this.yAxis = ConfigDataUtils.replaceDynamicFunction(this.yAxis, functions);
    this.value = ConfigDataUtils.replaceDynamicFunction(this.value, functions);
    if (this.legend) {
      this.legend = ConfigDataUtils.replaceDynamicFunction(this.legend, functions);
    }
  }

  getFrom(): number {
    return 0;
  }

  getSize(): number {
    const vizSetting: BubbleChartOption | undefined = this.getChartOption();
    if (vizSetting && vizSetting.getNumDataPoint) {
      return vizSetting.getNumDataPoint() ?? BubbleQuerySetting.DEFAULT_NUM_DATA_POINT;
    } else {
      return BubbleQuerySetting.DEFAULT_NUM_DATA_POINT;
    }
  }

  forecastable(): boolean {
    return true;
  }
}
