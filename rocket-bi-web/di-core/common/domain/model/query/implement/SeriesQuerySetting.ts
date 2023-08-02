/*
 * @author: tvc12 - Thien Vi
 * @created: 12/3/20, 10:39 AM
 */

import {
  Condition,
  CrossFilterable,
  Equal,
  FieldRelatedFunction,
  Filterable,
  Function,
  getFiltersAndSorts,
  InlineSqlView,
  OrderBy,
  QuerySettingType,
  SeriesChartOption,
  TableColumn,
  WidgetId,
  Zoomable
} from '@core/common/domain/model';
import { clone, isEqual } from 'lodash';
import { QuerySetting } from '../QuerySetting';
import { ZoomData } from '@/shared';
import { Drilldownable, DrilldownData } from '@core/common/domain/model/query/features/Drilldownable';
import { ConditionUtils, Log } from '@core/utils';
import { ListUtils } from '@/utils';
import { ConfigDataUtils } from '@/screens/chart-builder/config-builder/config-panel/ConfigDataUtils';

export class SeriesQuerySetting extends QuerySetting<SeriesChartOption> implements Zoomable, Drilldownable, CrossFilterable {
  readonly className = QuerySettingType.Series;

  constructor(
    public xAxis: TableColumn,
    public yAxis: TableColumn[],
    public legend?: TableColumn,
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

  static fromObject(obj: SeriesQuerySetting): SeriesQuerySetting {
    const [filters, sorts] = getFiltersAndSorts(obj);
    const xAxis = TableColumn.fromObject(obj.xAxis);
    const yAxis = obj.yAxis?.map(yAxis => TableColumn.fromObject(yAxis)) ?? [];
    const legend = obj.legend ? TableColumn.fromObject(obj.legend) : void 0;

    const sqlViews: InlineSqlView[] = (obj.sqlViews ?? []).map((view: any) => InlineSqlView.fromObject(view));

    return new SeriesQuerySetting(xAxis, yAxis, legend, filters, sorts, obj.options, sqlViews, obj.parameters);
  }

  getAllFunction(): Function[] {
    if (this.legend) {
      return [this.xAxis.function, ...this.yAxis.map(yAxis => yAxis.function), this.legend.function];
    } else {
      return [this.xAxis.function, ...this.yAxis.map(yAxis => yAxis.function)];
    }
  }

  getAllTableColumn(): TableColumn[] {
    if (this.legend) {
      return [this.xAxis, ...this.yAxis, this.legend];
    } else {
      return [this.xAxis, ...this.yAxis];
    }
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

  buildQueryDrilldown(drilldownData: DrilldownData): SeriesQuerySetting {
    const xAxis: TableColumn = this.xAxis.copyWith({
      fieldRelatedFunction: drilldownData.toField,
      name: drilldownData.name
    });
    const currentConditions: Condition[] = this.filters ?? [];
    const equal: Equal = ConditionUtils.buildEqualCondition(this.xAxis, drilldownData.value);
    const drilldownConditions: Condition[] = ConditionUtils.buildDrilldownConditions(currentConditions, equal);
    return new SeriesQuerySetting(
      xAxis,
      this.yAxis,
      this.legend,
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

  setDynamicFunctions(functions: Map<WidgetId, TableColumn[]>): void {
    this.xAxis = ConfigDataUtils.replaceDynamicFunction(this.xAxis, functions);
    this.yAxis = ConfigDataUtils.replaceDynamicFunctions(this.yAxis, functions);
    if (this.legend) {
      this.legend = ConfigDataUtils.replaceDynamicFunction(this.legend, functions);
    }
  }

  getFilter(): TableColumn {
    return this.xAxis;
  }

  isEnableCrossFilter(): boolean {
    return true;
  }
}
