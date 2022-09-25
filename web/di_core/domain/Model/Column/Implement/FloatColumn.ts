import { Column } from '@core/domain/Model/Column/Column';
import { ColumnType } from '@core/domain/Model';
import { Expression } from '@core/domain/Model/Column/Expression/Expression';
import { toNumber } from 'lodash';

export class FloatColumn extends Column {
  className = ColumnType.float;
  name!: string;
  displayName!: string;
  description?: string;
  defaultValue?: number;
  isNullable: boolean;
  isEncrypted: boolean;
  isPrivate: boolean;
  defaultExpression?: Expression;

  constructor(
    name: string,
    displayName: string,
    isNullable: boolean,
    isEncrypted: boolean,
    isPrivate: boolean,
    description?: string,
    defaultValue?: number,
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

  static fromObject(obj: FloatColumn): FloatColumn {
    const defaultExpression = obj.defaultExpression ? Expression.fromObject(obj.defaultExpression) : void 0;
    const valueAsNumber = toNumber(obj.defaultValue);
    const defaultValue = isNaN(valueAsNumber) ? void 0 : valueAsNumber;
    return new FloatColumn(obj.name, obj.displayName, obj.isNullable, obj.isEncrypted, obj.isPrivate, obj.description, defaultValue, defaultExpression);
  }
}
