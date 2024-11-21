/*
 * @author: tvc12 - Thien Vi
 * @created: 6/28/21, 5:04 PM
 */

import { AbstractTableResponse, FieldFormatter, PivotTableQuerySetting, PivotTableChartOption } from '@core/common/domain';
import { CustomStyleData } from '@chart/custom-table/TableData';
import { PivotFieldFormatterUtils } from '@chart/table/pivot-table/style/PivotFieldFormatterUtils';
import { ObjectUtils } from '@core/utils';
import { TableStyleUtils } from '@chart/table/TableStyleUtils';
import { FooterStyleFormatter } from '@chart/table/default-table/style/footer/FooterStyleFormatter';
import { FooterData } from '@chart/table/default-table/style/footer/FooterData';

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
