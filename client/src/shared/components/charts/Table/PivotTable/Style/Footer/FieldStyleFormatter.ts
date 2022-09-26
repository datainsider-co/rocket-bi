/*
 * @author: tvc12 - Thien Vi
 * @created: 6/28/21, 5:04 PM
 */

import { AbstractTableResponse, FieldFormatter, PivotTableQuerySetting, PivotTableChartOption } from '@core/domain';
import { CustomStyleData } from '@chart/CustomTable/TableData';
import { PivotFieldFormatterUtils } from '@chart/Table/PivotTable/Style/PivotFieldFormatterUtils';
import { ObjectUtils } from '@core/utils';
import { TableStyleUtils } from '@chart/Table/TableStyleUtils';
import { FooterStyleFormatter } from '@chart/Table/DefaultTable/Style/Footer/FooterStyleFormatter';
import { FooterData } from '@chart/Table/DefaultTable/Style/Footer/FooterData';

export class FieldStyleFormatter implements FooterStyleFormatter<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption> {
  createStyle(footerData: FooterData<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption>): CustomStyleData {
    const { baseThemeColor, querySetting, data, vizSetting } = footerData;
    const fieldFormatter: FieldFormatter | undefined = PivotFieldFormatterUtils.getFieldFormatter(data.header, querySetting, vizSetting);
    if (fieldFormatter && fieldFormatter.applyTotals) {
      const widgetColor = vizSetting.getBackgroundColor();
      const style = {
        color: fieldFormatter.style?.color,
        'text-align': fieldFormatter.align,
        'background-color': TableStyleUtils.combineColor(baseThemeColor, fieldFormatter.backgroundColor, widgetColor)
      };
      return { css: ObjectUtils.removeKeyIfValueNotExist(style) };
    } else {
      return { css: {} } as any;
    }
  }
}
