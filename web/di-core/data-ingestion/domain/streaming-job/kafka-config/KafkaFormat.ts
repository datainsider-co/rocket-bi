import { JSONFormat, KafkaFormats } from '@core/data-ingestion';
import { UnsupportedException } from '@core/common/domain/exception/UnsupportedException';

export abstract class KafkaFormat {
  abstract className: KafkaFormats;

  static fromObject(obj: KafkaFormat) {
    switch (obj.className) {
      case KafkaFormats.JSON:
        return JSONFormat.fromObject(obj as JSONFormat);
      default:
        throw new UnsupportedException(`Unsupported kafka format${obj.className}`);
    }
  }

  static isJSONFormat(kafkaFormat: KafkaFormat) {
    return kafkaFormat.className === KafkaFormats.JSON;
  }

  static default() {
    return new JSONFormat();
  }
}
