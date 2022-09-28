/*
 * @author: tvc12 - Thien Vi
 * @created: 5/24/21, 11:47 AM
 */

import {
  AGGREGATION_FUNCTION_FOR_DATE,
  AGGREGATION_FUNCTION_FOR_NUMBER,
  AGGREGATION_FUNCTION_FOR_TEXT,
  ConfigType,
  DateFunctionTypes,
  FunctionData,
  FunctionFamilyTypes,
  VisualizationItemData
} from '@/shared';
import { DataType } from '@core/schema/service/FieldFilter';

export enum ConvertType {
  ToGroup = 1,
  ToNone = 2,
  ToAggregation = 3,
  Unknown = 4
}

export interface FunctionConvertorData {
  itemSelected: VisualizationItemData;
  currentConfig: ConfigType;
  currentFunction: FunctionData;
  mapConfigs: Map<ConfigType, FunctionData[]>;
  oldFunction?: FunctionData;
}

export abstract class FunctionConvertor {
  abstract canConvert(convertorData: FunctionConvertorData): boolean;

  abstract convert(convertorData: FunctionConvertorData): Map<ConfigType, FunctionData[]>;

  protected handleConvertToGroup(
    clonedMapConfigs: Map<ConfigType, FunctionData[]>,
    currentMapConfigs: Map<ConfigType, FunctionData[]>,
    listIgnoreConvert: ConfigType[]
  ): void {
    const setIgnoreConvert = new Set(listIgnoreConvert);
    // const
    clonedMapConfigs.forEach((listFunctionData: FunctionData[], key: ConfigType) => {
      if (!setIgnoreConvert.has(key)) {
        for (let index = 0; index < listFunctionData.length; index++) {
          const functionData = listFunctionData[index];
          listFunctionData[index] = this.convertToGroupBy(functionData);
        }
      }
    });
  }

  protected handleConvertToNone(
    clonedMapConfigs: Map<ConfigType, FunctionData[]>,
    currentMapConfigs: Map<ConfigType, FunctionData[]>,
    listIgnoreConvert: ConfigType[]
  ): void {
    const setIgnoreConvert = new Set(listIgnoreConvert);
    // const
    clonedMapConfigs.forEach((listFunctionData: FunctionData[], key: ConfigType) => {
      if (!setIgnoreConvert.has(key)) {
        for (let index = 0; index < listFunctionData.length; index++) {
          const functionData = listFunctionData[index];
          listFunctionData[index] = this.convertToNone(functionData);
        }
      }
    });
  }

  protected handleConvertToAggregation(
    clonedMapConfigs: Map<ConfigType, FunctionData[]>,
    currentMapConfigs: Map<ConfigType, FunctionData[]>,
    listIgnoreConvert: ConfigType[]
  ): void {
    const setIgnoreConvert = new Set(listIgnoreConvert);
    // const
    clonedMapConfigs.forEach((listFunctionData: FunctionData[], key: ConfigType) => {
      if (!setIgnoreConvert.has(key)) {
        for (let index = 0; index < listFunctionData.length; index++) {
          const functionData = listFunctionData[index];
          listFunctionData[index] = this.convertToAggregation(functionData);
        }
      }
    });
  }

  protected convertToGroupBy(functionData: FunctionData): FunctionData {
    const dataType = functionData.field?.getDataType();
    switch (dataType) {
      case DataType.Text:
      case DataType.Number: {
        functionData.functionFamily = FunctionFamilyTypes.groupBy;
        functionData.functionType = '';
        break;
      }
      case DataType.Date: {
        functionData.functionFamily = FunctionFamilyTypes.dateHistogram;
        functionData.functionType = DateFunctionTypes.year;
        break;
      }
    }

    return functionData;
  }

  protected convertToNone(functionData: FunctionData): FunctionData {
    const dataType = functionData.field?.getDataType();
    switch (dataType) {
      case DataType.Text:
      case DataType.Number:
      case DataType.Date: {
        functionData.functionFamily = FunctionFamilyTypes.none;
        functionData.functionType = '';
        break;
      }
    }

    return functionData;
  }

  protected convertToAggregation(functionData: FunctionData): FunctionData {
    const dataType = functionData.field?.getDataType();
    functionData.functionFamily = FunctionFamilyTypes.aggregation;
    switch (dataType) {
      case DataType.Text: {
        functionData.functionType = AGGREGATION_FUNCTION_FOR_TEXT.type;
        break;
      }
      case DataType.Number: {
        functionData.functionType = AGGREGATION_FUNCTION_FOR_NUMBER.type;
        break;
      }
      case DataType.Date: {
        functionData.functionType = AGGREGATION_FUNCTION_FOR_DATE.type;
        break;
      }
    }

    return functionData;
  }
}
