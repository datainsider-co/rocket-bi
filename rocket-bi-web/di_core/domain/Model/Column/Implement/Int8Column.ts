import { Column } from '@core/domain/Model/Column/Column';
import { ColumnType } from '@core/domain/Model';
import { Expression } from '@core/domain/Model/Column/Expression/Expression';
import { toNumber } from 'lodash';

export class Int8Column extends Column {
  isNullable: boolean;
  isEncrypted: boolean;
  isPrivate: boolean;
  className = ColumnType.int8;
  name!: string;
  displayName!: string;
  description?: string;
  defaultValue?: number;
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
    this.isNullable = isNullable || false;
    this.defaultExpression = defaultExpression;
    this.isEncrypted = isEncrypted || false;
    this.isPrivate = isPrivate || false;
  }

  static fromObject(obj: Int8Column): Int8Column {
    const defaultExpression = obj.defaultExpression ? Expression.fromObject(obj.defaultExpression) : void 0;
    const valueAsNumber = toNumber(obj.defaultValue);
    const defaultValue = isNaN(valueAsNumber) ? void 0 : valueAsNumber;
    return new Int8Column(obj.name, obj.displayName, obj.isNullable, obj.isEncrypted, obj.isPrivate, obj.description, defaultValue, defaultExpression);
  }
}

export class Int16Column extends Column {
  className = ColumnType.int16;
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
    this.isNullable = isNullable || false;
    this.defaultExpression = defaultExpression;
    this.isEncrypted = isEncrypted || false;
    this.isPrivate = isPrivate || false;
  }

  static fromObject(obj: Int16Column): Int16Column {
    const defaultExpression = obj.defaultExpression ? Expression.fromObject(obj.defaultExpression) : void 0;
    const valueAsNumber = toNumber(obj.defaultValue);
    const defaultValue = isNaN(valueAsNumber) ? void 0 : valueAsNumber;
    return new Int16Column(obj.name, obj.displayName, obj.isNullable, obj.isEncrypted, obj.isPrivate, obj.description, defaultValue, defaultExpression);
  }
}

export class Int32Column extends Column {
  className = ColumnType.int32;
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
    this.isNullable = isNullable || false;
    this.isEncrypted = isEncrypted || false;
    this.isPrivate = isPrivate || false;
    this.defaultExpression = defaultExpression;
  }

  static fromObject(obj: Int32Column): Int32Column {
    const defaultExpression = obj.defaultExpression ? Expression.fromObject(obj.defaultExpression) : void 0;
    const valueAsNumber = toNumber(obj.defaultValue);
    const defaultValue = isNaN(valueAsNumber) ? void 0 : valueAsNumber;
    return new Int32Column(obj.name, obj.displayName, obj.isNullable, obj.isEncrypted, obj.isPrivate, obj.description, defaultValue, defaultExpression);
  }
}

export class Int64Column extends Column {
  className = ColumnType.int64;
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
    this.isNullable = isNullable || false;
    this.isEncrypted = isEncrypted || false;
    this.isPrivate = isPrivate || false;
    this.defaultExpression = defaultExpression;
  }

  static fromObject(obj: Int64Column): Int64Column {
    const defaultExpression = obj.defaultExpression ? Expression.fromObject(obj.defaultExpression) : void 0;
    const valueAsNumber = toNumber(obj.defaultValue);
    const defaultValue = isNaN(valueAsNumber) ? void 0 : valueAsNumber;
    return new Int64Column(obj.name, obj.displayName, obj.isNullable, obj.isEncrypted, obj.isPrivate, obj.description, defaultValue, defaultExpression);
  }
}

export class UInt8Column extends Column {
  className = ColumnType.uint8;
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
    this.isNullable = isNullable || false;
    this.isEncrypted = isEncrypted || false;
    this.isPrivate = isPrivate || false;
    this.defaultExpression = defaultExpression;
  }

  static fromObject(obj: UInt8Column): UInt8Column {
    const defaultExpression = obj.defaultExpression ? Expression.fromObject(obj.defaultExpression) : void 0;
    const valueAsNumber = toNumber(obj.defaultValue);
    const defaultValue = isNaN(valueAsNumber) ? void 0 : valueAsNumber;
    return new UInt8Column(obj.name, obj.displayName, obj.isNullable, obj.isEncrypted, obj.isPrivate, obj.description, defaultValue, defaultExpression);
  }
}

export class UInt16Column extends Column {
  className = ColumnType.uint16;
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
    this.isNullable = isNullable || false;
    this.isEncrypted = isEncrypted || false;
    this.isPrivate = isPrivate || false;
    this.defaultExpression = defaultExpression;
  }

  static fromObject(obj: UInt16Column): UInt16Column {
    const defaultExpression = obj.defaultExpression ? Expression.fromObject(obj.defaultExpression) : void 0;
    const valueAsNumber = toNumber(obj.defaultValue);
    const defaultValue = isNaN(valueAsNumber) ? void 0 : valueAsNumber;
    return new UInt16Column(obj.name, obj.displayName, obj.isNullable, obj.isEncrypted, obj.isPrivate, obj.description, defaultValue, defaultExpression);
  }
}

export class UInt32Column extends Column {
  className = ColumnType.uint32;
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
    this.isNullable = isNullable || false;
    this.defaultExpression = defaultExpression;
    this.isEncrypted = isEncrypted || false;
    this.isPrivate = isPrivate || false;
  }

  static fromObject(obj: UInt32Column): UInt32Column {
    const defaultExpression = obj.defaultExpression ? Expression.fromObject(obj.defaultExpression) : void 0;
    const valueAsNumber = toNumber(obj.defaultValue);
    const defaultValue = isNaN(valueAsNumber) ? void 0 : valueAsNumber;
    return new UInt32Column(obj.name, obj.displayName, obj.isNullable, obj.isEncrypted, obj.isPrivate, obj.description, defaultValue, defaultExpression);
  }
}

export class UInt64Column extends Column {
  className = ColumnType.uint64;
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
    this.isNullable = isNullable || false;
    this.isEncrypted = isEncrypted || false;
    this.isPrivate = isPrivate || false;
    this.defaultExpression = defaultExpression;
  }

  static fromObject(obj: UInt64Column): UInt64Column {
    const defaultExpression = obj.defaultExpression ? Expression.fromObject(obj.defaultExpression) : void 0;
    const valueAsNumber = toNumber(obj.defaultValue);
    const defaultValue = isNaN(valueAsNumber) ? void 0 : valueAsNumber;
    return new UInt64Column(obj.name, obj.displayName, obj.isNullable, obj.isEncrypted, obj.isPrivate, obj.description, defaultValue, defaultExpression);
  }
}
