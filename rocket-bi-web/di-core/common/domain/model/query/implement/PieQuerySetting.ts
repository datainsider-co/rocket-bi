/*
 * @author: tvc12 - Thien Vi
 * @created: 5/29/21, 4:36 PM
 */

import {
  Condition,
  Equal,
  FieldRelatedFunction,
  Filterable,
  Function,
  getFiltersAndSorts,
  InlineSqlView,
  OrderBy,
  PieChartOption,
  QuerySettingType,
  TableColumn,
  WidgetId,
  Zoomable
} from '@core/common/domain/model';
import { isEqual } from 'lodash';
import { QuerySetting } from '../QuerySetting';
import { Drilldownable, DrilldownData } from '@core/common/domain/model/query/features/Drilldownable';
import { ZoomData } from '@/shared';
import { ConditionUtils } from '@core/utils';
import { ConfigDataUtils } from '@/screens/chart-builder/config-builder/config-panel/ConfigDataUtils';

export class PieQuerySetting extends QuerySetting<PieChartOption> implements Filterable, Zoomable, Drilldownable {
  readonly className = QuerySettingType.Pie;

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

  get zoomData(): ZoomData {
    return new ZoomData(this.legend.function);
  }

  static fromObject(obj: PieQuerySetting): PieQuerySetting {
    const [filters, sorts] = getFiltersAndSorts(obj);
    const legend = TableColumn.fromObject(obj.legend);
    const value = TableColumn.fromObject(obj.value);
    const sqlViews: InlineSqlView[] = (obj.sqlViews ?? []).map((view: any) => InlineSqlView.fromObject(view));

    return new PieQuerySetting(legend, value, filters, sorts, obj.options, sqlViews);
  }

  getAllFunction(): Function[] {
    return [this.legend.function, this.value.function];
  }

  getAllTableColumn(): TableColumn[] {
    return [this.legend, this.value];
  }

  getFilter(): TableColumn {
    return this.legend;
  }

  buildQueryDrilldown(drilldownData: DrilldownData): PieQuerySetting {
    const newLegend: TableColumn = this.legend.copyWith({
      name: drilldownData.name,
      fieldRelatedFunction: drilldownData.toField
    });
    const currentConditions: Condition[] = this.filters ?? [];
    const equal: Equal = ConditionUtils.buildEqualCondition(this.legend, drilldownData.value);
    const drilldownConditions: Condition[] = ConditionUtils.buildDrilldownConditions(currentConditions, equal);
    return new PieQuerySetting(newLegend, this.value, drilldownConditions, this.sorts, this.options, this.sqlViews);
  }

  getColumnWillDrilldown(): TableColumn {
    return this.legend;
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

  setDynamicFunctions(functions: Map<WidgetId, TableColumn[]>): void {
    this.legend = ConfigDataUtils.replaceDynamicFunction(this.legend, functions);
    this.value = ConfigDataUtils.replaceDynamicFunction(this.value, functions);
  }
}
