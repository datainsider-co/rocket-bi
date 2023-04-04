import { TableSchema } from '@core/common/domain';

export class EtlJobData {
  constructor(public tableSchema: TableSchema) {}

  static fromObject(obj: EtlJobData): EtlJobData {
    return new EtlJobData(TableSchema.fromObject(obj.tableSchema));
  }
}

export class ErrorPreviewETLData {
  constructor(public message: string, public errorTblName: string) {}

  static fromObject(obj: ErrorPreviewETLData): ErrorPreviewETLData {
    return new ErrorPreviewETLData(obj.message, obj.errorTblName);
  }
}
