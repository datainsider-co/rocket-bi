import { LakeJob } from './LakeJob';
import { JobId, OrgId } from '@core/common/domain';
import { TimeScheduler } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time/TimeScheduler';
import { LakeJobs } from '@core/lake-house/domain/lake-job/LakeJobs';
import { LakeJobStatus } from '@core/lake-house/domain/lake-job/LakeJobStatus';
import { LakeJobType } from '@core/lake-house/domain/lake-job/LakeJobType';
import { ResultOutput } from '@core/lake-house/domain/lake-job/output-info/ResultOutput';
import { SchedulerOnce } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time/SchedulerOnce';

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
