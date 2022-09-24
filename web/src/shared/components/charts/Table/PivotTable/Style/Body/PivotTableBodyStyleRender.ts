/*
 * @author: tvc12 - Thien Vi
 * @created: 6/23/21, 1:46 PM
 */

import { AbstractTableResponse } from '@core/domain/Response/Query/AbstractTableResponse';
import { PivotTableQuerySetting, PivotTableChartOption } from '@core/domain/Model';
import { CustomBodyCellData, CustomStyleData } from '@chart/CustomTable/TableData';
import { TableBodyStyleRender } from '@chart/Table/StyleRender/TableBodyStyleRender';
import { ObjectUtils } from '@core/utils';
import { BodyStyleFormatter } from '@chart/Table/PivotTable/Style/Body/BodyStyleFormatter';
import { FieldStyleFormatter } from '@chart/Table/PivotTable/Style/Body/FieldStyleFormatter';
import { BodyData } from '@chart/Table/PivotTable/Style/Body/BodyData';
import { BackgroundColorScaleFormatter } from '@chart/Table/PivotTable/Style/Body/BackgroundColorScaleFormatter';
import { ColorScaleFormatter } from '@chart/Table/PivotTable/Style/Body/ColorScaleFormatter';
import { BackgroundRuleFormatter } from '@chart/Table/PivotTable/Style/Body/BackgroundRuleFormatter';
import { ColorRuleFormatter } from '@chart/Table/PivotTable/Style/Body/ColorRuleFormatter';
import { BackgroundFieldValueFormatter } from '@chart/Table/PivotTable/Style/Body/BackgroundFieldValueFormatter';
import { ColorFieldValueFormatter } from '@chart/Table/PivotTable/Style/Body/ColorFieldValueFormatter';
import { DataBarFormatter } from '@chart/Table/PivotTable/Style/Body/DataBarFormatter';
import { IconRuleFormatter } from '@chart/Table/PivotTable/Style/Body/IconRuleFormatter';
import { IconFieldValueFormatter } from '@chart/Table/PivotTable/Style/Body/IconFieldValueFormatter';

export class PivotTableBodyStyleRender implements TableBodyStyleRender {
  private static DEFAULT_STYLE: any = { css: {} };
  private tableResponse: AbstractTableResponse;
  private querySetting: PivotTableQuerySetting;
  private vizSetting: PivotTableChartOption;
  private styleFormatters: BodyStyleFormatter<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption>[];
  private baseThemeColor: string;

  constructor(tableResponse: AbstractTableResponse, query: PivotTableQuerySetting, baseThemeColor: string) {
    this.tableResponse = tableResponse;
    this.querySetting = query;
    this.vizSetting = query.getChartOption()!;
    this.styleFormatters = PivotTableBodyStyleRender.getStyleFormatters();
    this.baseThemeColor = baseThemeColor;
  }

  private static getStyleFormatters() {
    // FIXME: enhancement here, choose correct formatter when init
    return [
      new FieldStyleFormatter(),
      new BackgroundColorScaleFormatter(),
      new ColorScaleFormatter(),
      new BackgroundRuleFormatter(),
      new ColorRuleFormatter(),
      new BackgroundFieldValueFormatter(),
      new ColorFieldValueFormatter(),
      new DataBarFormatter(),
      new IconRuleFormatter(),
      new IconFieldValueFormatter()
    ];
  }

  createStyle(bodyCellData: CustomBodyCellData): CustomStyleData {
    const bodyData: BodyData<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption> = {
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
