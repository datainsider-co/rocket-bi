/*
 * @author: tvc12 - Thien Vi
 * @created: 6/23/21, 5:36 PM
 */

import { AbstractTableResponse, PivotTableQuerySetting, PivotTableChartOption } from '@core/domain';
import { CustomFooterCellData, CustomStyleData } from '@chart/CustomTable/TableData';
import { ObjectUtils } from '@core/utils';
import { TableFooterStyleRender } from '@chart/Table/StyleRender/TableFooterStyleRender';
import { FooterStyleFormatter } from '@chart/Table/DefaultTable/Style/Footer/FooterStyleFormatter';
import { FooterData } from '@chart/Table/DefaultTable/Style/Footer/FooterData';
import { FieldStyleFormatter } from '@chart/Table/PivotTable/Style/Footer/FieldStyleFormatter';
import { BackgroundColorRuleFormatter } from '@chart/Table/PivotTable/Style/Footer/BackgroundColorRuleFormatter';
import { BackgroundColorScaleFormatter } from '@chart/Table/PivotTable/Style/Footer/BackgroundColorScaleFormatter';
import { BackgroundFieldValueFormatter } from '@chart/Table/PivotTable/Style/Footer/BackgroundFieldValueFormatter';
import { ColorRuleFormatter } from '@chart/Table/PivotTable/Style/Footer/ColorRuleFormatter';
import { ColorScaleFormatter } from '@chart/Table/PivotTable/Style/Footer/ColorScaleFormatter';
import { ColorFieldValueFormatter } from '@chart/Table/PivotTable/Style/Footer/ColorFieldValueFormatter';
import { IconRuleFormatter } from '@chart/Table/PivotTable/Style/Footer/IconRuleFormatter';
import { IconFieldValueFormatter } from '@chart/Table/PivotTable/Style/Footer/IconFieldValueFormatter';

export class PivotTableFooterStyleRender implements TableFooterStyleRender {
  private static DEFAULT_STYLE: any = { css: {} };
  private tableResponse: AbstractTableResponse;
  private querySetting: PivotTableQuerySetting;
  private vizSetting: PivotTableChartOption;
  private baseThemeColor: string;
  private styleFormatters: FooterStyleFormatter<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption>[];

  constructor(tableResponse: AbstractTableResponse, query: PivotTableQuerySetting, baseThemeColor: string) {
    this.tableResponse = tableResponse;
    this.querySetting = query;
    this.vizSetting = query.getChartOption()!;
    this.baseThemeColor = baseThemeColor;
    this.styleFormatters = PivotTableFooterStyleRender.getStyleFormatters();
  }

  private static getStyleFormatters() {
    return [
      new FieldStyleFormatter(),
      new BackgroundColorRuleFormatter(),
      new BackgroundColorScaleFormatter(),
      new BackgroundFieldValueFormatter(),
      new ColorRuleFormatter(),
      new ColorScaleFormatter(),
      new ColorFieldValueFormatter(),
      new IconRuleFormatter(),
      new IconFieldValueFormatter()
    ];
  }

  createStyle(cellData: CustomFooterCellData): CustomStyleData {
    const bodyData: FooterData<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption> = {
      tableResponse: this.tableResponse,
      querySetting: this.querySetting,
      data: cellData,
      baseThemeColor: this.baseThemeColor,
      vizSetting: this.vizSetting
    };
    const styles: CustomStyleData[] = this.styleFormatters.map(formatter => formatter.createStyle(bodyData));

    return ObjectUtils.mergeStyles(styles);
  }
}
