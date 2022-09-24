/*
 * @author: tvc12 - Thien Vi
 * @created: 6/23/21, 5:36 PM
 */

import { AbstractTableResponse, FieldFormatter, PivotTableQuerySetting, PivotTableChartOption } from '@core/domain';
import { CustomHeaderCellData, CustomStyleData } from '@chart/CustomTable/TableData';
import { Log, ObjectUtils } from '@core/utils';
import { TableHeaderStyleRender } from '@chart/Table/StyleRender/TableHeaderStyleRender';
import { PivotFieldFormatterUtils } from '@chart/Table/PivotTable/Style/PivotFieldFormatterUtils';
import { TableStyleUtils } from '@chart/Table/TableStyleUtils';

export class PivotTableHeaderStyleRender implements TableHeaderStyleRender {
  private static DEFAULT_STYLE: any = { css: {} };
  private tableResponse: AbstractTableResponse;
  private querySetting: PivotTableQuerySetting;
  private vizSetting: PivotTableChartOption;
  private baseThemeColor: string;

  constructor(tableResponse: AbstractTableResponse, query: PivotTableQuerySetting, baseThemeColor: string) {
    this.tableResponse = tableResponse;
    this.querySetting = query;
    this.vizSetting = query.getChartOption()!;
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
