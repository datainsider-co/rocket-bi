/*
 * @author: tvc12 - Thien Vi
 * @created: 6/23/21, 1:46 PM
 */

import { AbstractTableResponse } from '@core/common/domain/response/query/AbstractTableResponse';
import { PivotTableQuerySetting, PivotTableChartOption } from '@core/common/domain/model';
import { CustomBodyCellData, CustomStyleData } from '@chart/custom-table/TableData';
import { TableBodyStyleRender } from '@chart/table/style-render/TableBodyStyleRender';
import { ObjectUtils } from '@core/utils';
import { BodyStyleFormatter } from '@chart/table/pivot-table/style/body/BodyStyleFormatter';
import { FieldStyleFormatter } from '@chart/table/pivot-table/style/body/FieldStyleFormatter';
import { BodyData } from '@chart/table/pivot-table/style/body/BodyData';
import { BackgroundColorScaleFormatter } from '@chart/table/pivot-table/style/body/BackgroundColorScaleFormatter';
import { ColorScaleFormatter } from '@chart/table/pivot-table/style/body/ColorScaleFormatter';
import { BackgroundRuleFormatter } from '@chart/table/pivot-table/style/body/BackgroundRuleFormatter';
import { ColorRuleFormatter } from '@chart/table/pivot-table/style/body/ColorRuleFormatter';
import { BackgroundFieldValueFormatter } from '@chart/table/pivot-table/style/body/BackgroundFieldValueFormatter';
import { ColorFieldValueFormatter } from '@chart/table/pivot-table/style/body/ColorFieldValueFormatter';
import { DataBarFormatter } from '@chart/table/pivot-table/style/body/DataBarFormatter';
import { IconRuleFormatter } from '@chart/table/pivot-table/style/body/IconRuleFormatter';
import { IconFieldValueFormatter } from '@chart/table/pivot-table/style/body/IconFieldValueFormatter';

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
