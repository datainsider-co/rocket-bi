/*
 * @author: tvc12 - Thien Vi
 * @created: 6/23/21, 1:46 PM
 */

import { AbstractTableResponse } from '@core/domain/Response/Query/AbstractTableResponse';
import { AbstractTableQuerySetting, TableChartOption } from '@core/domain/Model';
import { CustomBodyCellData, CustomStyleData } from '@chart/CustomTable/TableData';
import { TableBodyStyleRender } from '@chart/Table/StyleRender/TableBodyStyleRender';
import { ObjectUtils } from '@core/utils';
import { BodyStyleFormatter } from '@chart/Table/PivotTable/Style/Body/BodyStyleFormatter';
import { BodyData } from '@chart/Table/PivotTable/Style/Body/BodyData';
import { TableFieldStyleFormatter } from '@chart/Table/DefaultTable/Style/Body/TableFieldStyleFormatter';
import { BackgroundColorScaleFormatter } from '@chart/Table/DefaultTable/Style/Body/BackgroundColorScaleFormatter';
import { ColorScaleFormatter } from '@chart/Table/DefaultTable/Style/Body/ColorScaleFormatter';
import { BackgroundColorRuleFormatter } from '@chart/Table/DefaultTable/Style/Body/BackgroundColorRuleFormatter';
import { ColorRuleFormatter } from '@chart/Table/DefaultTable/Style/Body/ColorRuleFormatter';
import { BackgroundFieldValueFormatter } from '@chart/Table/DefaultTable/Style/Body/BackgroundFieldValueFormatter';
import { ColorFieldValueFormatter } from '@chart/Table/DefaultTable/Style/Body/ColorFieldValueFormatter';
import { DataBarFormatter } from '@chart/Table/DefaultTable/Style/Body/DataBarFormatter';
import { IconRuleFormatter } from '@chart/Table/DefaultTable/Style/Body/IconRuleFormatter';
import { IconFieldValueFormatter } from '@chart/Table/DefaultTable/Style/Body/IconFieldValueFormatter';

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
