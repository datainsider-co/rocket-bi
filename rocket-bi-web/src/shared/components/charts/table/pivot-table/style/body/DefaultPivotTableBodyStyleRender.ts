/*
 * @author: tvc12 - Thien Vi
 * @created: 6/9/21, 4:16 PM
 */

import { AbstractTableResponse, MinMaxData } from '@core/common/domain/response/query/AbstractTableResponse';
import { PivotTableQuerySetting, PivotTableChartOption } from '@core/common/domain/model';
import { CustomBodyCellData, CustomStyleData } from '@chart/custom-table/TableData';
import { RowDataUtils } from '@/shared/models';
import { ColorUtils } from '@/utils/ColorUtils';
import { ChartUtils, ListUtils } from '@/utils';
import { TableBodyStyleRender } from '@chart/table/style-render/TableBodyStyleRender';
import { ObjectUtils } from '@core/utils/ObjectUtils';
import { TablePanelUtils } from '@/utils/TablePanelUtils';
import { ColorConfig } from '@core/common/domain/model/chart-option/extra-setting/ColorConfig';

/**
 * @deprecated from v1.0.4
 */
export class DefaultPivotTableBodyStyleRender implements TableBodyStyleRender {
  private static DEFAULT_STYLE: any = { css: {} };
  private tableResponse: AbstractTableResponse;
  private querySetting: PivotTableQuerySetting;
  private vizSetting: PivotTableChartOption;

  constructor(tableResponse: AbstractTableResponse, query: PivotTableQuerySetting) {
    this.tableResponse = tableResponse;
    this.querySetting = query;
    this.vizSetting = query.getChartOption<PivotTableChartOption>()!;
  }

  private static calculateBackgroundColor(bodyCellData: CustomBodyCellData, minMaxData: MinMaxData, colorConfiguration: ColorConfig): string {
    const value: number = RowDataUtils.getDataAsNumber(bodyCellData.rowData, bodyCellData.header);
    if (isNaN(value)) {
      return colorConfiguration.noneColor;
    } else {
      const ratio = ChartUtils.calculateRatio(value, minMaxData);
      return ColorUtils.getColorFromMinMax(ratio, colorConfiguration.minColor, colorConfiguration.maxColor);
    }
  }

  createStyle(bodyCellData: CustomBodyCellData): CustomStyleData {
    const enableCustomStyle = this.canCustomStyle(bodyCellData, this.tableResponse, this.querySetting, this.vizSetting);
    if (enableCustomStyle) {
      return this.getCustomStyle(bodyCellData, this.tableResponse, this.querySetting, this.vizSetting);
    } else {
      return DefaultPivotTableBodyStyleRender.DEFAULT_STYLE;
    }
  }

  private getColorConfigOf(
    bodyCellData: CustomBodyCellData,
    tableResponse: AbstractTableResponse,
    querySetting: PivotTableQuerySetting,
    vizSetting: PivotTableChartOption
  ): ColorConfig | undefined {
    const colorDataIndex = this.getColorDataIndex(bodyCellData, tableResponse, querySetting);
    return vizSetting.getColorConfig(colorDataIndex);
  }

  private canCustomStyle(
    bodyCellData: CustomBodyCellData,
    tableResponse: AbstractTableResponse,
    querySetting: PivotTableQuerySetting,
    vizSetting: PivotTableChartOption
  ): boolean {
    const colorConfig: ColorConfig | undefined = this.getColorConfigOf(bodyCellData, tableResponse, querySetting, vizSetting);
    return !bodyCellData.header.isGroupBy && !!colorConfig;
  }

  private getCustomStyle(
    bodyCellData: CustomBodyCellData,
    tableResponse: AbstractTableResponse,
    querySetting: PivotTableQuerySetting,
    vizSetting: PivotTableChartOption
  ): CustomStyleData {
    const cssStyle = {} as CSSStyleDeclaration;
    const colorConfig: ColorConfig = this.getColorConfigOf(bodyCellData, tableResponse, querySetting, vizSetting)!;
    const minMaxData: MinMaxData = this.getMinMaxData(bodyCellData, tableResponse, querySetting);
    cssStyle.backgroundColor = DefaultPivotTableBodyStyleRender.calculateBackgroundColor(bodyCellData, minMaxData, colorConfig);
    TablePanelUtils.bindTextStyle(cssStyle, colorConfig);

    return {
      css: ObjectUtils.removeKeyIfValueNotExist(cssStyle)
    };
  }

  private getColorDataIndex(bodyCellData: CustomBodyCellData, tableResponse: AbstractTableResponse, querySetting: PivotTableQuerySetting): number {
    if (ListUtils.hasOnlyOneItem(querySetting.values)) {
      return 0;
    } else {
      const headerName: string = bodyCellData.header.label;
      return tableResponse.minMaxValues.findIndex(minMaxData => minMaxData.valueName == headerName);
    }
  }

  private getMinMaxData(bodyCellData: CustomBodyCellData, tableResponse: AbstractTableResponse, querySetting: PivotTableQuerySetting): MinMaxData {
    if (ListUtils.hasOnlyOneItem(querySetting.values)) {
      return ListUtils.getHead(tableResponse.minMaxValues)!;
    } else {
      return tableResponse.getMinMaxValueAsMap().get(bodyCellData.header.label)!;
    }
  }
}
