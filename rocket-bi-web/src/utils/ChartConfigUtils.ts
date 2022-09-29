/*
 * @author: tvc12 - Thien Vi
 * @created: 12/25/20, 1:25 PM
 */

import { ConfigType, DraggableConfig, FunctionData, VisualizationItemData } from '@/shared';
import { isNumber } from 'lodash';

export class ChartConfigUtils {
  static cloneToNewConfig(newSelected: VisualizationItemData, lastConfigAsMap: Map<ConfigType, FunctionData[]>): Map<ConfigType, FunctionData[]> {
    const mapSortingAndComparisonConfig: Map<ConfigType, FunctionData[]> = this.getConfigs(lastConfigAsMap, [ConfigType.sorting]);
    const mapConfigs: Map<ConfigType, FunctionData[]> = this.pickAppropriateConfig(newSelected, lastConfigAsMap, [ConfigType.sorting]);
    return new Map<ConfigType, FunctionData[]>([...mapConfigs, ...mapSortingAndComparisonConfig]);
  }

  private static removeFunctionPicked(allFunctionData: FunctionData[], listFunctionDataWillRemove: FunctionData[]): FunctionData[] {
    const allFunctionDataAsSet = new Set(allFunctionData);
    listFunctionDataWillRemove.forEach(fnRemove => {
      allFunctionDataAsSet.delete(fnRemove);
    });
    return Array.from(allFunctionDataAsSet.values());
  }

  private static pickListFunctionData(allFunctionData: FunctionData[], preferFunctionTypes: string[], maxItem: number | undefined): FunctionData[] {
    const listFunctionDataPicked: FunctionData[] = [];
    const preferFunctionTypesAsSet = new Set(preferFunctionTypes);
    allFunctionData.forEach(fnData => {
      if (ChartConfigUtils.isPickFnData(preferFunctionTypesAsSet, fnData, listFunctionDataPicked.length, maxItem)) {
        listFunctionDataPicked.push(fnData);
      }
    });
    return listFunctionDataPicked;
  }

  private static isPickFnData(preferFunctionTypesAsSet: Set<string>, fnData: FunctionData, currentNumItem: number, maxItem: number | undefined): boolean {
    if (preferFunctionTypesAsSet.has(fnData.functionFamily)) {
      if (isNumber(maxItem)) {
        return currentNumItem < maxItem;
      } else {
        return true;
      }
    } else {
      return false;
    }
  }

  /// lấy configs từ 1 số key cho trước
  private static getConfigs(configAsMap: Map<ConfigType, FunctionData[]>, withConfigTypes: ConfigType[]): Map<ConfigType, FunctionData[]> {
    const configsByTypeTuple: [ConfigType, FunctionData[]][] = withConfigTypes.map(configType => {
      return [configType, configAsMap.get(configType) ?? []];
    });
    return new Map<ConfigType, FunctionData[]>(configsByTypeTuple);
  }

  /// Trả ra một map configs loại bỏ những configs đã define ở params
  /// B1: loại bỏ những functionData có trong withoutConfigTypes
  /// B2: chọn những functionData còn lại phù hợp với DraggableConfig
  /// B3: Xóa những item được chọn
  private static pickAppropriateConfig(
    vizItemData: VisualizationItemData,
    configAsMap: Map<ConfigType, FunctionData[]>,
    withoutConfigTypes: ConfigType[]
  ): Map<ConfigType, FunctionData[]> {
    const configAfterRemove = this.removeConfigWith(configAsMap, withoutConfigTypes);
    const newConfigs: Map<ConfigType, FunctionData[]> = new Map();
    let allFunctionData: FunctionData[] = Array.from(configAfterRemove.values()).flat();
    vizItemData.configPanels.forEach((config: DraggableConfig) => {
      const listFnDataPicked: FunctionData[] = this.pickListFunctionData(allFunctionData, config.preferFunctionTypes, config.maxItem);
      newConfigs.set(config.key, listFnDataPicked);
      allFunctionData = this.removeFunctionPicked(allFunctionData, listFnDataPicked);
    });
    return newConfigs;
  }

  private static removeConfigWith(configs: Map<ConfigType, FunctionData[]>, configTypesToRemove: ConfigType[]): Map<ConfigType, FunctionData[]> {
    const cloneConfigs = new Map(configs);
    configTypesToRemove.forEach(config => {
      cloneConfigs.delete(config);
    });
    return cloneConfigs;
  }
}
