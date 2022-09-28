import { DestinationConfig, KafkaConfig } from '@core/DataIngestion';

export class KafkaStreamingJob {
  constructor(
    public id: number,
    public orgId: number,
    public name: string,
    public config: KafkaConfig,
    public destinationConfigs: DestinationConfig[],
    public createdAt?: number,
    public updatedAt?: number
  ) {}

  static fromObject(obj: KafkaStreamingJob) {
    return new KafkaStreamingJob(
      obj.id,
      obj.orgId,
      obj.name,
      KafkaConfig.fromObject(obj.config),
      obj.destinationConfigs.map(destConfig => DestinationConfig.fromObject(destConfig)),
      obj.createdAt,
      obj.updatedAt
    );
  }
  static default() {
    return new KafkaStreamingJob(-1, -1, '', KafkaConfig.default(), [DestinationConfig.default()]);
  }
}
