import { Field, TableColumn, WidgetId } from '@core/common/domain';
import { ListUtils } from '@/utils';

export interface TabControlData {
  tableColumns: TableColumn[]; ///Sử dụng cho Dynamic Function,
  defaultTableColumns: TableColumn[]; ///Sử dụng cho Dynamic Function,
  values: string[]; //Sử dụng cho Dynamic Filter
  displayName: string; ///Sử dụng để display trong Condition
  id: WidgetId;
  chartType: string;
}

export abstract class TabControl {
  abstract isControl(): boolean;

  abstract toTabControlData(): TabControlData;

  static getDefaultField(obj: TabControlData): Field | undefined {
    return ListUtils.getHead(obj.defaultTableColumns)?.function?.field || void 0;
  }

  static isTabControl(obj: any & TabControl): obj is TabControl {
    return obj && obj.isControl && obj.toTabControlData;
  }

  static isTabControlData(obj: any & TabControlData): obj is TabControlData {
    return obj && obj.tableColumns && obj.defaultTableColumns && obj.values && obj.displayName && obj.id && obj.chartType;
  }
}
