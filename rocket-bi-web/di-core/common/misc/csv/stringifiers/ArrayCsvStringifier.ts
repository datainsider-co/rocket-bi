import { CsvStringifier } from '@core/common/misc/csv/stringifiers/CsvStringifier';
import { Field } from '@core/common/misc/csv/Record';
import { FieldStringifier } from '@core/common/misc/csv/FieldStringifier';

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
