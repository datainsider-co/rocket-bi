import {
  ArrayColumn,
  BoolColumn,
  ColumnType,
  DateColumn,
  DateTime64Column,
  DateTimeColumn,
  DoubleColumn,
  FloatColumn,
  Int16Column,
  Int32Column,
  Int64Column,
  Int8Column,
  NestedColumn,
  StringColumn,
  UInt16Column,
  UInt32Column,
  UInt64Column,
  UInt8Column
} from '@core/domain/Model';
import { Expression } from '@core/domain/Model/Column/Expression/Expression';
import { Log } from '@core/utils';
import { ExpressionType } from '@core/domain/Model/Column/Expression/ExpressionType';

export abstract class Column {
  abstract className: ColumnType;
  abstract name: string;
  abstract displayName: string;
  abstract description?: string;
  abstract isNullable: boolean;
  abstract isEncrypted: boolean;
  abstract isPrivate: boolean;
  abstract defaultExpression?: Expression;

  static fromObject(obj: any): Column | undefined {
    switch (obj.className) {
      case ColumnType.bool:
        return BoolColumn.fromObject(obj);
      case ColumnType.int8:
        return Int8Column.fromObject(obj);
      case ColumnType.int16:
        return Int16Column.fromObject(obj);
      case ColumnType.int32:
        return Int32Column.fromObject(obj);
      case ColumnType.int64:
        return Int64Column.fromObject(obj);
      case ColumnType.uint8:
        return UInt8Column.fromObject(obj);
      case ColumnType.uint16:
        return UInt16Column.fromObject(obj);
      case ColumnType.uint32:
        return UInt32Column.fromObject(obj);
      case ColumnType.uint64:
        return UInt64Column.fromObject(obj);
      case ColumnType.float:
        return FloatColumn.fromObject(obj);
      case ColumnType.double:
        return DoubleColumn.fromObject(obj);
      case ColumnType.date:
        return DateColumn.fromObject(obj);
      case ColumnType.datetime:
        return DateTimeColumn.fromObject(obj);
      case ColumnType.datetime64:
        return DateTime64Column.fromObject(obj);
      case ColumnType.string:
        return StringColumn.fromObject(obj);
      case ColumnType.nested:
        return NestedColumn.fromObject(obj);
      case ColumnType.array:
        return ArrayColumn.fromObject(obj);
      default:
        Log.info(`fromObject: object with className ${obj.className} not found`, obj);
        return void 0;
    }
  }

  static default() {
    return new StringColumn('', '', false, false, false);
  }

  public isMaterialized(): boolean {
    if (this.defaultExpression) {
      return this.defaultExpression.defaultType == ExpressionType.Materialized;
    } else {
      return false;
    }
  }
}
