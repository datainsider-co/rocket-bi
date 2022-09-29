import { PartitionAndOffset } from '@core/data-ingestion';

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
