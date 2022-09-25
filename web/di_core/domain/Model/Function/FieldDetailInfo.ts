import { Field, InlineSqlView } from '@core/domain/Model';

export class FieldDetailInfo {
  field: Field;
  displayName: string;
  name: string;
  isNested: boolean;
  isHidden: boolean;
  sqlView?: InlineSqlView;

  constructor(field: Field, name: string, displayName: string, isNested: boolean, isHidden?: boolean, sqlView?: InlineSqlView) {
    this.field = field;
    this.name = name;
    this.displayName = displayName;
    this.isNested = isNested;
    this.isHidden = isHidden || false;
    this.sqlView = sqlView;
  }

  static fromObject(obj: any): FieldDetailInfo {
    const sqlView = obj.sqlView ? InlineSqlView.fromObject(obj.sqlView) : void 0;
    return new FieldDetailInfo(obj.field, obj.name, obj.displayName, obj.isNested, obj.isHidden, sqlView);
  }
}
