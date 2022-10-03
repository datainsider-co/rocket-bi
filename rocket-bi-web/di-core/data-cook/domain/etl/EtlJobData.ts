import { TableSchema } from '@core/common/domain';

export class EtlJobData {
  constructor(public tableSchema: TableSchema) {}

  static fromObject(obj: EtlJobData): EtlJobData {
    return new EtlJobData(TableSchema.fromObject(obj.tableSchema));
  }
}

export class EtlJobError {
  constructor(public message: string, public tableError: string) {}

  static fromObject(obj: EtlJobError): EtlJobError {
    return new EtlJobError(obj.message, obj.tableError);
  }
}
