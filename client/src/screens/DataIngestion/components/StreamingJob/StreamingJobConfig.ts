import { KafkaStreamingJob } from '@core/DataIngestion';

export abstract class StreamingJobConfig {
  abstract isValidJob(): boolean;
  abstract getJob(): Promise<KafkaStreamingJob>;
  abstract initData(): void;
  abstract resetData(): void;
}
