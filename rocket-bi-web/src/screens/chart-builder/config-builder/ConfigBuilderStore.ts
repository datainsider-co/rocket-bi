/*
 * @author: tvc12 - Thien Vi
 * @created: 11/27/20, 2:23 PM
 */

import { ChartType, ConditionData, ConfigType, DataBuilderConstantsV35, DefaultFilterValue, FunctionData, Stores, VisualizationItemData } from '@/shared';
import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import store from '@/store';
import { ChartInfo, ChartOption, Field, Id, InlineSqlView, QuerySetting, SqlQuery, ViewField, Widget, WidgetExtraData } from '@core/common/domain/model';
import { cloneDeep, isNumber } from 'lodash';
import { ChartConfigUtils, ListUtils } from '@/utils';
import { Container, Inject } from 'typescript-ioc';
import { ConditionDataUtils, FunctionDataUtils, Log } from '@core/utils';
import { QuerySettingResolver } from '@/shared/resolver/query-setting-resolver/QuerySettingResolver';
import { DIException } from '@core/common/domain';
import { Modals } from '@/utils/Modals';
import { FunctionConvertorData } from '@/screens/chart-builder/config-builder/function-convertor/FunctionConvertor';
import { FunctionConvertResolver } from '@/screens/chart-builder/config-builder/function-convertor/FunctionConvertResolver';
import { ChartOptionResolver } from '@/screens/chart-builder/config-builder/chart-option-resolver/ChartOptionResolver';
import { _BuilderTableSchemaStore } from '@/store/modules/data-builder/BuilderTableSchemaStore';

/* eslint @typescript-eslint/no-use-before-define: 0 */

export interface ConfigRequest {
  configType: ConfigType;
  data: FunctionData;
}

export interface ChangeIndexConfig {
  configType: ConfigType;
  configs: FunctionData[];
}

export interface RemoveConfigRequest {
  configType: ConfigType;
  id: Id;
}

export interface AddConfigRequest extends ConfigRequest {
  index?: number;
}

export interface AddFilterRequest {
  data: ConditionData;
  index?: number;
}

interface ConfigBuilderState {
  configsAsMap: Map<ConfigType, FunctionData[]>;
  itemSelected: VisualizationItemData;
  chartOption: Record<string, any>;
}

@Module({ store: store, name: Stores.ConfigBuilderStore, dynamic: true, namespaced: true })
class ConfigBuilderStore extends VuexModule {
  configsAsMap: Map<ConfigType, FunctionData[]> = new Map<ConfigType, FunctionData[]>();
  filterAsMap: Map<Id, ConditionData[]> = new Map<Id, ConditionData[]>();
  itemSelected: VisualizationItemData = DataBuilderConstantsV35.ALL_CHARTS[0];
  chartOption: Record<string, any> = {};
  lastedState: ConfigBuilderState | null = null;
  // sử dụng để lưu tạm giá trị của filter khi select
  tempFilterValue: DefaultFilterValue | null = null;
  private allowBack = false;

  @Inject
  private readonly querySettingResolver!: QuerySettingResolver;

  get chartType(): ChartType {
    return this.itemSelected.type as ChartType;
  }

  get getQuerySetting(): () => QuerySetting {
    return () => {
      const setting = this.querySettingResolver.toQuerySetting(this.chartType, this.configsAsMap, this.filterAsMap);
      const chartOption = cloneDeep(this.chartOption) as any;
      setting.setChartOption(chartOption);
      const listSqlViews = ConfigBuilderStore.getSqlViews(this.configsAsMap, this.filterAsMap);
      // Server support only one sql view in this time.
      setting.sqlViews = listSqlViews;
      return setting;
    };
  }

