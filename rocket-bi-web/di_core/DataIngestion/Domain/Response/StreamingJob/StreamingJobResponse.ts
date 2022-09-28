import { KafkaStreamingJob } from '@core/DataIngestion';
import { UserProfile } from '@core/domain';

export class StreamingJobResponse {
  constructor(public job: KafkaStreamingJob, public creator: UserProfile) {}
  static fromObject(obj: StreamingJobResponse) {
    return new StreamingJobResponse(KafkaStreamingJob.fromObject(obj.job), obj.creator ? UserProfile.fromObject(obj.creator) : UserProfile.unknown());
  }
}
