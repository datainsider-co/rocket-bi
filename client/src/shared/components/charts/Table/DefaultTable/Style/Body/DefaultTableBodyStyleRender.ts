/*
 * @author: tvc12 - Thien Vi
 * @created: 6/9/21, 1:30 PM
 */

import { AbstractTableResponse, MinMaxData } from '@core/domain/Response/Query/AbstractTableResponse';
import { AbstractTableQuerySetting, TableChartOption } from '@core/domain/Model';
import { CustomBodyCellData, CustomStyleData } from '@chart/CustomTable/TableData';
import { RowDataUtils } from '@/shared/models';
import { ColorUtils } from '@/utils/ColorUtils';
import { TableBodyStyleRender } from '@chart/Table/StyleRender/TableBodyStyleRender';
import { ChartUtils } from '@/utils';
import { StringUtils } from '@/utils/string.utils';
import { ObjectUtils } from '@core/utils/ObjectUtils';
import { TablePanelUtils } from '@/utils/TablePanelUtils';
import { ColorConfig } from '@core/domain/Model/ChartOption/ExtraSetting/ColorConfig';

/**
 * @deprecated from v1.0.4
 */
export class DefaultTableBodyStyleRender implements TableBodyStyleRender {
  private static DEFAULT_STYLE: any = {
    css: {}
  };
  private tableResponse: AbstractTableResponse;
  private querySetting: AbstractTableQuerySetting;
  private vizSetting: TableChartOption;

  constructor(tableResponse: AbstractTableResponse, query: AbstractTableQuerySetting) {
    this.tableResponse = tableResponse;
    this.querySetting = query;
    this.vizSetting = query.getChartOption()!;
  }

  private static calculateBackgroundColor(bodyCellData: CustomBodyCellData, minMaxData: MinMaxData, colorConfig: ColorConfig): string {
    const value: number = RowDataUtils.getDataAsNumber(bodyCellData.rowData, bodyCellData.header);
    if (isNaN(value)) {
      return colorConfig.noneColor;
    } else {
      const ratio = ChartUtils.calculateRatio(value, minMaxData);
      return ColorUtils.getColorFromMinMax(ratio, colorConfig.minColor, colorConfig.maxColor);
    }
  }

  createStyle(bodyCellData: CustomBodyCellData): CustomStyleData {
    const enableCustomStyle = this.canCustomStyle(bodyCellData, this.tableResponse, this.querySetting, this.vizSetting);
    if (enableCustomStyle) {
      return this.getCustomStyle(bodyCellData, this.tableResponse, this.querySetting, this.vizSetting);
    } else {
      return DefaultTableBodyStyleRender.DEFAULT_STYLE;
    }
  }

  private getColorConfigOf(bodyCellData: CustomBodyCellData, tableResponse: AbstractTableResponse, vizSetting: TableChartOption): ColorConfig | undefined {
    const colorDataIndex: number = this.getColorDataIndex(bodyCellData, tableResponse);
    return vizSetting.getColorData(colorDataIndex);
  }

  private canCustomStyle(
    bodyCellData: CustomBodyCellData,
    tableResponse: AbstractTableResponse,
    querySetting: AbstractTableQuerySetting,
    vizSetting: TableChartOption
  ): boolean {
    const colorConfig: ColorConfig | undefined = this.getColorConfigOf(bodyCellData, tableResponse, vizSetting);
    return !bodyCellData.header.isGroupBy && !!colorConfig;
  }

  private getCustomStyle(
    bodyCellData: CustomBodyCellData,
    tableResponse: AbstractTableResponse,
    querySetting: AbstractTableQuerySetting,
    vizSetting: TableChartOption
  ): CustomStyleData {
    const colorConfiguration: ColorConfig = this.getColorConfigOf(bodyCellData, tableResponse, vizSetting)!;
    const minMaxData: MinMaxData = this.getMinMaxData(bodyCellData, tableResponse);
    const backgroundColor: string = DefaultTableBodyStyleRender.calculateBackgroundColor(bodyCellData, minMaxData, colorConfiguration);
    const cssStyle = {
      background: backgroundColor
    } as CSSStyleDeclaration;
    TablePanelUtils.bindTextStyle(cssStyle, colorConfiguration);

    return {
      css: ObjectUtils.removeKeyIfValueNotExist(cssStyle)
    };
  }

  private getColorDataIndex(bodyCellData: CustomBodyCellData, tableResponse: AbstractTableResponse): number {
    const headerName: string = bodyCellData.header.label;
    return tableResponse.minMaxValues.findIndex(minMaxData => StringUtils.isIncludes(minMaxData.valueName, headerName));
  }

  private getMinMaxData(bodyCellData: CustomBodyCellData, tableResponse: AbstractTableResponse): MinMaxData {
    const headerName: string = bodyCellData.header.label;
    return tableResponse.minMaxValues.find(minMaxData => StringUtils.isIncludes(minMaxData.valueName, headerName))!;
  }
}
