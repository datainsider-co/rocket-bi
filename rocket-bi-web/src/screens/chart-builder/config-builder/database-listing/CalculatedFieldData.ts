/*
 * @author: tvc12 - Thien Vi
 * @created: 5/7/21, 2:17 PM
 */

import { Column, Expression, TableSchema } from '@core/common/domain/model';

export interface CreateFieldData {
  displayName: string;
  tableSchema: TableSchema;
  expression: Expression;
  description?: string;
}

export interface EditFieldData {
  displayName: string;
  newExpression: Expression;
  tableSchema: TableSchema;
  editingColumn: Column;
}

export interface DeleteFieldData {
  dbName: string;
  tblName: string;
  fieldName: string;
}

export enum CalculatedFieldModalMode {
  Create = 'create',
  Edit = 'edit'
}
