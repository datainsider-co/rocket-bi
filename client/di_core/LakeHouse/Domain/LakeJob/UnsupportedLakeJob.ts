import { LakeJob } from './LakeJob';
import { JobId, OrgId } from '@core/domain';
import { TimeScheduler } from '@/screens/DataIngestion/components/JobSchedulerForm/SchedulerTime/TimeScheduler';
import { LakeJobs } from '@core/LakeHouse/Domain/LakeJob/LakeJobs';
import { LakeJobStatus } from '@core/LakeHouse/Domain/LakeJob/LakeJobStatus';
import { LakeJobType } from '@core/LakeHouse/Domain/LakeJob/LakeJobType';

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