  /**
   * Get sql views from configs dag and drop
   */
  static getSqlViews(configAsMap: Map<ConfigType, FunctionData[]>, filterAsMap: Map<number, ConditionData[]>): InlineSqlView[] {
    const listConfigField: ViewField[] = Array.from(configAsMap.values())
      .flat()
      .map((func: FunctionData) => func.field)
      .filter((field): field is ViewField => field instanceof ViewField);
    const listConditionField: ViewField[] = Array.from(filterAsMap.values())
      .flat()
      .map((func: ConditionData) => func.field)
      .filter((field): field is ViewField => field instanceof ViewField);
    const viewNameAsSet: Set<string> = new Set(listConfigField.concat(listConditionField).map(field => field.viewName));
    const listUniqueViewName: string[] = Array.from(viewNameAsSet);
    Log.debug('listUniqueViewName::', listUniqueViewName);

    return listUniqueViewName
      .map((viewName: string) => {
        const query: string | undefined = _BuilderTableSchemaStore.getSqlQuery(viewName);
        return query ? new InlineSqlView(viewName, new SqlQuery(query)) : void 0;
      })
      .filter((query): query is InlineSqlView => !!query);
  }

  get canBuildQuerySetting(): () => boolean {
    return () => {
      return this.querySettingResolver.canBuildQuerySetting(this.chartType, this.configsAsMap, this.filterAsMap);
    };
  }

  private get chartOptionHandler(): ChartOptionResolver {
    return new ChartOptionResolver();
  }

  private static getFunctionConvertResolver(): FunctionConvertResolver {
    return Container.get(FunctionConvertResolver);
  }

  @Mutation
  initDefaultState() {
    this.allowBack = false;
    this.configsAsMap.clear();
    this.filterAsMap.clear();
    this.lastedState = null;
  }

  @Mutation
  setAllowBack(value: boolean) {
    this.allowBack = value;
  }

  @Action
  async initState(chart: Widget): Promise<void> {
    this.initDefaultState();
    if (ChartInfo.isChartInfo(chart) && chart.extraData) {
      this.setCurrentChartSelected(chart.extraData.currentChartType ?? '');
      this.setConfigs(chart.extraData);
      this.setFilters(chart.extraData);
      this.saveChartOption(chart.setting.options);
      this.saveLastedState();
    } else {
      Log.debug(`${chart.className} Unsorted visualization`);
      throw new DIException(`${chart.className} Unsorted visualization`);
    }
  }

  @Mutation
  saveChartOption(chartOption: Record<string, any>) {
    this.chartOption = chartOption;
  }

  // Config
  @Mutation
  addConfig(payload: AddConfigRequest) {
    const { data, configType, index } = payload;
    const configs: FunctionData[] | undefined = this.configsAsMap.get(configType);
    if (configs) {
      if (isNumber(index)) {
        // insert
        configs.splice(index, 0, data);
      } else {
        configs.push(data);
      }
    } else {
      this.configsAsMap.set(configType, [data]);
    }
    _ConfigBuilderStore.saveLastedState();
  }

  @Mutation
  updateConfig(payload: ConfigRequest) {
    const { data, configType } = payload;
    const configs: FunctionData[] | undefined = this.configsAsMap.get(configType);
    if (configs) {
      const index: number = configs.findIndex(config => config.id === data.id);
      if (index === -1) {
        return;
      }
      const oldFunction: FunctionData = configs[index];
      configs[index] = data;
      _ConfigBuilderStore.convertToCompatibleFunction({
        currentFunction: data,
        configType: configType,
        oldFunction: oldFunction
      });
    }
    _ConfigBuilderStore.saveLastedState();
  }

  @Mutation
  removeConfig(payload: RemoveConfigRequest) {
    const { id, configType } = payload;
    const configs: FunctionData[] | undefined = this.configsAsMap.get(configType);
    const removedConfig = configs?.find(item => item.id === id);
    if (configs && removedConfig) {
      const newConfigs = ListUtils.remove(configs, item => item.id === id);
      this.configsAsMap.set(configType, newConfigs);
      _ConfigBuilderStore.onFunctionRemoved({
        configType: configType,
        removedConfig: removedConfig
      });
    }
    _ConfigBuilderStore.saveLastedState();
  }

