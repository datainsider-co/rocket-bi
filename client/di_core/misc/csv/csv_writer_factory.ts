import { ObjectStringifierHeader } from '@core/misc/csv/record';
import { CsvWriter } from '@core/misc/csv/csv_writer';
import { CsvStringifierFactory } from '@core/misc/csv/stringifiers/csv_stringifier_factory';

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
