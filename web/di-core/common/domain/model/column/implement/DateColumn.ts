import { Column } from '@core/common/domain/model/column/Column';
import { ColumnType } from '@core/common/domain/model';
import { Expression } from '@core/common/domain/model/column/expression/Expression';
import { toNumber } from 'lodash';

export class DateColumn extends Column {
  className = ColumnType.date;
  name!: string;
  displayName!: string;
  description?: string;
  inputFormats: string[] = [];
  defaultValue?: number;
  isNullable: boolean;
  isEncrypted: boolean;
  isPrivate: boolean;
  defaultExpression?: Expression;

  constructor(
    name: string,
    displayName: string,
    inputFormats: string[],
    isNullable = false,
    isEncrypted = false,
    isPrivate = false,
    description?: string,
    defaultValue?: number,
    defaultExpression?: Expression
  ) {
    super();
    this.name = name;
    this.displayName = displayName;
    this.inputFormats = inputFormats;
    this.description = description;
    this.defaultValue = defaultValue;
    this.isNullable = isNullable;
    this.defaultExpression = defaultExpression;
    this.isEncrypted = isEncrypted;
    this.isPrivate = isPrivate;
  }

  static fromObject(obj: DateColumn): DateColumn {
    const defaultExpression = obj.defaultExpression ? Expression.fromObject(obj.defaultExpression) : void 0;
    const valueAsNumber = toNumber(obj.defaultValue);
    const defaultValue = isNaN(valueAsNumber) ? void 0 : valueAsNumber;
    return new DateColumn(
      obj.name,
      obj.displayName,
      obj.inputFormats,
      obj.isNullable,
      obj.isEncrypted,
      obj.isPrivate,
      obj.description,
      defaultValue,
      defaultExpression
    );
  }
}

export class DateTimeColumn extends Column {
  className = ColumnType.datetime;
  name!: string;
  displayName!: string;
  inputFormats: string[] = [];
  inputAsTimestamp = false;
  description?: string;
  timezone?: string;
  defaultValue?: number;
  isNullable: boolean;
  isEncrypted: boolean;
  isPrivate: boolean;
  defaultExpression?: Expression;

  constructor(
    name: string,
    displayName: string,
    inputFormats: string[],
    inputAsTimestamp: boolean,
    isNullable = false,
    isEncrypted = false,
    isPrivate = false,
    description?: string,
    timezone?: string,
    defaultValue?: number,
    defaultExpression?: Expression
  ) {
    super();
    this.name = name;
    this.displayName = displayName;
    this.inputFormats = inputFormats;
    this.inputAsTimestamp = inputAsTimestamp;
    this.description = description;
    this.timezone = timezone;
    this.defaultValue = defaultValue;
    this.isNullable = isNullable;
    this.defaultExpression = defaultExpression;
    this.isEncrypted = isEncrypted;
    this.isPrivate = isPrivate;
  }

  static fromObject(obj: DateTimeColumn): DateTimeColumn {
    const defaultExpression = obj.defaultExpression ? Expression.fromObject(obj.defaultExpression) : void 0;
    const valueAsNumber = toNumber(obj.defaultValue);
    const defaultValue = isNaN(valueAsNumber) ? void 0 : valueAsNumber;
    return new DateTimeColumn(
      obj.name,
      obj.displayName,
      obj.inputFormats,
      obj.inputAsTimestamp,
      obj.isNullable,
      obj.isEncrypted,
      obj.isPrivate,
      obj.description,
      obj.timezone,
      defaultValue,
      defaultExpression
    );
  }
}

export class DateTime64Column extends Column {
  className = ColumnType.datetime64;
  name!: string;
  displayName!: string;
  description?: string;
  timezone?: string;
  inputAsTimestamp = false;
  inputFormats: string[] = [];
  defaultValue?: number;
  isNullable: boolean;
  isEncrypted: boolean;
  isPrivate: boolean;
  defaultExpression?: Expression;

  constructor(
    name: string,
    displayName: string,
    inputFormats: string[],
    inputAsTimestamp: boolean,
    isNullable = false,
    isEncrypted = false,
    isPrivate = false,
    description?: string,
    timezone?: string,
    defaultValue?: number,
    defaultExpression?: Expression
  ) {
    super();
    this.name = name;
    this.displayName = displayName;
    this.inputFormats = inputFormats;
    this.inputAsTimestamp = inputAsTimestamp;
    this.description = description;
    this.timezone = timezone;
    this.defaultValue = defaultValue;
    this.isNullable = isNullable;
    this.defaultExpression = defaultExpression;
    this.isEncrypted = isEncrypted;
    this.isPrivate = isPrivate;
  }

  static fromObject(obj: DateTime64Column): DateTime64Column {
    const defaultExpression = obj.defaultExpression ? Expression.fromObject(obj.defaultExpression) : void 0;
    const valueAsNumber = toNumber(obj.defaultValue);
    const defaultValue = isNaN(valueAsNumber) ? void 0 : valueAsNumber;
    return new DateTime64Column(
      obj.name,
      obj.displayName,
      obj.inputFormats,
      obj.inputAsTimestamp,
      obj.isNullable,
      obj.isEncrypted,
      obj.isPrivate,
      obj.description,
      obj.timezone,
      defaultValue,
      defaultExpression
    );
  }
}
