/*
 * @author: tvc12 - Thien Vi
 * @created: 6/28/21, 5:04 PM
 */

import { BodyStyleFormatter } from '@chart/table/pivot-table/style/body/BodyStyleFormatter';
import { AbstractTableResponse, FieldFormatter, PivotTableQuerySetting, PivotTableChartOption } from '@core/common/domain';
import { CustomStyleData } from '@chart/custom-table/TableData';
import { PivotFieldFormatterUtils } from '@chart/table/pivot-table/style/PivotFieldFormatterUtils';
import { ObjectUtils } from '@core/utils';
import { BodyData } from '@chart/table/pivot-table/style/body/BodyData';
import { TableStyleUtils } from '@chart/table/TableStyleUtils';

export class FieldStyleFormatter implements BodyStyleFormatter<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption> {
  createStyle(bodyData: BodyData<PivotTableQuerySetting, AbstractTableResponse, PivotTableChartOption>): CustomStyleData {
    const { baseThemeColor, querySetting, bodyCellData, vizSetting } = bodyData;
    const fieldFormatter: FieldFormatter | undefined = PivotFieldFormatterUtils.getFieldFormatter(bodyCellData.header, querySetting, vizSetting);
    if (fieldFormatter && fieldFormatter.applyValues) {
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
