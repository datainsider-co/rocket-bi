/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 9:56 PM
 */

import {
  ChartControl,
  ChartControlData,
  ChartOption,
  ChartOptionData,
  FilterableSetting,
  FunctionController,
  Position,
  TableColumn,
  ValueController,
  WidgetCommonData,
  WidgetExtraData,
  WidgetId,
  Widgets
} from '@core/common/domain/model';
import { QueryRelatedWidget } from './QueryRelatedWidget';
import { QuerySetting } from '@core/common/domain/model/query/QuerySetting';
import { cloneDeep } from 'lodash';
import { RandomUtils } from '@/utils';
import { ChartType } from '@/shared';

export enum ChartInfoType {
  /**
   * It's a chart, visualization data from query.
   * Can be a chart control, user can interact with it to control other chart.
   */
  Normal = 'Normal',
  /**
   * It's a filter, user can interact with it to filter data in other chart.
   */
  Filter = 'Filter',
  /**
   * It's a chart control, use for change function of other chart.
   */
  FunctionController = 'FunctionController'
}

export class ChartInfo implements QueryRelatedWidget, ChartControl {
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

  get hasInnerFilter(): boolean {
    return !!this.chartFilter;
  }

  getControlId(): WidgetId {
    return this.id;
  }

  getChartControlData(): ChartControlData {
    const name: string = this.setting.getChartOption()?.getTitle() ?? this.name;
    const chartInfoType: ChartInfoType = this.getChartInfoType();
    switch (chartInfoType) {
      case ChartInfoType.FunctionController: {
        const tableColumns: TableColumn[] = this.setting.getAllTableColumns().map(column => column.copyWith({ dynamicFunctionId: this.id }));
        const defaultTableColumns = FunctionController.isFunctionController(this.setting)
          ? this.setting.getDefaultTableColumns().map(tblColumn => tblColumn.copyWith({ dynamicFunctionId: this.id }))
          : [];
        return {
          id: this.id,
          displayName: name,
          tableColumns: tableColumns,
          defaultTableColumns: defaultTableColumns,
          chartType: this.extraData?.currentChartType as ChartType,
          chartInfoType: chartInfoType
        };
      }
      default: {
        return {
          id: this.id,
          displayName: name,
          tableColumns: [],
          defaultTableColumns: [],
          chartType: this.extraData?.currentChartType as ChartType,
          chartInfoType: chartInfoType
        };
      }
    }
  }

  getChartInfoType(): ChartInfoType {
    if (FunctionController.isFunctionController(this.setting) && this.setting.isEnableFunctionControl()) {
      return ChartInfoType.FunctionController;
    }
    if (FilterableSetting.isFilterable(this.setting) && this.setting.isEnableFilter()) {
      return ChartInfoType.Filter;
    }
    return ChartInfoType.Normal;
  }

  getDefaultPosition(): Position {
    const [width, height] = this.setting.getDefaultSize();
    return new Position(-1, -1, width, height, 1);
  }

  getValueController(): ValueController | undefined {
    const chartOption: ChartOption<any> | undefined = this.setting.getChartOption();
    if (chartOption && ValueController.isValueController(chartOption)) {
      return chartOption;
    } else {
      return void 0;
    }
  }

  isEnableControl(): boolean {
    switch (this.getChartInfoType()) {
      case ChartInfoType.FunctionController:
        return true;
      default: {
        const controller: ValueController | undefined = this.getValueController();
        return !!controller && controller.isEnableControl();
      }
    }
  }

  getBackgroundColorOpacity(): number {
    return 100;
  }

  getBackgroundColor(): string | undefined {
    return this.setting.getChartOption()?.getBackgroundColor();
  }

  getOverridePadding(): string | undefined {
    return this.setting.getChartOption()?.getOverridePadding();
  }

  setDescription(description: string): void {
    this.description = description;
  }
}
