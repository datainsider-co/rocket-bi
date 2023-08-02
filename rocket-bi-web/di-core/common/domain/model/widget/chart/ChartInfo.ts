/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:56 PM
 */

import {
  ChartOption,
  ChartOptionData,
  DynamicValues,
  Filterable,
  FunctionControl,
  Position,
  TabControl,
  TabControlData,
  WidgetCommonData,
  WidgetExtraData,
  WidgetId,
  Widgets
} from '@core/common/domain/model';
import { QueryRelatedWidget } from './QueryRelatedWidget';
import { QuerySetting } from '@core/common/domain/model/query/QuerySetting';
import { cloneDeep } from 'lodash';
import { FilterUtils, RandomUtils } from '@/utils';
import { Log } from '@core/utils';

export enum ChartInfoType {
  normal = 'normal',
  filter = 'filter',
  dynamicFunction = 'DynamicFunction',
  dynamicValues = 'dynamicValues'
}

export class ChartInfo implements QueryRelatedWidget, TabControl {
  readonly className = Widgets.Chart;
  setting: QuerySetting;

  id: WidgetId;
  name: string;
  description: string;
  backgroundColor?: string;
  extraData?: WidgetExtraData;
  textColor?: string;
  chartFilter?: ChartInfo;

  constructor(commonSetting: WidgetCommonData, setting: QuerySetting, innerFilter?: ChartInfo) {
    this.id = commonSetting.id;
    this.name = commonSetting.name;
    this.description = commonSetting.description;
    this.backgroundColor = commonSetting.backgroundColor;
    this.extraData = commonSetting.extraData;
    this.textColor = commonSetting.textColor;
    this.setting = setting;
    this.chartFilter = innerFilter;
  }

  static fromObject(data: ChartInfo): ChartInfo {
    const querySetting = QuerySetting.fromObject(data.setting) as QuerySetting;
    const chartFilter = data.chartFilter ? ChartInfo.fromObject(data.chartFilter) : void 0;
    return new ChartInfo(data, querySetting, chartFilter);
  }

  static isChartInfo(obj: any): obj is ChartInfo {
    return obj.className === Widgets.Chart;
  }

  static fromQuerySetting(querySetting: QuerySetting) {
    return new ChartInfo({ id: -RandomUtils.nextInt(1, 10000), name: '', description: '' }, querySetting);
  }

  setTitle(title: string): void {
    this.name = title;
    this.updateTitleInSetting(title);
  }

  copyWithId(newId: number) {
    const chartInfo = cloneDeep(this);
    chartInfo.id = newId;
    return chartInfo;
  }

  private updateTitleInSetting(title: string): void {
    const vizSetting: ChartOption<ChartOptionData> | undefined = this.setting.getChartOption();
    if (vizSetting) {
      vizSetting.setTitle(title);
    }
  }

  static from(querySetting: QuerySetting, extraData?: WidgetExtraData) {
    return new ChartInfo({ id: -1, name: '', description: '', extraData: extraData }, querySetting);
  }

  get containChartFilter(): boolean {
    return !!this.chartFilter;
  }

  isControl(): boolean {
    if (FunctionControl.isFunctionControl(this.setting)) {
      Log.debug('isControl', this.id, this.setting.enableFunctionControl());
      return this.setting.enableFunctionControl();
    }
    if (DynamicValues.isValuesControl(this.setting)) {
      return this.setting.enableDynamicValues();
    }
    return false;
  }

  toTabControlData(): TabControlData {
    const name = this.setting.getChartOption()?.getTitle() ?? this.name ?? '';
    const allTableColumns = this.setting.getAllTableColumn().map(tblColumn => tblColumn.copyWith({ dynamicFunctionId: this.id }));
    const defaultTableColumns = FunctionControl.isFunctionControl(this.setting)
      ? this.setting.getDefaultFunctions().map(tblColumn => tblColumn.copyWith({ dynamicFunctionId: this.id }))
      : [];
    const values = DynamicValues.isValuesControl(this.setting) ? this.setting.getDefaultValues() : [];
    return {
      id: this.id,
      displayName: name,
      tableColumns: allTableColumns,
      defaultTableColumns: defaultTableColumns,
      values: values,
      chartType: this.extraData?.currentChartType ?? ''
    };
  }

  getChartInfoType(): ChartInfoType {
    if (FunctionControl.isFunctionControl(this.setting) && this.setting.enableFunctionControl()) {
      return ChartInfoType.dynamicFunction;
    }
    if (DynamicValues.isValuesControl(this.setting) && this.setting.enableDynamicValues()) {
      return ChartInfoType.dynamicValues;
    }
    if (Filterable.isFilterable(this.setting) && this.setting.isEnableFilter()) {
      return ChartInfoType.filter;
    }
    return ChartInfoType.normal;
  }

  getDefaultPosition(): Position {
    const [width, height] = this.setting.getDefaultSize();
    return new Position(-1, -1, width, height, 1);
  }
}
