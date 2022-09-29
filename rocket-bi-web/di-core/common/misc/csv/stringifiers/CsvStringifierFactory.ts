import { ObjectStringifierHeader } from '@core/common/misc/csv/Record';
import { createFieldStringifier } from '@core/common/misc/csv/FieldStringifier';
import { ArrayCsvStringifier } from '@core/common/misc/csv/stringifiers/ArrayCsvStringifier';
import { ObjectCsvStringifier } from '@core/common/misc/csv/stringifiers/ObjectCsvStringifier';

export interface ArrayCsvStringifierConfig {
  header?: string[];
  fieldDelimiter?: string;
  recordDelimiter?: string;
  alwaysQuote?: boolean;
}

export interface ObjectCsvStringifierConfig {
  header: ObjectStringifierHeader;
  fieldDelimiter?: string;
  recordDelimiter?: string;
  headerIdDelimiter?: string;
  alwaysQuote?: boolean;
}

export class CsvStringifierFactory {
  createArrayCsvStringifier(config: ArrayCsvStringifierConfig) {
    const fieldStringifier = createFieldStringifier(config.fieldDelimiter, config.alwaysQuote);
    return new ArrayCsvStringifier(fieldStringifier, config.recordDelimiter, config.header);
  }

  createObjectCsvStringifier(config: ObjectCsvStringifierConfig) {
    const fieldStringifier = createFieldStringifier(config.fieldDelimiter, config.alwaysQuote);
    return new ObjectCsvStringifier(fieldStringifier, config.header, config.recordDelimiter, config.headerIdDelimiter);
  }
}
