import { DestinationConfig, KafkaConfig } from '@core/data-ingestion';

export class CreateStreamingJobRequest {
  constructor(public name: string, public config: KafkaConfig, public destinationConfigs: DestinationConfig[]) {}
}
