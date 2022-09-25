import { LakeJob } from './LakeJob';
import { JobId, OrgId } from '@core/domain';
import { TimeScheduler } from '@/screens/DataIngestion/components/JobSchedulerForm/SchedulerTime/TimeScheduler';
import { LakeJobs } from '@core/LakeHouse/Domain/LakeJob/LakeJobs';
import { LakeJobStatus } from '@core/LakeHouse/Domain/LakeJob/LakeJobStatus';
import { LakeJobType } from '@core/LakeHouse/Domain/LakeJob/LakeJobType';
import { ResultOutput } from '@core/LakeHouse/Domain/LakeJob/OutputInfo/ResultOutput';
import { SchedulerOnce } from '@/screens/DataIngestion/components/JobSchedulerForm/SchedulerTime/SchedulerOnce';

export class SQLJob extends LakeJob {
  className = LakeJobs.SQL;
  jobType: LakeJobType = LakeJobType.SQL;
  query: string;
  outputs: ResultOutput[];

  constructor(
    orgId: OrgId,
    jobId: JobId,
    creatorId: string,
    name: string,
    lastRunTime: number,
    nextRunTime: number,
    lastSyncStatus: LakeJobStatus,
    currentJobStatus: LakeJobStatus,
    scheduleTime: TimeScheduler,
    query: string,
    outputs: ResultOutput[]
  ) {
    super(orgId, jobId, creatorId, name, lastRunTime, nextRunTime, lastSyncStatus, currentJobStatus, scheduleTime);
    this.query = query;
    this.outputs = outputs;
  }

  static create(query: string): SQLJob {
    return new SQLJob(
      LakeJob.DEFAULT_ID,
      LakeJob.DEFAULT_ID,
      '',
      '',
      0,
      0,
      LakeJobStatus.Initialized,
      LakeJobStatus.Initialized,
      new SchedulerOnce(Date.now()),
      query,
      []
    );
  }

  static fromObject(obj: any): SQLJob {
    return new SQLJob(
      obj.orgId,
      obj.jobId,
      obj.creatorId,
      obj.name,
      obj.lastRunTime,
      obj.nextRunTime,
      obj.lastRunStatus,
      obj.currentJobStatus,
      TimeScheduler.fromObject(obj.scheduleTime),
      obj.query,
      obj.outputs
    );
  }
}
