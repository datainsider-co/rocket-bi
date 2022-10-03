import { LakeJob } from './LakeJob';
import { JobId, OrgId } from '@core/common/domain';
import { TimeScheduler } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time/TimeScheduler';
import { LakeJobs } from '@core/lake-house/domain/lake-job/LakeJobs';
import { LakeJobStatus } from '@core/lake-house/domain/lake-job/LakeJobStatus';
import { LakeJobType } from '@core/lake-house/domain/lake-job/LakeJobType';

export class UnsupportedLakeJob extends LakeJob {
  className = LakeJobs.Unsupported;
  jobType: LakeJobType = LakeJobType.Others;

  constructor(
    orgId: OrgId,
    jobId: JobId,
    creatorId: string,
    name: string,
    lastRunTime: number,
    nextRunTime: number,
    lastSyncStatus: LakeJobStatus,
    currentJobStatus: LakeJobStatus,
    scheduleTime: TimeScheduler
  ) {
    super(orgId, jobId, creatorId, name, lastRunTime, nextRunTime, lastSyncStatus, currentJobStatus, scheduleTime);
  }

  static fromObject(obj: any): UnsupportedLakeJob {
    return new UnsupportedLakeJob(
      obj.orgId,
      obj.jobId,
      obj.creatorId,
      obj.name,
      obj.lastRunTime,
      obj.nextRunTime,
      obj.lastRunStatus,
      obj.currentJobStatus,
      TimeScheduler.fromObject(obj.scheduleTime)
    );
  }
}
