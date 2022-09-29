/*
 * @author: tvc12 - Thien Vi
 * @created: 12/3/20, 10:33 AM
 */

import {
  BellCurveChartOption2,
  BellCurveChartOption,
  Condition,
  Function,
  getFiltersAndSorts,
  OrderBy,
  Paginatable,
  QuerySettingType,
  TableColumn,
  Zoomable,
  InlineSqlView,
  WidgetId,
  FieldRelatedFunction
} from '@core/common/domain/model';
import { isEqual } from 'lodash';
import { QuerySetting } from '../QuerySetting';
import { ZoomData } from '@/shared';
import { Log } from '@core/utils';
import { ConfigDataUtils } from '@/screens/chart-builder/config-builder/config-panel/ConfigDataUtils';

export class BellCurveQuerySetting extends QuerySetting<BellCurveChartOption> implements Zoomable {
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

  static fromObject(obj: BellCurveQuerySetting): BellCurveQuerySetting {
    const [filters, sorts] = getFiltersAndSorts(obj);
    const xAxis = TableColumn.fromObject(obj.xAxis);
    const yAxis = TableColumn.fromObject(obj.yAxis);
    const legend = obj.legend ? TableColumn.fromObject(obj.legend) : void 0;

    const sqlViews: InlineSqlView[] = (obj.sqlViews ?? []).map(view => InlineSqlView.fromObject(view));
    return new BellCurveQuerySetting(xAxis, yAxis, legend, filters, sorts, obj.options, sqlViews);
  }

  //
  // buildQueryDrilldown(drilldownData: DrilldownData): QuerySetting {
  //   const newXAxis: TableColumn = this.xAxis.copyWith({
  //     name: drilldownData.name,
  //     fieldRelatedFunction: drilldownData.toField
  //   });
  //   const newFilters: Condition[] = this.filters ?? [];
  //   const equal: Equal = FilterUtils.buildEqualCondition(this.xAxis, drilldownData.value);
  //   this.filters.push(equal);
  //   return new BellCurveQueryChartSetting(newXAxis, this.yAxis, this.legend, newFilters, this.sorts, {});
  // }
  //
  // getColumnWillDrilldown(): TableColumn {
  //   return this.xAxis;
  // }

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

  setDynamicFunctions(functions: Map<WidgetId, TableColumn[]>): void {
    this.xAxis = ConfigDataUtils.replaceDynamicFunction(this.xAxis, functions);
    this.yAxis = ConfigDataUtils.replaceDynamicFunction(this.yAxis, functions);
    if (this.legend) {
      this.legend = ConfigDataUtils.replaceDynamicFunction(this.legend, functions);
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
}

export class BellCurve2QuerySetting extends QuerySetting<BellCurveChartOption2> implements Zoomable, Paginatable {
  private static readonly DEFAULT_NUM_DATA_POINT = 1000;
  readonly className = QuerySettingType.BellCurve;

  constructor(public value: TableColumn, filters: Condition[] = [], sorts: OrderBy[] = [], options: Record<string, any> = {}, sqlViews: InlineSqlView[] = []) {
    super(filters, sorts, options, sqlViews);
  }

  get zoomData(): ZoomData {
    return new ZoomData(this.value.function);
  }

  static fromObject(obj: BellCurve2QuerySetting): BellCurve2QuerySetting {
    const [filters, sorts] = getFiltersAndSorts(obj);
    const value = TableColumn.fromObject(obj.value);
    const sqlViews: InlineSqlView[] = (obj.sqlViews ?? []).map((view: any) => InlineSqlView.fromObject(view));

    return new BellCurve2QuerySetting(value, filters, sorts, obj.options, sqlViews);
  }

  //
  // buildQueryDrilldown(drilldownData: DrilldownData): QuerySetting {
  //   const newXAxis: TableColumn = this.xAxis.copyWith({
  //     name: drilldownData.name,
  //     fieldRelatedFunction: drilldownData.toField
  //   });
  //   const newFilters: Condition[] = this.filters ?? [];
  //   const equal: Equal = FilterUtils.buildEqualCondition(this.xAxis, drilldownData.value);
  //   this.filters.push(equal);
  //   return new BellCurveQueryChartSetting(newXAxis, this.yAxis, this.legend, newFilters, this.sorts, {});
  // }
  //
  // getColumnWillDrilldown(): TableColumn {
  //   return this.xAxis;
  // }

  getAllFunction(): Function[] {
    return [this.value.function];
  }

  getAllTableColumn(): TableColumn[] {
    return [this.value];
  }

  setDynamicFunctions(functions: Map<WidgetId, TableColumn[]>): void {
    this.value = ConfigDataUtils.replaceDynamicFunction(this.value, functions);
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
      this.value.function.setScalarFunction(newScalarFn);
    }
  }

  getFrom(): number {
    return 0;
  }

  getSize(): number {
    const vizSetting: BellCurveChartOption2 | undefined = this.getChartOption();
    Log.debug('setting from get size::', vizSetting?.className);
    if (vizSetting && vizSetting.getNumDataPoint) {
      return vizSetting.getNumDataPoint() ?? BellCurve2QuerySetting.DEFAULT_NUM_DATA_POINT;
    } else {
      return BellCurve2QuerySetting.DEFAULT_NUM_DATA_POINT;
    }
  }

  static isBellCurve2QuerySetting(obj: any): obj is BellCurve2QuerySetting {
    return obj.className === QuerySettingType.BellCurve;
  }
}
