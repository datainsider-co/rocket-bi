import { LakeJob } from '@core/LakeHouse/Domain/LakeJob/LakeJob';
import { UserProfile } from '@core/domain';

export class LakeJobResponse {
  job: LakeJob;
  creator: UserProfile;

  constructor(job: LakeJob, creator: UserProfile) {
    this.job = job;
    this.creator = creator;
  }

  static fromObject(obj: any): LakeJobResponse {
    const job = LakeJob.fromObject(obj.job);
    const creator = UserProfile.fromObject(obj.creator);
    return new LakeJobResponse(job, creator);
  }
}
