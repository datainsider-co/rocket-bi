import { ObjectStringifierHeader } from '@core/common/misc/csv/Record';
import { CsvWriter } from '@core/common/misc/csv/CsvWriter';
import { CsvStringifierFactory } from '@core/common/misc/csv/stringifiers/CsvStringifierFactory';

export interface ArrayCsvWriterConfig {
  path: string;
  header?: string[];
  fieldDelimiter?: string;
  recordDelimiter?: string;
  alwaysQuote?: boolean;
  encoding?: string;
  append?: boolean;
}

export interface ObjectCsvWriterConfig {
  path: string;
  header: ObjectStringifierHeader;
  fieldDelimiter?: string;
  recordDelimiter?: string;
  headerIdDelimiter?: string;
  alwaysQuote?: boolean;
  encoding?: string;
  append?: boolean;
}

export class CsvWriterFactory {
  constructor(private readonly csvStringifierFactory: CsvStringifierFactory) {}

  createArrayCsvWriter(config: ArrayCsvWriterConfig) {
    const csvStringifier = this.csvStringifierFactory.createArrayCsvStringifier({
      header: config.header,
      fieldDelimiter: config.fieldDelimiter,
      recordDelimiter: config.recordDelimiter,
      alwaysQuote: config.alwaysQuote
    });
    return new CsvWriter(csvStringifier, config.path, config.encoding, config.append);
  }

  createObjectCsvWriter(config: ObjectCsvWriterConfig) {
    const csvStringifier = this.csvStringifierFactory.createObjectCsvStringifier({
      header: config.header,
      fieldDelimiter: config.fieldDelimiter,
      recordDelimiter: config.recordDelimiter,
      headerIdDelimiter: config.headerIdDelimiter,
      alwaysQuote: config.alwaysQuote
    });
    return new CsvWriter(csvStringifier, config.path, config.encoding, config.append);
  }
}