  @Mutation
  removeFunctionAt(payload: { configType: ConfigType; index: number }): void {
    const { index, configType } = payload;
    const clonedConfigAsMap = cloneDeep(this.configsAsMap);
    const configs: FunctionData[] | undefined = clonedConfigAsMap.get(configType);
    if (configs && configs[index]) {
      const removedConfig: FunctionData = configs[index];
      configs.splice(index, 1);
      clonedConfigAsMap.set(configType, configs);
      this.configsAsMap = clonedConfigAsMap;
      _ConfigBuilderStore.onFunctionRemoved({
        configType: configType,
        removedConfig: removedConfig
      });
    }
    _ConfigBuilderStore.saveLastedState();
  }

  @Mutation
  changeIndex(payload: ChangeIndexConfig) {
    const { configs, configType } = payload;
    this.configsAsMap.set(configType, configs);
    _ConfigBuilderStore.saveLastedState();
  }

  @Mutation
  setConfigs(extraData: WidgetExtraData) {
    this.configsAsMap = FunctionDataUtils.toConfigAsMap(extraData?.configs ?? ({} as any));
  }

  // Filter
  @Mutation
  addFilter(payload: AddFilterRequest) {
    const { data, index } = payload;
    const groupId: Id = data.groupId;
    const group = this.filterAsMap.get(groupId);
    if (group) {
      if (isNumber(index)) {
        group.splice(index, 0, data);
      } else {
        group.push(data);
      }
    } else {
      this.filterAsMap.set(groupId, [data]);
    }
  }

  @Mutation
  updateFilter(data: ConditionData) {
    const group = this.filterAsMap.get(data.groupId);
    if (group) {
      const currentData: ConditionData | undefined = group.find(item => item.id === data.id);
      if (currentData) {
        Object.assign(currentData, data);
      } else {
        group.push(data);
      }
    } else {
      this.filterAsMap.set(data.groupId, [data]);
    }
  }

  @Mutation
  removeFilter(payload: { id: Id; groupId: Id }) {
    const { id, groupId } = payload;
    const group = this.filterAsMap.get(groupId);
    if (group) {
      const newGroup = ListUtils.remove(group, item => item.id === id);
      if (ListUtils.isEmpty(newGroup)) {
        this.filterAsMap.delete(groupId);
      } else {
        this.filterAsMap.set(groupId, newGroup);
      }
    }
  }

  @Mutation
  setItemSelected(newItemSelected: VisualizationItemData) {
    _ConfigBuilderStore.changeConfig(newItemSelected);
    this.itemSelected = newItemSelected;
  }

  @Action
  async confirmBack(): Promise<boolean> {
    return new Promise(resolve => {
      if (this.allowBack) {
        return resolve(true);
      } else {
        Modals.showConfirmationModal('This will end your progress, are you sure you want to go back?', {
          onOk: () => resolve(true),
          onCancel: () => resolve(false)
        });
      }
    });
  }

  @Mutation
  private saveLastedState() {
    this.lastedState = {
      itemSelected: this.itemSelected,
      configsAsMap: cloneDeep(this.configsAsMap),
      chartOption: cloneDeep(this.chartOption)
    };
  }

  @Mutation
  setCurrentChartSelected(currentChartType: string) {
    const itemSelected = [
      ...DataBuilderConstantsV35.ALL_CHARTS,
      ...DataBuilderConstantsV35.ALL_FILTERS,
      ...DataBuilderConstantsV35.ALL_INNER_FILTERS,
      ...DataBuilderConstantsV35.MULTIPLE_MEASURES
    ].find(chart => chart.type == currentChartType);
    if (itemSelected) {
      this.itemSelected = itemSelected;
    }
  }

