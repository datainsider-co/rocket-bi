/*
 * @author: tvc12 - Thien Vi
 * @created: 5/29/21, 4:36 PM
 */

import { QuerySetting } from '@core/common/domain/model/query/QuerySetting';
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
  StackedChartOption,
  TableColumn,
  WidgetId,
  Zoomable
} from '@core/common/domain/model';
import { ZoomData } from '@/shared';
import { Drilldownable, DrilldownData } from '@core/common/domain/model/query/features/Drilldownable';
import { ConditionUtils, Log } from '@core/utils';
import { clone, isEqual } from 'lodash';
import { ListUtils } from '@/utils';
import { ConfigDataUtils } from '@/screens/chart-builder/config-builder/config-panel/ConfigDataUtils';

export class StackedQuerySetting extends QuerySetting<StackedChartOption> implements Zoomable, Drilldownable, Filterable {
  readonly className = QuerySettingType.Series;

  constructor(
    public xAxis: TableColumn,
    public yAxis: TableColumn[],
    public legend?: TableColumn,
    public breakdown?: TableColumn,
    filters: Condition[] = [],
    sorts: OrderBy[] = [],
    options: Record<string, any> = {},
    sqlViews: InlineSqlView[] = [],
    parameters: Record<string, string> = {}
  ) {
    super(filters, sorts, options, sqlViews, parameters);
  }

  get zoomData(): ZoomData {
    return new ZoomData(this.xAxis.function);
  }

  static fromObject(obj: StackedQuerySetting): StackedQuerySetting {
    const [filters, sorts] = getFiltersAndSorts(obj);
    const xAxis = TableColumn.fromObject(obj.xAxis);
    const yAxis = obj.yAxis?.map(yAxis => TableColumn.fromObject(yAxis)) ?? [];
    const legend = obj.legend ? TableColumn.fromObject(obj.legend) : void 0;
    const breakdown = obj.breakdown ? TableColumn.fromObject(obj.breakdown) : void 0;
    const sqlViews: InlineSqlView[] = (obj.sqlViews ?? []).map((view: any) => InlineSqlView.fromObject(view));

    return new StackedQuerySetting(xAxis, yAxis, legend, breakdown, filters, sorts, obj.options, sqlViews, obj.parameters);
  }

  getAllFunction(): Function[] {
    const allFunctions = [this.xAxis.function, ...this.yAxis.map(yAxis => yAxis.function)];
    if (this.legend) {
      allFunctions.push(this.legend.function);
    }
    if (this.breakdown) {
      allFunctions.push(this.breakdown.function);
    }
    return allFunctions;
  }

  getAllTableColumn(): TableColumn[] {
    const allFunctions = [this.xAxis, ...this.yAxis];
    if (this.legend) {
      allFunctions.push(this.legend);
    }
    if (this.breakdown) {
      allFunctions.push(this.breakdown);
    }
    return allFunctions;
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
      this.xAxis.function.setScalarFunction(newScalarFn);
    }
  }

  buildQueryDrilldown(drilldownData: DrilldownData): StackedQuerySetting {
    const xAxis: TableColumn = this.xAxis.copyWith({
      fieldRelatedFunction: drilldownData.toField,
      name: drilldownData.name
    });
    const currentConditions: Condition[] = this.filters ?? [];
    const equal: Equal = ConditionUtils.buildEqualCondition(this.xAxis, drilldownData.value);
    const drilldownConditions: Condition[] = ConditionUtils.buildDrilldownConditions(currentConditions, equal);
    return new StackedQuerySetting(
      xAxis,
      this.yAxis,
      this.legend,
      this.breakdown,
      drilldownConditions,
      this.sorts,
      this.options,

      this.sqlViews,
      this.parameters
    );
  }

  getColumnWillDrilldown(): TableColumn {
    return this.xAxis;
  }

  getFilter(): TableColumn {
    return this.xAxis;
  }

  setDynamicFunctions(functions: Map<WidgetId, TableColumn[]>): void {
    this.xAxis = ConfigDataUtils.replaceDynamicFunction(this.xAxis, functions);
    this.yAxis = ConfigDataUtils.replaceDynamicFunctions(this.yAxis, functions);
    if (this.legend) {
      this.legend = ConfigDataUtils.replaceDynamicFunction(this.legend, functions);
    }
    if (this.breakdown) {
      this.breakdown = ConfigDataUtils.replaceDynamicFunction(this.breakdown, functions);
    }
  }
}
