/* eslint-disable @typescript-eslint/no-use-before-define */

/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 8:59 PM
 */

import { Column, DefaultExpression, Expression, MaterializedExpression, SelectExpression, TableColumn } from '@core/common/domain';
import { Equatable } from '@core/common/domain/model/Equatable';
import { DataType } from '@core/schema/service/FieldFilter';
import { ChartUtils } from '@/utils';

export enum FieldType {
  TableField = 'table_field',
  ViewField = 'view_field',
  ExpressionField = 'expression_field',
  CalculatedField = 'calculated_field'
}

export abstract class Field extends Equatable {
  readonly className: FieldType;
  fieldName: string;
  fieldType: string;
  dbName: string;
  tblName: string;

  protected constructor(className: FieldType, dbName: string, tblName: string, fieldName: string, fieldType: string) {
    super();
    this.className = className;
    this.dbName = dbName;
    this.tblName = tblName;
    this.fieldName = fieldName;
    this.fieldType = fieldType;
  }

  static fromObject(obj: Field): Field {
    switch (obj.className) {
      case FieldType.TableField:
        return TableField.fromObject(obj);
      case FieldType.ViewField:
        return ViewField.fromObject(obj);
      case FieldType.ExpressionField:
        return ExpressionField.fromObject(obj);
      case FieldType.CalculatedField:
        return CalculationField.fromObject(obj);
    }
  }

  static default() {
    return new TableField('', '', '', 'string');
  }

  /**
   * tạo mới 1 field, nếu field đó không có database name thì mặc định sẽ là view field.
   * ViewField sẽ không có database name. table name = view name,
   * công dụng của table name là alias toàn bộ câu query hiện tại thành 1 name duy nhất.
   * có thể select data từ cái view name đó
   */
  static new(dbName: string, tblName: string, fieldName: string, fieldType: string): Field {
    const className = dbName === '' ? FieldType.ViewField : FieldType.TableField;
    switch (className) {
      case FieldType.TableField:
        return new TableField(dbName, tblName, fieldName, fieldType);
      case FieldType.ViewField:
        return new ViewField(dbName, tblName, fieldName, fieldType);
    }
  }

  getDataType(): DataType {
    if (ChartUtils.isTextType(this.fieldType)) {
      return DataType.Text;
    }
    if (ChartUtils.isDateType(this.fieldType)) {
      return DataType.Date;
    }
    return DataType.Number;
  }

  abstract isNested(): boolean;

  static isEqual(field: Field, oldField: Field): boolean {
    return field && oldField && field.dbName === oldField.dbName && field.tblName === oldField.tblName && field.fieldName === oldField.fieldName;
  }

  static isField(obj: any) {
    return !!obj?.getDataType;
  }
}

export class TableField extends Field {
  constructor(dbName: string, tblName: string, fieldName: string, fieldType: string) {
    super(FieldType.TableField, dbName, tblName, fieldName, fieldType);
  }

  static fromObject(obj: any): TableField {
    return new TableField(obj.dbName, obj.tblName, obj.fieldName, obj.fieldType);
  }

  static default() {
    return new TableField('', '', '', '');
  }

  equals(obj: any): boolean {
    if (obj) {
      return this.dbName === obj.dbName && this.tblName === obj.tblName && this.fieldName === obj.fieldName && this.fieldType === obj.fieldType;
    } else {
      return false;
    }
  }

  isNested(): boolean {
    return this.tblName.includes('.');
  }
}

export class ViewField extends Field {
  viewName: string;

  get tblName(): string {
    return this.viewName;
  }

  set tblName(tblName: string) {
    this.viewName = tblName;
  }

  constructor(dbName: string, tblName: string, fieldName: string, fieldType: string) {
    super(FieldType.ViewField, dbName, tblName, fieldName, fieldType);
    this.viewName = tblName;
  }

  static fromObject(obj: any) {
    return new ViewField('', obj.viewName, obj.fieldName, obj.fieldType);
  }

  equals(obj: any): boolean {
    if (obj) {
      return this.viewName === obj.viewName && this.fieldName === obj.fieldName && this.fieldType === obj.fieldType;
    } else {
      return false;
    }
  }

  isNested(): boolean {
    return false;
  }
}

export class ExpressionField extends Field {
  expression: string;

  constructor(dbName: string, tblName: string, fieldName: string, fieldType: string, expression: string) {
    super(FieldType.ExpressionField, dbName, tblName, fieldName, fieldType);
    this.expression = expression;
  }

  static fromObject(obj: any): TableField {
    return new ExpressionField(obj.dbName, obj.tblName, obj.fieldName, obj.fieldType, obj.expression);
  }

  static default() {
    return new ExpressionField('', '', '', '', '');
  }

  equals(obj: any): boolean {
    if (obj) {
      return this.dbName === obj.dbName && this.tblName === obj.tblName && this.fieldName === obj.fieldName && this.fieldType === obj.fieldType;
    } else {
      return false;
    }
  }

  isNested(): boolean {
    return this.tblName.includes('.');
  }

  getDataType(): DataType {
    return DataType.Expression;
  }

  toColumn(): Column {
    return Column.fromObject({
      className: this.fieldType,
      name: this.tblName,
      displayName: this.fieldName,
      defaultExpression: new MaterializedExpression(this.expression)
    })!;
  }

  static isExpressionField(obj: any): obj is ExpressionField {
    return obj?.className === FieldType.ExpressionField;
  }
}

export class CalculationField extends Field {
  expression: string;

  constructor(dbName: string, tblName: string, fieldName: string, fieldType: string, expression: string) {
    super(FieldType.CalculatedField, dbName, tblName, fieldName, fieldType);
    this.expression = expression;
  }

  static fromObject(obj: any): TableField {
    return new CalculationField(obj.dbName, obj.tblName, obj.fieldName, obj.fieldType, obj.expression);
  }

  static default() {
    return new CalculationField('', '', '', '', '');
  }

  equals(obj: any): boolean {
    if (obj) {
      return this.dbName === obj.dbName && this.tblName === obj.tblName && this.fieldName === obj.fieldName && this.fieldType === obj.fieldType;
    } else {
      return false;
    }
  }

  isNested(): boolean {
    return this.tblName.includes('.');
  }

  toColumn(): Column {
    return Column.fromObject({
      className: this.fieldType,
      name: this.tblName,
      displayName: this.fieldName,
      defaultExpression: new MaterializedExpression(this.expression)
    })!;
  }

  static isCalculatedField(obj: any): obj is CalculationField {
    return obj?.className === FieldType.CalculatedField;
  }
}
