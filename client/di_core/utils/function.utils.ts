import { ConfigType, FunctionData, FunctionTreeNode } from '@/shared';
import { DynamicFunctionWidget, Field, ScalarFunction, TableColumn, TabControlData } from '@core/domain/Model';
import { Log } from '@core/utils/Log';

export abstract class FunctionDataUtils {
  static toFunctionTreeNodes(defaultConfigs: FunctionData[]): FunctionTreeNode[] {
    return defaultConfigs.map(config => {
      return {
        id: config.id,
        functionType: config.functionType,
        functionFamily: config.functionFamily,
        optionsOpened: false,
        selectedConfig: config.functionFamily + ' ' + config.functionType,
        selectedCondition: config.functionFamily + ' ' + config.functionType,
        displayName: config.name,
        sorting: config.sorting,
        field: config.field,
        title: config.columnName || 'Unknown',
        parent: {
          title: config.tableName || 'Unknown'
        },
        displayAsColumn: config.displayAsColumn || false,
        isNested: config.isNested || false,
        numElemsShown: config.numElemsShown,
        isShowNElements: config.isShowNElements ?? false,
        data: (config as any).data
      } as FunctionTreeNode;
    });
  }

  static toConfigAsMap(configs: Record<ConfigType, FunctionData[]>): Map<ConfigType, FunctionData[]> {
    const entries: [ConfigType, FunctionData[]][] = Object.entries(configs).map(([key, values], index) => {
      return [key as ConfigType, this.cloneListFunctionData(values)];
    });
    return new Map<ConfigType, FunctionData[]>(entries);
  }

  static cloneListFunctionData(list: FunctionData[]): FunctionData[] {
    return list.map(functionData => this.cloneFunctionData(functionData));
  }

  static cloneFunctionData(data: FunctionData): FunctionData {
    if (data.dynamicFunction) {
      const cloneTabControlData: TabControlData = this.cloneTabControlData(data.dynamicFunction);
      return {
        ...data,
        field: cloneTabControlData.defaultTableColumns[0].function.field,
        dynamicFunction: cloneTabControlData
      };
    } else {
      return {
        ...data,
        field: Field.fromObject(data.field)
      };
    }
  }

  static cloneTabControlData(data: TabControlData): TabControlData {
    return {
      ...data,
      tableColumns: data.tableColumns ? data.tableColumns.map(func => TableColumn.fromObject(func)) : [],
      defaultTableColumns: data ? data.defaultTableColumns.map(func => TableColumn.fromObject(func)) : [],
      values: data.values
    };
  }
}

export const getScalarFunction = (obj: any): ScalarFunction | undefined => {
  if (obj) {
    return ScalarFunction.fromObject(obj);
  } else {
    return void 0;
  }
};
