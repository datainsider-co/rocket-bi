/*
 * @author: tvc12 - Thien Vi
 * @created: 5/21/21, 6:08 PM
 */

import { ConfigType, FunctionData, FunctionFamilyTypes } from '@/shared';
import { cloneDeep } from 'lodash';
import { ConvertType, FunctionConvertor, FunctionConvertorData } from '@/screens/chart-builder/config-builder/function-convertor/FunctionConvertor';

export class BubbleFunctionConvertor extends FunctionConvertor {
  private configAllowConvert = new Set([ConfigType.xAxis, ConfigType.yAxis, ConfigType.value]);

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
    const { currentFunction, mapConfigs, currentConfig } = convertorData;
    const clonedMapConfigs = cloneDeep(mapConfigs);
    const convertType: ConvertType = this.getConvertType(currentFunction.functionFamily);

    switch (convertType) {
      case ConvertType.ToGroup:
        this.handleConvertToGroup(clonedMapConfigs, mapConfigs, [currentConfig]);
        break;
      case ConvertType.ToNone:
        this.handleConvertToNone(clonedMapConfigs, mapConfigs, [currentConfig]);
    }

    return clonedMapConfigs;
  }

  private isNotSameFunction(currentFunction: FunctionData, oldFunction?: FunctionData): boolean {
    const oldConvertType: ConvertType = this.getConvertType(oldFunction?.functionFamily);
    const currentConvertType: ConvertType = this.getConvertType(currentFunction.functionFamily);
    return oldConvertType != currentConvertType;
  }
}