  @Mutation
  changeConfig(newItemSelected: VisualizationItemData) {
    if (this.lastedState && this.lastedState.itemSelected.type === newItemSelected.type) {
      this.configsAsMap = this.lastedState.configsAsMap;
      this.chartOption = this.lastedState.chartOption;
    } else if (this.lastedState && this.lastedState.itemSelected.type !== newItemSelected.type) {
      this.configsAsMap = ChartConfigUtils.cloneToNewConfig(newItemSelected, this.lastedState.configsAsMap);
      this.chartOption = ChartOption.getDefaultChartOption(newItemSelected.type as ChartType);
    } else {
      this.configsAsMap = new Map<ConfigType, FunctionData[]>();
      this.chartOption = ChartOption.getDefaultChartOption(newItemSelected.type as ChartType);
    }
  }

  @Mutation
  setFilters(extraData: WidgetExtraData) {
    this.filterAsMap = ConditionDataUtils.toFilters(extraData.filters ?? {});
    Log.debug('ConfigBuilderStore::', this.filterAsMap);
  }

  @Mutation
  setTempFilterValue(value: DefaultFilterValue | null) {
    this.tempFilterValue = value;
  }

  @Mutation
  private convertToCompatibleFunction(payload: { configType: ConfigType; currentFunction: FunctionData; oldFunction: FunctionData | undefined }) {
    const convertResolver = ConfigBuilderStore.getFunctionConvertResolver();
    const convertData: FunctionConvertorData = {
      mapConfigs: this.configsAsMap,
      itemSelected: this.itemSelected,
      currentConfig: payload.configType,
      currentFunction: payload.currentFunction,
      oldFunction: payload.oldFunction
    };
    if (convertResolver.canConvert(convertData)) {
      this.configsAsMap = convertResolver.convert(convertData);
      _ConfigBuilderStore.onFunctionConverted({
        convertData: convertData,
        configsAsMap: this.configsAsMap
      });
    }
  }

  @Mutation
  private onFunctionConverted(payload: { convertData: FunctionConvertorData; configsAsMap: Map<ConfigType, FunctionData[]> }) {
    const newChartOption: Record<string, any> = _ConfigBuilderStore.chartOptionHandler.handleFunctionConverted(_ConfigBuilderStore.chartType, {
      ...payload,
      chartOption: this.chartOption
    });
    this.chartOption = newChartOption;
  }

  @Mutation
  private onFunctionRemoved(payload: { configType: ConfigType; removedConfig: FunctionData }) {
    const newChartOption: Record<string, any> = _ConfigBuilderStore.chartOptionHandler.handleFunctionRemoved(_ConfigBuilderStore.chartType, {
      ...payload,
      chartOption: this.chartOption
    });
    this.chartOption = newChartOption;
  }

  @Action
  public updateField(payload: { oldField: Field; newField: Field }) {
    this.updateColumnOfConfig(payload);
    this.updateColumnOfFilter(payload);
  }

  @Mutation
  private updateColumnOfConfig(payload: { oldField: Field; newField: Field }) {
    const { oldField, newField } = payload;
    const newConfigAsMap: Map<ConfigType, FunctionData[]> = cloneDeep(this.configsAsMap);
    newConfigAsMap.forEach((value: FunctionData[], key: ConfigType) => {
      value
        .filter(functionData => functionData.field && Field.isEqual(functionData.field, oldField))
        .forEach(functionData => {
          functionData.field = newField;
        });
    });
    this.configsAsMap = newConfigAsMap;
  }

  @Mutation
  private updateColumnOfFilter(payload: { oldField: Field; newField: Field }) {
    const { oldField, newField } = payload;
    const filterAsMap: Map<Id, ConditionData[]> = cloneDeep(this.filterAsMap);
    filterAsMap.forEach((value: ConditionData[], key: number) => {
      value
        .filter(functionData => Field.isEqual(functionData.field, oldField))
        .forEach(functionData => {
          functionData.field = newField;
        });
    });
    this.filterAsMap = filterAsMap;
  }
}

export const _ConfigBuilderStore: ConfigBuilderStore = getModule(ConfigBuilderStore);
