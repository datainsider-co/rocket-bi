import { DestinationConfig, KafkaConfig } from '@core/DataIngestion';

export class CreateStreamingJobRequest {
  constructor(public name: string, public config: KafkaConfig, public destinationConfigs: DestinationConfig[]) {}
}
