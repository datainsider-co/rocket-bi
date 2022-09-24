import { TableColumn, WidgetId } from '@core/domain';

export interface TabControlData {
  tableColumns: TableColumn[]; ///Sử dụng cho Dynamic Function,
  defaultTableColumns: TableColumn[]; ///Sử dụng cho Dynamic Function,
  values: string[]; //Sử dụng cho Dynamic Filter
  displayName: string; ///Sử dụng để display trong Condition
  id: WidgetId;
  chartType: string;
}

export interface TreeNode {
  data: TabControlData;
  icon: string;
}

export abstract class TabControl {
  abstract isControl(): boolean;

  abstract toTreeNode(): TreeNode;

  static isTabControl(obj: any): obj is TabControl {
    return !!obj?.toTreeNode;
  }
}
