/*
 * @author: tvc12 - Thien Vi
 * @created: 6/23/21, 1:46 PM
 */

import { AbstractTableResponse } from '@core/common/domain/response/query/AbstractTableResponse';
import { AbstractTableQuerySetting, TableChartOption } from '@core/common/domain/model';
import { CustomBodyCellData, CustomStyleData } from '@chart/custom-table/TableData';
import { TableBodyStyleRender } from '@chart/table/style-render/TableBodyStyleRender';
import { ObjectUtils } from '@core/utils';
import { BodyStyleFormatter } from '@chart/table/pivot-table/style/body/BodyStyleFormatter';
import { BodyData } from '@chart/table/pivot-table/style/body/BodyData';
import { TableFieldStyleFormatter } from '@chart/table/default-table/style/body/TableFieldStyleFormatter';
import { BackgroundColorScaleFormatter } from '@chart/table/default-table/style/body/BackgroundColorScaleFormatter';
import { ColorScaleFormatter } from '@chart/table/default-table/style/body/ColorScaleFormatter';
import { BackgroundColorRuleFormatter } from '@chart/table/default-table/style/body/BackgroundColorRuleFormatter';
import { ColorRuleFormatter } from '@chart/table/default-table/style/body/ColorRuleFormatter';
import { BackgroundFieldValueFormatter } from '@chart/table/default-table/style/body/BackgroundFieldValueFormatter';
import { ColorFieldValueFormatter } from '@chart/table/default-table/style/body/ColorFieldValueFormatter';
import { DataBarFormatter } from '@chart/table/default-table/style/body/DataBarFormatter';
import { IconRuleFormatter } from '@chart/table/default-table/style/body/IconRuleFormatter';
import { IconFieldValueFormatter } from '@chart/table/default-table/style/body/IconFieldValueFormatter';

export class DefaultTableBodyStyleRender2 implements TableBodyStyleRender {
  private static DEFAULT_STYLE: any = { css: {} };
  private tableResponse: AbstractTableResponse;
  private querySetting: AbstractTableQuerySetting;
  private vizSetting: TableChartOption;
  private styleFormatters: BodyStyleFormatter<AbstractTableQuerySetting, AbstractTableResponse, TableChartOption>[];
  private baseThemeColor: string;

  constructor(tableResponse: AbstractTableResponse, query: AbstractTableQuerySetting, baseThemeColor: string) {
    this.tableResponse = tableResponse;
    this.querySetting = query;
    this.vizSetting = query.getChartOption()!;
    this.styleFormatters = DefaultTableBodyStyleRender2.getStyleFormatters();
    this.baseThemeColor = baseThemeColor;
  }

  private static getStyleFormatters() {
    // TODO: enhancement here, return formatter will use for render
    return [
      new TableFieldStyleFormatter(),
      new BackgroundColorScaleFormatter(),
      new ColorScaleFormatter(),
      new BackgroundColorRuleFormatter(),
      new ColorRuleFormatter(),
      new BackgroundFieldValueFormatter(),
      new ColorFieldValueFormatter(),
      new DataBarFormatter(),
      new IconRuleFormatter(),
      new IconFieldValueFormatter()
    ];
  }

  createStyle(bodyCellData: CustomBodyCellData): CustomStyleData {
    const bodyData: BodyData<AbstractTableQuerySetting, AbstractTableResponse, TableChartOption> = {
      tableResponse: this.tableResponse,
      querySetting: this.querySetting,
      bodyCellData: bodyCellData,
      baseThemeColor: this.baseThemeColor,
      vizSetting: this.vizSetting
    };
    const styles: CustomStyleData[] = this.styleFormatters.map(formatter => formatter.createStyle(bodyData));

    return ObjectUtils.mergeStyles(styles);
  }
}
