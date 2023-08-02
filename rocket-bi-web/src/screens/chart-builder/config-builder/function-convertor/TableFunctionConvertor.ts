/*
 * @author: tvc12 - Thien Vi
 * @created: 5/21/21, 6:08 PM
 */

import { ConfigType, FunctionData, FunctionFamilyTypes } from '@/shared';
import { cloneDeep } from 'lodash';
import { ConvertType, FunctionConvertor, FunctionConvertorData } from '@/screens/chart-builder/config-builder/function-convertor/FunctionConvertor';
import { Log } from '@core/utils';
import { DynamicFunctionWidget } from '@core/common/domain';

export class TableFunctionConvertor extends FunctionConvertor {
  private configAllowConvert = new Set([ConfigType.columns]);

  canConvert(convertorData: FunctionConvertorData): boolean {
    const { currentFunction, oldFunction, currentConfig } = convertorData;
    return this.configAllowConvert.has(currentConfig) && this.isNotSameFunction(currentFunction, oldFunction);
  }

  getConvertType(functionFamily?: string): ConvertType {
    switch (functionFamily) {
      case FunctionFamilyTypes.groupBy:
      case FunctionFamilyTypes.dateHistogram:
      case FunctionFamilyTypes.aggregation:
        return ConvertType.ToGroup;
      case FunctionFamilyTypes.none:
        return ConvertType.ToNone;
      default:
        return ConvertType.Unknown;
    }
  }

  convert(convertorData: FunctionConvertorData): Map<ConfigType, FunctionData[]> {
    const { currentFunction, mapConfigs } = convertorData;
    const clonedMapConfigs = cloneDeep(mapConfigs);
    const targetType: ConvertType = this.getConvertType(currentFunction.functionFamily);
    clonedMapConfigs.forEach((listFunctionData: FunctionData[], key: ConfigType) => {
      for (let index = 0; index < listFunctionData.length; index++) {
        const functionData: FunctionData = listFunctionData[index];
        ///Not convert if column is dynamic
        const isDynamicWidget = DynamicFunctionWidget.isDynamicFunctionWidget(functionData.dynamicFunction);
        if (functionData.id != currentFunction.id && this.isNotSameFunction(currentFunction, functionData) && !isDynamicWidget) {
          listFunctionData[index] = this.handleConvert(functionData, targetType);
        }
      }
    });

    return clonedMapConfigs;
  }

  private isNotSameFunction(currentFunction: FunctionData, oldFunction?: FunctionData): boolean {
    const oldConvertType: ConvertType = this.getConvertType(oldFunction?.functionFamily);
    const currentConvertType: ConvertType = this.getConvertType(currentFunction.functionFamily);
    return oldConvertType != currentConvertType;
  }

  private handleConvert(functionData: FunctionData, convertType: ConvertType): FunctionData {
    switch (convertType) {
      case ConvertType.ToGroup:
        return this.convertToGroupBy(functionData);
      case ConvertType.ToNone:
        return this.convertToNone(functionData);
      default:
        return functionData;
    }
  }
}
