import { JobId, OrgId } from '@core/common/domain';
import { LakeJobType } from '@core/lake-house/domain/lake-job/LakeJobType';
import { TimeScheduler } from '@/screens/data-ingestion/components/job-scheduler-form/scheduler-time/TimeScheduler';
import { LakeJobs } from '@core/lake-house/domain/lake-job/LakeJobs';
import { LakeJobStatus } from '@core/lake-house/domain/lake-job/LakeJobStatus';
import { UnsupportedException } from '@core/common/domain/exception/UnsupportedException';
import { JavaJob, SQLJob, UnsupportedLakeJob } from '@core/lake-house';
import { Log } from '@core/utils';
import { SchedulerName } from '@/shared/enums/SchedulerName';

export abstract class LakeJob {
  static DEFAULT_ID = -1;

  abstract className: LakeJobs;
  abstract jobType: LakeJobType;
  orgId: OrgId;
  jobId: JobId;
  creatorId: string;
  name: string;
  lastRunTime: number;
  nextRunTime: number;
  lastRunStatus: LakeJobStatus;
  currentJobStatus: LakeJobStatus;
  scheduleTime: TimeScheduler;

  protected constructor(
    orgId: OrgId,
    jobId: JobId,
    creatorId: string,
    name: string,
    lastRunTime: number,
    nextRunTime: number,
    lastRunStatus: LakeJobStatus,
    currentJobStatus: LakeJobStatus,
    scheduleTime: TimeScheduler
  ) {
    this.orgId = orgId;
    this.jobId = jobId;
    this.creatorId = creatorId;
    this.name = name;
    this.lastRunTime = lastRunTime;
    this.nextRunTime = nextRunTime;
    this.lastRunStatus = lastRunStatus;
    this.currentJobStatus = currentJobStatus;
    this.scheduleTime = scheduleTime;
  }

  get lastRunStatusIcon() {
    return LakeJob.getIconFromStatus(this.lastRunStatus);
  }

  get currentRunStatusIcon() {
    return LakeJob.getIconFromStatus(this.currentJobStatus);
  }

  static getIconFromStatus(status: LakeJobStatus) {
    const baseUrl = 'assets/icon/data_ingestion/status';
    switch (status) {
      case LakeJobStatus.Error:
        return require(`@/${baseUrl}/error.svg`);
      case LakeJobStatus.Initialized:
        return require(`@/${baseUrl}/initialized.svg`);
      case LakeJobStatus.Queued:
        return require(`@/${baseUrl}/queued.svg`);
      case LakeJobStatus.Finished:
        return require(`@/${baseUrl}/synced.svg`);
      case LakeJobStatus.Running:
      case LakeJobStatus.Compiling:
        return require(`@/${baseUrl}/syncing.svg`);

      case LakeJobStatus.Canceled:
      case LakeJobStatus.Terminated:
        return require(`@/${baseUrl}/terminated.svg`);
      default:
        return require(`@/${baseUrl}/unknown.svg`);
    }
  }

  get wasRun() {
    return this.lastRunTime > 0;
  }

  get isRunning() {
    return this.currentJobStatus === LakeJobStatus.Running;
  }

  get isQueued() {
    return this.currentJobStatus === LakeJobStatus.Queued;
  }

  get isCompiling() {
    return this.currentJobStatus === LakeJobStatus.Compiling;
  }

  get canCancel() {
    return this.isRunning || this.isCompiling || this.isQueued;
  }

  get isCreate() {
    return this.jobId === LakeJob.DEFAULT_ID;
  }

  get hasNextRunTime() {
    if (this.scheduleTime.className === SchedulerName.Once) {
      switch (this.currentJobStatus) {
        case LakeJobStatus.Initialized:
        case LakeJobStatus.Queued:
          return true;
        default:
          return false;
      }
    } else {
      return true;
    }
  }

  static fromObject(obj: any): LakeJob {
    switch (obj.className as LakeJobs) {
      case LakeJobs.Java:
        return JavaJob.fromObject(obj);
      case LakeJobs.SQL:
        return SQLJob.fromObject(obj);
      default:
        return UnsupportedLakeJob.fromObject(obj);
    }
  }
}
