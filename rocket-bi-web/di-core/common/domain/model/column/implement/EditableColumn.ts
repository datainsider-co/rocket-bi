/*
 * @author: tvc12 - Thien Vi
 * @created: 5/29/21, 4:33 PM
 */

import { GenericColumn } from '@core/common/domain/model/column/implement/GenericColumn';

export class EditableColumn {
  column: GenericColumn;
  value: any;

  constructor(column: GenericColumn, value: any) {
    this.column = column || {};
    this.value = value || '';
  }

  static fromObject(obj: any): EditableColumn {
    return new EditableColumn(obj.column, obj.value);
  }
}
