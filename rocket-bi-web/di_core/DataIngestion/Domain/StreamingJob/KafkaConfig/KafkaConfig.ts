import { TableSchema } from '@core/domain';
import { DeserializerType, KafkaFormat } from '@core/DataIngestion';

export class KafkaConfig {
  constructor(
    public topic: string,
    public keyDeserializer: DeserializerType,
    public valueDeserializer: DeserializerType,
    public bootstrapServers: string,
    public format: KafkaFormat,
    public tableSchema: TableSchema
  ) {}

  static fromObject(obj: KafkaConfig) {
    return new KafkaConfig(
      obj.topic,
      obj.keyDeserializer,
      obj.valueDeserializer,
      obj.bootstrapServers,
      KafkaFormat.fromObject(obj.format),
      TableSchema.fromObject(obj.tableSchema)
    );
  }

  static default(): KafkaConfig {
    return new KafkaConfig('', DeserializerType.String, DeserializerType.String, '', KafkaFormat.default(), TableSchema.empty());
  }

  setTableSchema(tableSchema: TableSchema) {
    this.tableSchema = tableSchema;
  }
}
