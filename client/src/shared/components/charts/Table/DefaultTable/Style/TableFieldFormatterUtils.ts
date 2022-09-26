/*
 * @author: tvc12 - Thien Vi
 * @created: 6/24/21, 9:55 AM
 */

import { IndexedHeaderData } from '@/shared/models';
import { AbstractTableQuerySetting, FieldFormatter, FieldFormatting, TableChartOption } from '@core/domain';
import { StringUtils } from '@/utils/string.utils';
import { ListUtils } from '@/utils';
import { ObjectUtils } from '@core/utils';

export class TableFieldFormatterUtils {
  static getFieldFormatter(header: IndexedHeaderData, querySetting: AbstractTableQuerySetting, vizSetting: TableChartOption): FieldFormatter | undefined {
    const fieldFormatting: FieldFormatting | undefined = vizSetting.options.fieldFormatting;
    if (fieldFormatting) {
      const isFirstColumn = header.columnIndex == 0;
      if (isFirstColumn) {
        return this.getFirstFormatter(header, querySetting, fieldFormatting);
      } else {
        return this.getFieldFormatterContainsHeaderKey(header, fieldFormatting);
      }
    }
  }

  private static getFieldFormatterContainsHeaderKey(header: IndexedHeaderData, fieldFormatting: FieldFormatting) {
    const normalizedName = StringUtils.toCamelCase(header.label);
    // hardcode: fix auto add by in column
    const normalizedKey = ListUtils.getHead(normalizedName.split('By')) ?? '';
    return ObjectUtils.findStartWithKey(fieldFormatting, normalizedKey);
  }

  private static getFirstFormatter(header: IndexedHeaderData, querySetting: AbstractTableQuerySetting, fieldFormatting: FieldFormatting) {
    // Fixme: hard code remove by
    const normalizedName = StringUtils.toCamelCase(header.label.split('by')[0]);
    return fieldFormatting[normalizedName];
  }

  static getDefaultStyle() {
    return { css: {} } as any;
  }
}
