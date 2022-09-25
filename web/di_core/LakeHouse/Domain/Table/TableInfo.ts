/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 4:24 PM
 */

import { FieldInfo } from './FieldInfo';
import { TableSchema } from '@core/domain';

export enum ParseFailMode {
  Ignore = 0,
  DefaultValue = 1
}

export enum AccessType {
  Private = 0,
  Public = 1
}

export enum TableType {
  Static = 0,
  Dynamic = 1
}

export class TableInfo {
  constructor(
    public id: string,
    public tableName: string,
    public ownerId: string,
    public createTime: number,
    public lastAccessTime: number,
    public dataSource: string[],
    public schema: FieldInfo[],
    public delimiter: string,
    public parseFailMode: ParseFailMode,
    public description: string,
    public accessType: AccessType,
    public tableType: TableType,
    public windowSize: number,
    public timeStep: number
  ) {}

  static fromObject(obj: any): TableInfo {
    const schema = (obj.schema ?? []).map((schema: any) => FieldInfo.fromObject(schema));
    const sortedSchema = schema.sort((field1: FieldInfo, field2: FieldInfo) => field1.name.localeCompare(field2.name));
    return new TableInfo(
      obj.id,
      obj.tableName,
      obj.ownerId,
      obj.createTime,
      obj.lastAccessTime,
      obj.dataSource,
      sortedSchema,
      obj.delimiter,
      obj.parseFailMode,
      obj.description,
      obj.accessType,
      obj.tableType,
      obj.windowSize,
      obj.timeStep
    );
  }

  static empty(): TableInfo {
    return TableInfo.fromObject({
      tableName: '',
      description: '',
      dataSource: [],
      accessType: AccessType.Private,
      parseFailMode: ParseFailMode.DefaultValue
    });
  }
}
