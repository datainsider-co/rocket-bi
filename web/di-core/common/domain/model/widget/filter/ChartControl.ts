import { ChartInfoType, TableColumn, ValueController, WidgetId } from '@core/common/domain';
import { isFunction } from 'lodash';
import { ChartType } from '@/shared/enums/ChartType';

export interface ChartControlData {
  tableColumns: TableColumn[];
  defaultTableColumns: TableColumn[];
  /**
   * Display name
   */
  displayName: string;
  id: WidgetId;
  chartType: ChartType;
  /**
   * default chart info type is Normal
   */
  chartInfoType?: ChartInfoType;
}

export abstract class ChartControl {
  /**
   * Check control is enable or not
   */
  abstract isEnableControl(): boolean;

  abstract getControlId(): WidgetId;

  abstract getChartControlData(): ChartControlData;

  abstract getChartInfoType(): ChartInfoType;

  abstract getValueController(): ValueController | undefined;

  static isChartControl(obj: any): obj is ChartControl {
    return (
      obj && isFunction(obj.isEnableControl) && isFunction(obj.getChartControlData) && isFunction(obj.getChartInfoType) && isFunction(obj.getValueController)
    );
  }

  static isChartControlData(obj: any & ChartControlData): obj is ChartControlData {
    return obj && obj.tableColumns && obj.defaultTableColumns && obj.displayName && obj.id && obj.chartType;
  }
}
