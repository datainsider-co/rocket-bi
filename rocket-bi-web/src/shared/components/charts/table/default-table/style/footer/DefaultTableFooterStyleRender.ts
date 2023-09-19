/*
 * @author: tvc12 - Thien Vi
 * @created: 6/23/21, 5:36 PM
 */

import { AbstractTableQuerySetting, AbstractTableResponse, TableChartOption } from '@core/common/domain';
import { CustomFooterCellData, CustomStyleData } from '@chart/custom-table/TableData';
import { ObjectUtils } from '@core/utils';
import { TableFooterStyleRender } from '@chart/table/style-render/TableFooterStyleRender';
import { FooterStyleFormatter } from '@chart/table/default-table/style/footer/FooterStyleFormatter';
import { FooterData } from '@chart/table/default-table/style/footer/FooterData';
import { TableFieldStyleFormatter } from '@chart/table/default-table/style/footer/TableFieldStyleFormatter';

export class DefaultTableFooterStyleRender implements TableFooterStyleRender {
  private tableResponse: AbstractTableResponse;
  private querySetting: AbstractTableQuerySetting;
  private vizSetting: TableChartOption;
  private styleFormatters: FooterStyleFormatter<AbstractTableQuerySetting, AbstractTableResponse, TableChartOption>[];
  private baseThemeColor: string;

  constructor(tableResponse: AbstractTableResponse, query: AbstractTableQuerySetting, baseThemeColor: string) {
    this.tableResponse = tableResponse;
    this.querySetting = query;
    this.vizSetting = query.getChartOption<TableChartOption>()!;
    this.baseThemeColor = baseThemeColor;
    this.styleFormatters = DefaultTableFooterStyleRender.getStyleFormatters();
  }

  private static getStyleFormatters() {
    return [new TableFieldStyleFormatter()];
  }

  createStyle(cellData: CustomFooterCellData): CustomStyleData {
    const bodyData: FooterData<AbstractTableQuerySetting, AbstractTableResponse, TableChartOption> = {
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
