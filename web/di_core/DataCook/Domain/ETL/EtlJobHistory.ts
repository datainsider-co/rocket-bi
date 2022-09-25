import { EtlJobInfo, EtlJobStatus } from '@core/DataCook';

export class EtlJobHistory {
  constructor(
    public id: number,
    public etlJobId: number,
    public updatedTime: number,
    public totalExecutionTime: number,
    public status: EtlJobStatus,
    public totalRowsInserted: number,
    public message: string,
    public etlInfo: EtlJobInfo | null
  ) {}

  get totalExecutionTimeInSeconds() {
    return (this.totalExecutionTime ?? 0) / 1000;
  }

  static fromObject(obj: EtlJobHistory): EtlJobHistory {
    return new EtlJobHistory(
      obj.id,
      obj.etlJobId,
      obj.updatedTime,
      obj.totalExecutionTime,
      obj.status,
      obj.totalRowsInserted,
      obj.message,
      obj.etlInfo ? EtlJobInfo.fromObject(obj.etlInfo) : null
    );
  }
}
