import { PartitionAndOffset } from '@core/DataIngestion';

export class StreamingStatusResponse {
  constructor(public topic: string, public totalMessages: number, public totalErrors: number, public offsets: PartitionAndOffset[]) {}

  static fromObject(obj: StreamingStatusResponse) {
    return new StreamingStatusResponse(
      obj.topic,
      obj.totalMessages,
      obj.totalErrors,
      obj.offsets.map(offset => PartitionAndOffset.fromObject(offset))
    );
  }
}
