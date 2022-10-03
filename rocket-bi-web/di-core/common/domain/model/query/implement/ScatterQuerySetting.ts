/*
 * @author: tvc12 - Thien Vi
 * @created: 5/29/21, 4:36 PM
 */

/*
 * @author: tvc12 - Thien Vi
 * @created: 12/3/20, 10:38 AM
 */

import {
  Condition,
  Equal,
  FieldRelatedFunction,
  Function,
  getFiltersAndSorts,
  InlineSqlView,
  OrderBy,
  QuerySettingType,
  ScatterChartOption,
  TableColumn,
  WidgetId,
  Zoomable
} from '@core/common/domain/model';
import { isEqual } from 'lodash';
import { QuerySetting } from '../QuerySetting';
import { Drilldownable, DrilldownData } from '@core/common/domain/model/query/features/Drilldownable';
import { ZoomData } from '@/shared';
import { ConditionUtils } from '@core/utils';
import { Paginatable } from '@core/common/domain/model/query/features/Paginatable';
import { ConfigDataUtils } from '@/screens/chart-builder/config-builder/config-panel/ConfigDataUtils';

export class ScatterQuerySetting extends QuerySetting<ScatterChartOption> implements Zoomable, Drilldownable, Paginatable {
  private static readonly DEFAULT_NUM_DATA_POINT = 1000;
  readonly className = QuerySettingType.Scatter;

  constructor(
    public xAxis: TableColumn,
    public yAxis: TableColumn,
    public legend?: TableColumn,
    filters: Condition[] = [],
    sorts: OrderBy[] = [],
    options: Record<string, any> = {},
    sqlViews: InlineSqlView[] = []
  ) {
    super(filters, sorts, options, sqlViews);
  }

  get zoomData(): ZoomData {
    return new ZoomData(this.xAxis.function);
  }

  static fromObject(obj: ScatterQuerySetting): ScatterQuerySetting {
    const [filters, sorts] = getFiltersAndSorts(obj);
    const xAxis = TableColumn.fromObject(obj.xAxis);
    const yAxis = TableColumn.fromObject(obj.yAxis);
    const legend = obj.legend ? TableColumn.fromObject(obj.legend) : void 0;
    const sqlViews: InlineSqlView[] = (obj.sqlViews ?? []).map((view: any) => InlineSqlView.fromObject(view));

    return new ScatterQuerySetting(xAxis, yAxis, legend, filters, sorts, obj.options, sqlViews);
  }

  getFrom(): number {
    return 0;
  }

  getSize(): number {
    const vizSetting: ScatterChartOption | undefined = this.getChartOption();
    if (vizSetting && vizSetting.getNumDataPoint) {
      return vizSetting.getNumDataPoint() ?? ScatterQuerySetting.DEFAULT_NUM_DATA_POINT;
    } else {
      return ScatterQuerySetting.DEFAULT_NUM_DATA_POINT;
    }
  }

  getAllFunction(): Function[] {
    if (this.legend) {
      return [this.xAxis.function, this.yAxis.function, this.legend.function];
    } else {
      return [this.xAxis.function, this.yAxis.function];
    }
  }

  getAllTableColumn(): TableColumn[] {
    if (this.legend) {
      return [this.xAxis, this.yAxis, this.legend];
    } else {
      return [this.xAxis, this.yAxis];
    }
  }

  buildQueryDrilldown(drilldownData: DrilldownData): ScatterQuerySetting {
    const newXAxis: TableColumn = this.xAxis.copyWith({
      name: drilldownData.name,
      fieldRelatedFunction: drilldownData.toField
    });
    const currentConditions: Condition[] = this.filters ?? [];
    const equal: Equal = ConditionUtils.buildEqualCondition(this.xAxis, drilldownData.value);
    const drilldownConditions: Condition[] = ConditionUtils.buildDrilldownConditions(currentConditions, equal);
    return new ScatterQuerySetting(
      newXAxis,
      this.yAxis,
      this.legend,
      drilldownConditions,
      this.sorts,
      this.options,

      this.sqlViews
    );
  }

  getColumnWillDrilldown(): TableColumn {
    return this.xAxis;
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

  setDynamicFunctions(functions: Map<WidgetId, TableColumn[]>): void {
    this.xAxis = ConfigDataUtils.replaceDynamicFunction(this.xAxis, functions);
    this.yAxis = ConfigDataUtils.replaceDynamicFunction(this.yAxis, functions);
    if (this.legend) {
      this.legend = ConfigDataUtils.replaceDynamicFunction(this.legend, functions);
    }
  }
}
