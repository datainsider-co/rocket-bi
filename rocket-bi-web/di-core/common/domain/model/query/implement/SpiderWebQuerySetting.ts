import {
  Condition,
  Equal,
  FieldRelatedFunction,
  Filterable,
  Function,
  getFiltersAndSorts,
  InlineSqlView,
  OrderBy,
  QuerySettingType,
  SpiderWebChartOption,
  TableColumn,
  WidgetId,
  Zoomable
} from '@core/common/domain/model';
import { clone, isEqual } from 'lodash';
import { QuerySetting } from '../QuerySetting';
import { ZoomData } from '@/shared';
import { Drilldownable, DrilldownData } from '@core/common/domain/model/query/features/Drilldownable';
import { ConditionUtils } from '@core/utils';
import { ListUtils } from '@/utils';
import { ConfigDataUtils } from '@/screens/chart-builder/config-builder/config-panel/ConfigDataUtils';

export class SpiderWebQuerySetting extends QuerySetting<SpiderWebChartOption> implements Zoomable, Drilldownable, Filterable {
  readonly className = QuerySettingType.SpiderWeb;

  constructor(
    public legend: TableColumn,
    public values: TableColumn[],
    filters: Condition[] = [],
    sorts: OrderBy[] = [],
    options: Record<string, any> = {},

    sqlViews: InlineSqlView[] = []
  ) {
    super(filters, sorts, options, sqlViews);
  }

  get zoomData(): ZoomData {
    return new ZoomData(this.legend.function);
  }

  static fromObject(obj: SpiderWebQuerySetting): SpiderWebQuerySetting {
    const [filters, sorts] = getFiltersAndSorts(obj);
    const legend = TableColumn.fromObject(obj.legend);
    const values = obj.values?.map(value => TableColumn.fromObject(value)) ?? [];
    const sqlViews: InlineSqlView[] = (obj.sqlViews ?? []).map((view: any) => InlineSqlView.fromObject(view));

    return new SpiderWebQuerySetting(legend, values, filters, sorts, obj.options, sqlViews);
  }

  getAllFunction(): Function[] {
    return [this.legend.function, ...this.values.map(yAxis => yAxis.function)];
  }

  getAllTableColumn(): TableColumn[] {
    return [this.legend, ...this.values];
  }

  buildNewZoomData(data: ZoomData, nextLvl: string): ZoomData {
    return data.createNewHorizontalField(nextLvl);
  }

  setZoomData(data: ZoomData): void {
    if (data.horizontalLevel?.scalarFunction) {
      const newScalarFn = data.horizontalLevel.scalarFunction;
      this.sorts
        .filter(sort => sort.function instanceof FieldRelatedFunction && isEqual(sort.function.field, data.horizontalLevel.field))
        .forEach(sort => (sort.function as FieldRelatedFunction).setScalarFunction(newScalarFn));
      this.legend.function.setScalarFunction(newScalarFn);
    }
  }

  buildQueryDrilldown(drilldownData: DrilldownData): SpiderWebQuerySetting {
    const legend: TableColumn = this.legend.copyWith({
      fieldRelatedFunction: drilldownData.toField,
      name: drilldownData.name
    });
    const currentConditions: Condition[] = this.filters ?? [];
    const equal: Equal = ConditionUtils.buildEqualCondition(this.legend, drilldownData.value);
    const drilldownConditions: Condition[] = ConditionUtils.buildDrilldownConditions(currentConditions, equal);
    return new SpiderWebQuerySetting(legend, this.values, drilldownConditions, this.sorts, this.options, this.sqlViews);
  }

  getColumnWillDrilldown(): TableColumn {
    return this.legend;
  }

  getFilter(): TableColumn {
    return this.legend;
  }

  setDynamicFunctions(functions: Map<WidgetId, TableColumn[]>): void {
    this.legend = ConfigDataUtils.replaceDynamicFunction(this.legend, functions);
    this.values = ConfigDataUtils.replaceDynamicFunctions(this.values, functions);
  }
}
