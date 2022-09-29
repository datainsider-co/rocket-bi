import { Column, ColumnType } from '@core/common/domain/model';

export abstract class IconUtils {
  /**
   * Function return name of component in src/shared/components/Icon/install.ts
   * @param column
   */
  static getIconComponent(column: Column): string {
    if (column.isMaterialized()) {
      return this.getCustomIconByColumnType(column.className);
    } else {
      return this.getIconByColumnType(column.className);
    }
  }

  /**
   * Return normal icon by column type
   * @param className
   * @private
   */
  private static getIconByColumnType(className: ColumnType): string {
    switch (className) {
      case ColumnType.date:
      case ColumnType.datetime:
      case ColumnType.datetime64:
        return 'DataDateIcon';
      case ColumnType.int8:
      case ColumnType.int16:
      case ColumnType.int32:
      case ColumnType.int64:
      case ColumnType.uint8:
      case ColumnType.uint16:
      case ColumnType.uint32:
      case ColumnType.uint64:
      case ColumnType.double:
      case ColumnType.float:
      case ColumnType.float64:
        return 'DataNumberIcon';
      default:
        return 'DataTextIcon';
    }
  }

  /**
   * Return normal icon by column type
   * @param className
   * @private
   */
  static getSVGIconByColumnType(className: ColumnType): string {
    switch (className) {
      case ColumnType.date:
      case ColumnType.datetime:
      case ColumnType.datetime64:
        return require('@/assets/icon/dashboard/ic-data-date.svg');
      case ColumnType.int8:
      case ColumnType.int16:
      case ColumnType.int32:
      case ColumnType.int64:
      case ColumnType.uint8:
      case ColumnType.uint16:
      case ColumnType.uint32:
      case ColumnType.uint64:
      case ColumnType.double:
      case ColumnType.float:
      case ColumnType.float64:
        return require('@/assets/icon/dashboard/ic-data-number.svg');
      default:
        return require('@/assets/icon/dashboard/ic-data-string.svg');
    }
  }

  /**
   * Return Custom Item By Column Type
   * @param className
   * @private
   */
  private static getCustomIconByColumnType(className: ColumnType): string {
    switch (className) {
      case ColumnType.date:
      case ColumnType.datetime:
      case ColumnType.datetime64:
        return 'FunctionIcon';
      case ColumnType.int8:
      case ColumnType.int16:
      case ColumnType.int32:
      case ColumnType.int64:
      case ColumnType.uint8:
      case ColumnType.uint16:
      case ColumnType.uint32:
      case ColumnType.uint64:
      case ColumnType.double:
      case ColumnType.float:
      case ColumnType.float64:
        return 'FunctionIcon';
      default:
        return 'FunctionIcon';
    }
  }
}
