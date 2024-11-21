/*
 * @author: tvc12 - Thien Vi
 * @created: 6/23/21, 5:36 PM
 */

import { AbstractTableResponse, FieldFormatter, PivotTableQuerySetting, PivotTableChartOption } from '@core/common/domain';
import { CustomHeaderCellData, CustomStyleData } from '@chart/custom-table/TableData';
import { Log, ObjectUtils } from '@core/utils';
import { TableHeaderStyleRender } from '@chart/table/style-render/TableHeaderStyleRender';
import { PivotFieldFormatterUtils } from '@chart/table/pivot-table/style/PivotFieldFormatterUtils';
import { TableStyleUtils } from '@chart/table/TableStyleUtils';

export class PivotTableHeaderStyleRender implements TableHeaderStyleRender {
  private static DEFAULT_STYLE: any = { css: {} };
  private tableResponse: AbstractTableResponse;
  private querySetting: PivotTableQuerySetting;
  private vizSetting: PivotTableChartOption;
  private baseThemeColor: string;

  constructor(tableResponse: AbstractTableResponse, query: PivotTableQuerySetting, baseThemeColor: string) {
    this.tableResponse = tableResponse;
    this.querySetting = query;
    this.vizSetting = query.getChartOption<PivotTableChartOption>()!;
    this.baseThemeColor = baseThemeColor;
  }

  createStyle(cellData: CustomHeaderCellData): CustomStyleData {
    return {
      css: {
        ...this.getFieldCustomStyle(cellData, this.querySetting, this.vizSetting)
      }
    };
  }

  private getFieldCustomStyle(cellData: CustomHeaderCellData, querySetting: PivotTableQuerySetting, vizSetting: PivotTableChartOption): any {
    const fieldFormatter: FieldFormatter | undefined = PivotFieldFormatterUtils.getFieldFormatter(cellData.header, querySetting, vizSetting);
    if (fieldFormatter && fieldFormatter.applyHeader) {
      const widgetColor = vizSetting.getBackgroundColor();
      const style = {
        color: fieldFormatter.style?.color,
        'text-align': fieldFormatter.align,
        'background-color': TableStyleUtils.combineColor(this.baseThemeColor, fieldFormatter.backgroundColor, widgetColor)
      };
      return ObjectUtils.removeKeyIfValueNotExist(style);
    } else {
      return {};
    }
  }
}
