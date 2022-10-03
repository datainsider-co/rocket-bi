import { Column } from '@core/common/domain/model/column/Column';
import { ColumnType } from '@core/common/domain/model';
import { Expression } from '@core/common/domain/model/column/expression/Expression';

export class ArrayColumn extends Column {
  defaultExpression?: Expression;
  className = ColumnType.array;
  displayName: string;
  name: string;
  isNullable: boolean;
  isEncrypted: boolean;
  isPrivate: boolean;
  column: Column;
  description?: string;
  defaultValue?: Column[];

  constructor(
    displayName: string,
    name: string,
    isNullable: boolean,
    isEncrypted: boolean,
    isPrivate: boolean,
    column: Column,
    description?: string,
    defaultValue?: Column[],
    defaultExpression?: Expression
  ) {
    super();
    this.displayName = displayName;
    this.name = name;
    this.description = description;
    this.isNullable = isNullable;
    this.column = column;
    this.defaultValue = defaultValue;
    this.defaultExpression = defaultExpression;
    this.isEncrypted = isEncrypted;
    this.isPrivate = isPrivate;
  }

  static fromObject(obj: ArrayColumn): ArrayColumn {
    const column = Column.fromObject(obj.column) as Column;
    const defaultExpression = obj.defaultExpression ? Expression.fromObject(obj.defaultExpression) : void 0;

    return new ArrayColumn(
      obj.displayName,
      obj.name,
      obj.isNullable,
      obj.isEncrypted,
      obj.isPrivate,
      column,
      obj.description,
      obj.defaultValue,
      defaultExpression
    );
  }
}
