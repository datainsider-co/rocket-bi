import { ObjectStringifierHeader } from '@core/misc/csv/record';
import { createFieldStringifier } from '@core/misc/csv/field_stringifier';
import { ArrayCsvStringifier } from '@core/misc/csv/stringifiers/array_stringifier';
import { ObjectCsvStringifier } from '@core/misc/csv/stringifiers/object_stringifier';

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
