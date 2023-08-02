import { getFiltersAndSorts, QuerySetting } from '../QuerySetting';
import { Condition, OrderBy, QuerySettingType, SankeyChartOption, TableColumn, Function, InlineSqlView, WidgetId } from '@core/common/domain/model';
import { ListUtils } from '@/utils';
import { clone } from 'lodash';
import { ConfigDataUtils } from '@/screens/chart-builder/config-builder/config-panel/ConfigDataUtils';

export class SankeyQuerySetting extends QuerySetting<SankeyChartOption> {
  className: QuerySettingType = QuerySettingType.Sankey;
  constructor(
    public source: TableColumn,
    public destination: TableColumn,
    public breakdowns: TableColumn[],
    public weight: TableColumn,
    filters: Condition[] = [],
    sorts: OrderBy[] = [],
    options: Record<string, any> = {},

    sqlViews: InlineSqlView[] = [],
    parameters: Record<string, string> = {}
  ) {
    super(filters, sorts, options, sqlViews, parameters);
  }

  getAllFunction(): Function[] {
    return [this.source.function, this.destination.function, ...this.breakdowns.map(breakdown => breakdown.function), this.weight.function];
  }

  getAllTableColumn(): TableColumn[] {
    return [this.source, this.destination, ...this.breakdowns, this.weight];
  }
  static fromObject(obj: SankeyQuerySetting) {
    const source = TableColumn.fromObject(obj.source);
    const destination = TableColumn.fromObject(obj.destination);
    const weight = TableColumn.fromObject(obj.weight);
    const breakdowns: TableColumn[] = obj.breakdowns?.map(breakdown => TableColumn.fromObject(breakdown)) ?? [];
    const sqlViews: InlineSqlView[] = (obj.sqlViews ?? []).map((view: any) => InlineSqlView.fromObject(view));
    const [filters, sorts] = getFiltersAndSorts(obj);

    return new SankeyQuerySetting(source, destination, breakdowns, weight, filters, sorts, obj.options, sqlViews, obj.parameters);
  }

  setDynamicFunctions(functions: Map<WidgetId, TableColumn[]>): void {
    this.source = ConfigDataUtils.replaceDynamicFunction(this.source, functions);
    this.destination = ConfigDataUtils.replaceDynamicFunction(this.destination, functions);
    this.breakdowns = ConfigDataUtils.replaceDynamicFunctions(this.breakdowns, functions);
    this.weight = ConfigDataUtils.replaceDynamicFunction(this.weight, functions);
  }
}
