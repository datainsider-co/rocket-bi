import { KafkaStreamingJob } from '@core/data-ingestion';
import { UserProfile } from '@core/common/domain';

export class StreamingJobResponse {
  constructor(public job: KafkaStreamingJob, public creator: UserProfile) {}
  static fromObject(obj: StreamingJobResponse) {
    return new StreamingJobResponse(KafkaStreamingJob.fromObject(obj.job), obj.creator ? UserProfile.fromObject(obj.creator) : UserProfile.unknown());
  }
}
