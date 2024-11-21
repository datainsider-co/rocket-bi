import { TableSchema } from '@core/common/domain';

export class PreviewResponse {
  tableSchema: TableSchema;
  records: any[][];
  constructor(schema: TableSchema, records: any[][]) {
    this.tableSchema = schema;
    this.records = records;
  }
  static fromObject(obj: PreviewResponse) {
    const schema = TableSchema.fromObject(obj.tableSchema);
    return new PreviewResponse(schema, obj.records);
  }

  static empty(): PreviewResponse {
    return new PreviewResponse(TableSchema.empty(), []);
  }
}
