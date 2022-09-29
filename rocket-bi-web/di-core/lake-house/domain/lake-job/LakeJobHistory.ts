import { LakeJobStatus } from '@core/lake-house/domain/lake-job/LakeJobStatus';

export class LakeJobHistory {
  constructor(
    public runId: number,
    public jobId: number,
    public jobName: string,
    public startTime: number,
    public updatedTime: number,
    public endTime: number,
    public jobStatus: LakeJobStatus,
    public message: string,
    public logPath?: string
  ) {}

  get totalRuntime(): number {
    const totalRunTime = this.updatedTime - this.startTime;
    return totalRunTime > 0 ? totalRunTime : 0;
  }

  static fromObject(obj: any) {
    return new LakeJobHistory(obj.runId, obj.jobId, obj.jobName, obj.startTime, obj.updatedTime, obj.endTime, obj.jobStatus, obj.message, obj.logPath);
  }
}
