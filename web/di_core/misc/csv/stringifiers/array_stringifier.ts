import { CsvStringifier } from '@core/misc/csv/stringifiers/csv_stringifier';
import { Field } from '@core/misc/csv/record';
import { FieldStringifier } from '@core/misc/csv/field_stringifier';

export class ArrayCsvStringifier extends CsvStringifier<Field[]> {
  constructor(fieldStringifier: FieldStringifier, recordDelimiter?: string, private readonly header?: string[]) {
    super(fieldStringifier, recordDelimiter);
  }

  protected getHeaderRecord() {
    return this.header;
  }

  protected getRecordAsArray(record: Field[]): Field[] {
    return record;
  }
}
