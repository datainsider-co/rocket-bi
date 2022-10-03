/*
 * @author: tvc12 - Thien Vi
 * @created: 11/15/21, 2:42 PM
 */

import { DatabaseSchema, TableSchema, TableType } from '../../common/domain/model/schema';
import { FieldInfo, TableInfo } from '../domain/table';
import { BoolColumn, Column, DoubleColumn, FloatColumn, Int16Column, Int32Column, Int64Column, StringColumn } from '../../common/domain/model';
import { LakeFieldType } from '../domain/response/table-response';
import { GroupTableResponse } from '../../common/domain/response/query/GroupTableResponse';
import { HeaderData, RowData } from '@/shared/models';
import { CheckQueryResponse } from '../domain/response/query-response/CheckQueryResponse';

export class LakeHouseSchemaUtils {
  static readonly LAKE_DATABASE_NAME = 'lake_house_database';
  static readonly DEFAULT_ORG_ID = 0;

  static readonly displayTypeAsMap = new Map([
    [LakeFieldType.Boolean, 'Boolean'],
    [LakeFieldType.Double, 'Double'],
    [LakeFieldType.Float, 'Float'],
    [LakeFieldType.Int, 'Integer'],
    [LakeFieldType.Long, 'Long'],
    [LakeFieldType.Short, 'Short'],
    [LakeFieldType.String, 'String'],
    [LakeFieldType.Date, 'Date'],
    [LakeFieldType.DateTime, 'DateTime']
  ]);

  static buildLakeDatabase(tables: TableInfo[]) {
    return new DatabaseSchema(LakeHouseSchemaUtils.LAKE_DATABASE_NAME, 0, 'Lake House', LakeHouseSchemaUtils.toTableSchemas(tables));
  }

  static toTableResponse(outputFields: string[], data: string[][], total: number): GroupTableResponse {
    const headers: HeaderData[] = LakeHouseSchemaUtils.toHeaders(outputFields);
    const records: RowData[] = LakeHouseSchemaUtils.toRows(data);
    return new GroupTableResponse(headers, records, [], total);
  }

  static toPreviewLakeSchema(tableInfo: TableInfo, response: CheckQueryResponse): GroupTableResponse {
    const table = LakeHouseSchemaUtils.toTableResponse(response.outputFields, response.data, response.total);

    return new GroupTableResponse(LakeHouseSchemaUtils.enhancePreviewHeader(tableInfo, table.headers), table.records, [], table.total);
  }

  private static enhancePreviewHeader(tableInfo: TableInfo, headers: HeaderData[]): HeaderData[] {
    // Map<HeaderName, Type>
    const mapHeaderType: Map<string, LakeFieldType> = new Map<string, LakeFieldType>(tableInfo.schema.map(schema => [schema.name, schema.type]));
    return headers.map((header, index) => {
      const headerType = mapHeaderType.get(header.label)!;
      const notFormat = headerType === LakeFieldType.String;
      return {
        ...header,
        children: [
          {
            key: index.toString(),
            label: this.getDisplayNameOfType(headerType),
            isGroupBy: notFormat
          }
        ]
      };
    });
  }

  static getDisplayNameOfType(fieldType: LakeFieldType, defaultType = 'String') {
    return LakeHouseSchemaUtils.displayTypeAsMap.get(fieldType) ?? defaultType;
  }

  private static toTableSchemas(tables: TableInfo[]): TableSchema[] {
    return tables.map(
      table =>
        new TableSchema(
          table.tableName,
          LakeHouseSchemaUtils.LAKE_DATABASE_NAME,
          LakeHouseSchemaUtils.DEFAULT_ORG_ID,
          table.tableName,
          LakeHouseSchemaUtils.toColumns(table.schema),
          TableType.Default
        )
    );
  }

  private static toColumns(fields: FieldInfo[]): Column[] {
    return fields.map(field => {
      switch (field.type) {
        case LakeFieldType.Boolean:
          return new BoolColumn(field.name, field.name, true, false, false, '', field.defaultValue as any);
        case LakeFieldType.Double:
          return new DoubleColumn(field.name, field.name, true, false, false, '', field.defaultValue as any);
        case LakeFieldType.Float:
          return new FloatColumn(field.name, field.name, true, false, false, '', field.defaultValue as any);
        case LakeFieldType.Int:
          return new Int32Column(field.name, field.name, true, false, false, '', field.defaultValue as any);
        case LakeFieldType.Long:
          return new Int64Column(field.name, field.name, true, false, false, '', field.defaultValue as any);
        case LakeFieldType.Short:
          return new Int16Column(field.name, field.name, true, false, false, '', field.defaultValue as any);
        default:
          return new StringColumn(field.name, field.name, true, false, false, '', field.defaultValue as any);
      }
    });
  }

  /**
   * Create headers from output fields, with key is index of field
   */
  static toHeaders(outputFields: string[]): HeaderData[] {
    return outputFields.map((field, index) => {
      return {
        key: index.toString(),
        label: field
      };
    });
  }

  /**
   * Create row from data with key is index
   */
  static toRows(data: string[][]): RowData[] {
    return data.map(items => {
      const row: RowData = {
        children: [],
        depth: 0,
        isExpanded: false
      };
      items.forEach((value, index) => {
        row[index.toString()] = value;
      });
      return row;
    });
  }
}
