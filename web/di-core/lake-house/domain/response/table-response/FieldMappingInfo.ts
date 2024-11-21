/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 4:50 PM
 */

export enum LakeFieldType {
  Short = 'short',
  Int = 'integer',
  Long = 'long',
  Float = 'float',
  Double = 'double',
  Boolean = 'boolean',
  String = 'string',
  Date = 'date',
  DateTime = 'datetime'
}

export class FieldMappingInfo {
  constructor(public position: string, public name: string, public type: LakeFieldType, public sampleData: string[], public isHidden = false) {}

  static fromObject(obj: any) {
    return new FieldMappingInfo(obj.position, obj.name, obj.type, obj.sampleData, obj.isHidden);
  }
}
