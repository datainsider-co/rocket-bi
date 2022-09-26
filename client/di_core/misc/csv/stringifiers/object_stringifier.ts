import { CsvStringifier } from '@core/misc/csv/stringifiers/csv_stringifier';
import { Field, isObject, ObjectHeaderItem, ObjectRecord, ObjectStringifierHeader } from '@core/misc/csv/record';
import { FieldStringifier } from '@core/misc/csv/field_stringifier';

export class ObjectCsvStringifier extends CsvStringifier<ObjectRecord<Field>> {
  constructor(
    fieldStringifier: FieldStringifier,
    private readonly header: ObjectStringifierHeader,
    recordDelimiter?: string,
    private readonly headerIdDelimiter?: string
  ) {
    super(fieldStringifier, recordDelimiter);
  }

  protected getHeaderRecord(): string[] | null {
    if (!this.isObjectHeader) return null;
    return (this.header as ObjectHeaderItem[]).map(field => field.title);
  }

  protected getRecordAsArray(record: ObjectRecord<Field>): Field[] {
    return this.fieldIds.map(fieldId => this.getNestedValue(record, fieldId));
  }

  private getNestedValue(obj: ObjectRecord<Field>, key: string) {
    if (!this.headerIdDelimiter) return obj[key];
    return key.split(this.headerIdDelimiter).reduce((subObj, keyPart) => (subObj || {})[keyPart], obj);
  }

  private get fieldIds(): string[] {
    return this.isObjectHeader ? (this.header as ObjectHeaderItem[]).map(column => column.id) : (this.header as string[]);
  }

  private get isObjectHeader(): boolean {
    return isObject(this.header && this.header[0]);
  }
}
