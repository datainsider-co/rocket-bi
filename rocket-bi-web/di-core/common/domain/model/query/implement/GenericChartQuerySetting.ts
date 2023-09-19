/*
 * @author: tvc12 - Thien Vi
 * @created: 12/3/20, 10:39 AM
 */

import {
  Condition,
  Function,
  getFiltersAndSorts,
  InlineSqlView,
  OrderBy,
  QuerySettingClassName,
  TableColumn,
  VariablepieQuerySetting,
  ChartOptionClassName,
  WidgetId
} from '@core/common/domain/model';
import { QuerySetting } from '../QuerySetting';
import { ConfigDataUtils } from '@/screens/chart-builder/config-builder/config-panel/ConfigDataUtils';

export class GenericChartQuerySetting extends QuerySetting {
  readonly className = QuerySettingClassName.GenericChart;

  constructor(
    public columns: TableColumn[],
    filters: Condition[] = [],
    sorts: OrderBy[] = [],
    options: Record<string, any> = {},
    sqlViews: InlineSqlView[] = [],
    parameters: Record<string, string> = {}
  ) {
    super(filters, sorts, options, sqlViews, parameters);
  }

  static fromObject(obj: GenericChartQuerySetting): GenericChartQuerySetting {
    switch (obj.options.className) {
      case ChartOptionClassName.VariablePieSetting:
        return VariablepieQuerySetting.fromObject(obj);
      default:
        return this.defaultFromObject(obj);
    }
  }

  private static defaultFromObject(obj: GenericChartQuerySetting): GenericChartQuerySetting {
    const [filters, sorts] = getFiltersAndSorts(obj);
    const column = obj.columns?.map(collumn => TableColumn.fromObject(collumn)) ?? [];
    const sqlViews: InlineSqlView[] = (obj.sqlViews ?? []).map((view: any) => InlineSqlView.fromObject(view));
    return new GenericChartQuerySetting(column, filters, sorts, obj.options, sqlViews, obj.parameters);
  }

  getAllFunction(): Function[] {
    return this.columns.map(column => column.function);
  }

  getAllTableColumns(): TableColumn[] {
    return this.columns;
  }

  applyDynamicFunctions(functions: Map<WidgetId, TableColumn[]>): void {
    this.columns = ConfigDataUtils.replaceDynamicFunctions(this.columns, functions);
  }
}
