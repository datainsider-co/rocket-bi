import { LakeJob } from './LakeJob';
import { JobId, OrgId } from '@core/domain';
import { LakeJobType } from '@core/LakeHouse/Domain/LakeJob/LakeJobType';
import { TimeScheduler } from '@/screens/DataIngestion/components/JobSchedulerForm/SchedulerTime/TimeScheduler';
import { BuildTool } from '@core/LakeHouse/Domain/LakeJob/BuildTool';
import { LakeJobs } from '@core/LakeHouse/Domain/LakeJob/LakeJobs';
import { LakeJobStatus } from '@core/LakeHouse/Domain/LakeJob/LakeJobStatus';
import { GitCloneInfo } from '@core/LakeHouse/Domain/LakeJob/GitCloneInfo/GitCloneInfo';
import { SSHInfo } from '@core/LakeHouse/Domain/LakeJob/GitCloneInfo/SSHInfo';
import { SchedulerOnce } from '@/screens/DataIngestion/components/JobSchedulerForm/SchedulerTime/SchedulerOnce';

export class JavaJob extends LakeJob {
  className = LakeJobs.Java;
  jobType: LakeJobType = LakeJobType.Java;
  gitCloneInfo: GitCloneInfo;
  buildTool: BuildTool;
  buildCmd: string;

  constructor(
    orgId: OrgId,
    jobId: JobId,
    creatorId: string,
    name: string,
    lastRunTime: number,
    nextRunTime: number,
    lastRunStatus: LakeJobStatus,
    currentJobStatus: LakeJobStatus,
    scheduleTime: TimeScheduler,
    gitCloneInfo: GitCloneInfo,
    buildTool: BuildTool,
    buildCmd: string
  ) {
    super(orgId, jobId, creatorId, name, lastRunTime, nextRunTime, lastRunStatus, currentJobStatus, scheduleTime);
    this.orgId = orgId;
    this.jobId = jobId;
    this.creatorId = creatorId;
    this.name = name;
    this.lastRunTime = lastRunTime;
    this.nextRunTime = nextRunTime;
    this.lastRunStatus = lastRunStatus;
    this.currentJobStatus = currentJobStatus;
    this.scheduleTime = scheduleTime;
    this.gitCloneInfo = gitCloneInfo;
    this.buildTool = buildTool;
    this.buildCmd = buildCmd;
  }

  static default(): JavaJob {
    return new JavaJob(
      LakeJob.DEFAULT_ID,
      LakeJob.DEFAULT_ID,
      '',
      '',
      0,
      0,
      LakeJobStatus.Initialized,
      LakeJobStatus.Initialized,
      new SchedulerOnce(Date.now()),
      new SSHInfo('', ''),
      BuildTool.Maven,
      ''
    );
  }
  static fromObject(obj: any): JavaJob {
    const gitCloneInfo = GitCloneInfo.fromObject(obj.gitCloneInfo);
    return new JavaJob(
      obj.orgId,
      obj.jobId,
      obj.creatorId,
      obj.name,
      obj.lastRunTime,
      obj.nextRunTime,
      obj.lastRunStatus,
      obj.currentJobStatus,
      TimeScheduler.fromObject(obj.scheduleTime),
      gitCloneInfo,
      obj.buildTool,
      obj.buildCmd
    );
  }

  setGitCloneInfo(gitCloneInfo: GitCloneInfo) {
    this.gitCloneInfo = gitCloneInfo;
  }
}
