/*
 * @author: tvc12 - Thien Vi
 * @created: 12/25/20, 1:25 PM
 */

import { ConfigType, DraggableConfig, FunctionData, VisualizationItemData } from '@/shared';
import { isNumber } from 'lodash';
import { ListUtils } from '@/utils/ListUtils';

export class ChartConfigUtils {
  static convertToNewConfig(selectedItem: VisualizationItemData, oldConfig: Map<ConfigType, FunctionData[]>): Map<ConfigType, FunctionData[]> {
    const sortingMap: Map<ConfigType, FunctionData[]> = this.getConfigAsMap(oldConfig, [ConfigType.sorting]);
    const newConfigMap: Map<ConfigType, FunctionData[]> = this.suggestConfigAsMap(selectedItem, oldConfig, [ConfigType.sorting]);
    return new Map<ConfigType, FunctionData[]>([...newConfigMap, ...sortingMap]);
  }

  /// get config by config type
  private static getConfigAsMap(configAsMap: Map<ConfigType, FunctionData[]>, configType: ConfigType[]): Map<ConfigType, FunctionData[]> {
    const configAndFnList: [ConfigType, FunctionData[]][] = configType.map(configType => {
      return [configType, configAsMap.get(configType) ?? []];
    });
    return new Map<ConfigType, FunctionData[]>(configAndFnList);
  }

  private static suggestConfigAsMap(
    selectedItem: VisualizationItemData,
    oldConfigMap: Map<ConfigType, FunctionData[]>,
    ignoreConfigTypes: ConfigType[]
  ): Map<ConfigType, FunctionData[]> {
    const currentConfigMap: Map<ConfigType, FunctionData[]> = this.removeConfigWith(oldConfigMap, ignoreConfigTypes);
    const newConfigs: Map<ConfigType, FunctionData[]> = new Map();
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const handler = new SuggestFunctionHandler(currentConfigMap);
    selectedItem.configPanels.forEach((selectedConfig: DraggableConfig) => {
      const suggestFnData = handler.suggest(selectedConfig);
      newConfigs.set(selectedConfig.key, suggestFnData);
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

class SuggestFunctionHandler {
  protected currentConfigMap: Map<ConfigType, FunctionData[]>;
  constructor(configMap: Map<ConfigType, FunctionData[]>) {
    this.currentConfigMap = configMap;
  }

  /**
   * suggest function data for selected config.
   */
  public suggest(selectedConfig: DraggableConfig): FunctionData[] {
    if (this.currentConfigMap.has(selectedConfig.key)) {
      return this.handleSuggestByConfigType(selectedConfig);
    } else {
      return this.handleSuggestByPreferTypes(selectedConfig);
    }
  }

  private handleSuggestByConfigType(selectedConfig: DraggableConfig): FunctionData[] {
    const currentFnList: FunctionData[] = this.currentConfigMap.get(selectedConfig.key) ?? [];
    const suggestFnList = this.pickFunctionDataAsList(currentFnList, selectedConfig.preferFunctionTypes, selectedConfig.maxItem);
    if (ListUtils.isEmpty(suggestFnList)) {
      return this.handleSuggestByPreferTypes(selectedConfig);
    } else {
      this.removeSuggestedFnList(selectedConfig.key, suggestFnList);
      return suggestFnList;
    }
  }

  private removeSuggestedFnList(configType: ConfigType, suggestFnList: FunctionData[]): void {
    const currentFnList = this.currentConfigMap.get(configType) ?? [];
    const newFnList = this.removeFunctionFn(currentFnList, suggestFnList);
    if (ListUtils.isEmpty(newFnList)) {
      this.currentConfigMap.delete(configType);
    } else {
      this.currentConfigMap.set(configType, newFnList);
    }
  }

  private handleSuggestByPreferTypes(selectedConfig: DraggableConfig): FunctionData[] {
    const finalSuggestions: FunctionData[] = [];
    let maxItem: number = selectedConfig.maxItem ?? Number.MAX_SAFE_INTEGER;
    for (const [configType, fnList] of this.currentConfigMap) {
      maxItem -= finalSuggestions.length;
      const suggestFnList = this.pickFunctionDataAsList(fnList, selectedConfig.preferFunctionTypes, maxItem);
      finalSuggestions.push(...suggestFnList);
      if (ListUtils.isNotEmpty(suggestFnList)) {
        this.removeSuggestedFnList(configType, suggestFnList);
      }
      if (maxItem <= 0) {
        break;
      }
    }
    return finalSuggestions;
  }

  protected removeFunctionFn(funcList: FunctionData[], removeList: FunctionData[]): FunctionData[] {
    const fnAsSet = new Set(funcList);
    removeList.forEach(fnRemove => {
      fnAsSet.delete(fnRemove);
    });
    return Array.from(fnAsSet.values());
  }

  protected pickFunctionDataAsList(fnList: FunctionData[], preferFunctionTypes: string[], maxItem: number | undefined): FunctionData[] {
    const suggestFnList: FunctionData[] = [];
    const preferFunctionTypesAsSet = new Set(preferFunctionTypes);
    fnList.forEach(fnData => {
      if (this.canSuggest(preferFunctionTypesAsSet, fnData, suggestFnList.length, maxItem)) {
        suggestFnList.push(fnData);
      }
    });
    return suggestFnList;
  }

  protected canSuggest(preferFnTypesAsSet: Set<string>, fnData: FunctionData, currentNumItem: number, maxItem: number | undefined): boolean {
    if (preferFnTypesAsSet.has(fnData.functionFamily)) {
      if (isNumber(maxItem)) {
        return currentNumItem < maxItem;
      } else {
        return true;
      }
    } else {
      return false;
    }
  }
}
