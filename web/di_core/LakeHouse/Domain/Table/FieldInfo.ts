/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 4:34 PM
 */

import { LakeFieldType } from '../Response/TableResponse/FieldMappingInfo';

export class FieldInfo {
  constructor(
    public position: string,
    public name: string,
    public type: LakeFieldType,
    public desc: string,
    public defaultValue: string,
    public isDate: boolean
  ) {}

  static fromObject(obj: any): FieldInfo {
    return new FieldInfo(obj.position, obj.name, obj.type, obj.desc, obj.defaultValue, obj.isDate);
  }
}
