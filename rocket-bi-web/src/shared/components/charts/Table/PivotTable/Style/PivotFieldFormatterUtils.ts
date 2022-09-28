/*
 * @author: tvc12 - Thien Vi
 * @created: 6/24/21, 9:55 AM
 */

import { IndexedHeaderData } from '@/shared/models';
import { FieldFormatter, FieldFormatting, PivotTableQuerySetting, PivotTableChartOption, TableColumn } from '@core/domain';
import { ListUtils } from '@/utils';
import { StringUtils } from '@/utils/string.utils';
import { PivotFormatAs } from '@chart/Table/PivotTable/Style/PivotFormatAs';

export class PivotFieldFormatterUtils {
  static getFieldFormatter(header: IndexedHeaderData, querySetting: PivotTableQuerySetting, vizSetting: PivotTableChartOption): FieldFormatter | undefined {
    const isNormalTable = ListUtils.isEmpty(querySetting.columns);
    if (isNormalTable) {
      return this.getNormalFieldFormatter(header, querySetting, vizSetting);
    } else {
      return this.getPivotFieldFormatter(header, querySetting, vizSetting);
    }
  }

  static getFormatType(querySetting: PivotTableQuerySetting): PivotFormatAs {
    if (ListUtils.isNotEmpty(querySetting.rows) && ListUtils.isNotEmpty(querySetting.columns)) {
      return PivotFormatAs.Normal;
    }
    if (ListUtils.isEmpty(querySetting.rows) && ListUtils.isNotEmpty(querySetting.columns)) {
      return PivotFormatAs.OneRow;
    }
    return PivotFormatAs.Table;
  }

  private static isFirstGroupColumn(header: IndexedHeaderData, querySetting: PivotTableQuerySetting) {
    return StringUtils.toCamelCase(header.label) === ListUtils.getHead(querySetting.rows)?.normalizeName;
  }

  private static getFieldFormatterByHeader(header: IndexedHeaderData, querySetting: PivotTableQuerySetting, fieldFormatting: FieldFormatting) {
    if (ListUtils.hasOnlyOneItem(querySetting.values)) {
      const firstValue: TableColumn = ListUtils.getHead(querySetting.values)!;
      return fieldFormatting[firstValue.normalizeName];
    } else {
      const normalizeHeader = StringUtils.toCamelCase(header.label);
      return fieldFormatting[normalizeHeader];
    }
  }

  private static getPivotFieldFormatter(
    header: IndexedHeaderData,
    querySetting: PivotTableQuerySetting,
    vizSetting: PivotTableChartOption
  ): FieldFormatter | undefined {
    const fieldFormatting: FieldFormatting | undefined = vizSetting.options.fieldFormatting;
    if (fieldFormatting) {
      if (this.isFirstGroupColumn(header, querySetting)) {
        return fieldFormatting[querySetting.rows[0]?.normalizeName];
      } else {
        return this.getFieldFormatterByHeader(header, querySetting, fieldFormatting);
      }
    }
  }

  private static getNormalFieldFormatter(
    header: IndexedHeaderData,
    querySetting: PivotTableQuerySetting,
    vizSetting: PivotTableChartOption
  ): FieldFormatter | undefined {
    const fieldFormatting: FieldFormatting | undefined = vizSetting.options.fieldFormatting;
    if (fieldFormatting) {
      const isFirstColumn = header.columnIndex == 0;
      if (isFirstColumn) {
        return fieldFormatting[querySetting.rows[0]?.normalizeName];
      } else {
        // Fixme: hard code remove by
        const normalizedName = StringUtils.toCamelCase(header.label.split('by')[0]);
        const [_, value] = Object.entries(fieldFormatting).find(([key]) => StringUtils.isIncludes(key, normalizedName)) ?? [];
        return value;
      }
    }
  }

  static getDefaultStyle() {
    return { css: {} } as any;
  }
}
