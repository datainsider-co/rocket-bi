/*
 * @author: tvc12 - Thien Vi
 * @created: 6/2/21, 11:04 AM
 */

import {
  Condition,
  Drilldownable,
  DrilldownData,
  Equal,
  Filterable,
  Function,
  getFiltersAndSorts,
  InlineSqlView,
  OrderBy,
  QuerySettingType,
  TableColumn,
  WidgetId
} from '@core/domain/Model';
import { QuerySetting } from '@core/domain/Model/Query/QuerySetting';
import { ParliamentChartOption } from '@core/domain/Model/ChartOption/Implement/ParliamentChartOption';
import { ConditionUtils } from '@core/utils';
import { ConfigDataUtils } from '@/screens/ChartBuilder/ConfigBuilder/ConfigPanel/ConfigDataUtils';

export class ParliamentQuerySetting extends QuerySetting<ParliamentChartOption> implements Drilldownable, Filterable {
  readonly className = QuerySettingType.Parliament;

  constructor(
    public legend: TableColumn,
    public value: TableColumn,
    filters: Condition[] = [],
    sorts: OrderBy[] = [],
    options: Record<string, any> = {},
    sqlViews: InlineSqlView[] = []
  ) {
    super(filters, sorts, options, sqlViews);
  }

  static fromObject(obj: ParliamentQuerySetting & any): ParliamentQuerySetting {
    const [filters, sorts] = getFiltersAndSorts(obj);
    const legend = TableColumn.fromObject(obj.legend);
    const value = TableColumn.fromObject(obj.value);
    const sqlViews: InlineSqlView[] = (obj.sqlViews ?? []).map((view: any) => InlineSqlView.fromObject(view));

    return new ParliamentQuerySetting(legend, value, filters, sorts, obj.options, sqlViews);
  }

  getAllFunction(): Function[] {
    return [this.legend.function, this.value.function];
  }

  getAllTableColumn(): TableColumn[] {
    return [this.legend, this.value];
  }

  buildQueryDrilldown(drilldownData: DrilldownData): QuerySetting {
    const newLegend: TableColumn = this.legend.copyWith({
      name: drilldownData.name,
      fieldRelatedFunction: drilldownData.toField
    });
    const currentConditions: Condition[] = this.filters ?? [];
    const equal: Equal = ConditionUtils.buildEqualCondition(this.legend, drilldownData.value);
    const drilldownConditions: Condition[] = ConditionUtils.buildDrilldownConditions(currentConditions, equal);
    return new ParliamentQuerySetting(newLegend, this.value, drilldownConditions, this.sorts, this.options, this.sqlViews);
  }

  getColumnWillDrilldown(): TableColumn {
    return this.legend;
  }

  getFilter(): TableColumn {
    return this.legend;
  }

  setDynamicFunctions(functions: Map<WidgetId, TableColumn[]>): void {
    this.legend = ConfigDataUtils.replaceDynamicFunction(this.legend, functions);
    this.value = ConfigDataUtils.replaceDynamicFunction(this.value, functions);
  }
}
