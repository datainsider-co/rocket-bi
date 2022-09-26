/*
 * @author: tvc12 - Thien Vi
 * @created: 6/28/21, 5:04 PM
 */

import { BodyStyleFormatter } from '@chart/Table/PivotTable/Style/Body/BodyStyleFormatter';
import { AbstractTableQuerySetting, AbstractTableResponse, FieldFormatter, TableChartOption } from '@core/domain';
import { CustomStyleData } from '@chart/CustomTable/TableData';
import { ObjectUtils } from '@core/utils';
import { BodyData } from '@chart/Table/PivotTable/Style/Body/BodyData';
import { TableFieldFormatterUtils } from '@chart/Table/DefaultTable/Style/TableFieldFormatterUtils';

export class TableFieldStyleFormatter implements BodyStyleFormatter<AbstractTableQuerySetting, AbstractTableResponse, TableChartOption> {
  createStyle(bodyData: BodyData<AbstractTableQuerySetting, AbstractTableResponse, TableChartOption>): CustomStyleData {
    const { querySetting, bodyCellData, vizSetting } = bodyData;
    const fieldFormatter: FieldFormatter | undefined = TableFieldFormatterUtils.getFieldFormatter(bodyCellData.header, querySetting, vizSetting);
    if (fieldFormatter && fieldFormatter.applyValues) {
      const style = {
        color: fieldFormatter.style?.color,
        'text-align': fieldFormatter.align,
        'background-color': fieldFormatter.backgroundColor
      };
      return { css: ObjectUtils.removeKeyIfValueNotExist(style) };
    } else {
      return { css: {} } as any;
    }
  }
}
