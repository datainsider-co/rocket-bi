import { Column } from '@core/domain/Model/Column/Column';
import { ColumnType } from '@core/domain/Model';
import { Expression } from '@core/domain/Model/Column/Expression/Expression';
import { isBoolean } from 'lodash';

export class BoolColumn extends Column {
  isNullable: boolean;
  isEncrypted: boolean;
  isPrivate: boolean;
  className = ColumnType.bool;
  name!: string;
  displayName!: string;
  description?: string;
  defaultValue?: boolean;
  defaultExpression?: Expression;

  constructor(
    name: string,
    displayName: string,
    isNullable: boolean,
    isEncrypted: boolean,
    isPrivate: boolean,
    description?: string,
    defaultValue?: boolean,
    defaultExpression?: Expression
  ) {
    super();
    this.name = name;
    this.displayName = displayName;
    this.description = description;
    this.defaultValue = defaultValue;
    this.isNullable = isNullable;
    this.defaultExpression = defaultExpression;
    this.isEncrypted = isEncrypted;
    this.isPrivate = isPrivate;
  }

  static fromObject(obj: BoolColumn): BoolColumn {
    const defaultExpression = obj.defaultExpression ? Expression.fromObject(obj.defaultExpression) : void 0;
    const defaultValue = isBoolean(obj.defaultValue) ? obj.defaultValue : false;
    return new BoolColumn(obj.name, obj.displayName, obj.isNullable, obj.isEncrypted, obj.isPrivate, obj.description, defaultValue, defaultExpression);
  }
}
