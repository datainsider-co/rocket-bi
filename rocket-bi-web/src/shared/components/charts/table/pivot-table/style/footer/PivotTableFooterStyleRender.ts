/*
 * @author: tvc12 - Thien Vi
 * @created: 6/23/21, 5:36 PM
 */

import { AbstractTableResponse, PivotTableQuerySetting, PivotTableChartOption } from '@core/common/domain';
import { CustomFooterCellData, CustomStyleData } from '@chart/custom-table/TableData';
import { ObjectUtils } from '@core/utils';
import { TableFooterStyleRender } from '@chart/table/style-render/TableFooterStyleRender';
import { FooterStyleFormatter } from '@chart/table/default-table/style/footer/FooterStyleFormatter';
import { FooterData } from '@chart/table/default-table/style/footer/FooterData';
import { FieldStyleFormatter } from '@chart/table/pivot-table/style/footer/FieldStyleFormatter';
import { BackgroundColorRuleFormatter } from '@chart/table/pivot-table/style/footer/BackgroundColorRuleFormatter';
import { BackgroundColorScaleFormatter } from '@chart/table/pivot-table/style/footer/BackgroundColorScaleFormatter';
import { BackgroundFieldValueFormatter } from '@chart/table/pivot-table/style/footer/BackgroundFieldValueFormatter';
import { ColorRuleFormatter } from '@chart/table/pivot-table/style/footer/ColorRuleFormatter';
import { ColorScaleFormatter } from '@chart/table/pivot-table/style/footer/ColorScaleFormatter';
import { ColorFieldValueFormatter } from '@chart/table/pivot-table/style/footer/ColorFieldValueFormatter';
import { IconRuleFormatter } from '@chart/table/pivot-table/style/footer/IconRuleFormatter';
import { IconFieldValueFormatter } from '@chart/table/pivot-table/style/footer/IconFieldValueFormatter';

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
