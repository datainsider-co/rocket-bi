import { KafkaStreamingJob } from '@core/data-ingestion';

export abstract class StreamingJobConfig {
  abstract isValidJob(): boolean;
  abstract getJob(): Promise<KafkaStreamingJob>;
  abstract initData(): void;
  abstract resetData(): void;
}
