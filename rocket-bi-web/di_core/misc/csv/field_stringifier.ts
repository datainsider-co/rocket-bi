import { Field } from '@core/misc/csv/record';

const DEFAULT_FIELD_DELIMITER = ',';
const VALID_FIELD_DELIMITERS = [',', ';'];

export abstract class FieldStringifier {
  constructor(public readonly fieldDelimiter: string) {}

  abstract stringify(value?: Field): string;

  protected isEmpty(value?: Field): boolean {
    return value ? false : true;
  }

  protected quoteField(field: string): string {
    return `"${field.replace(/"/g, '""')}"`;
  }

  static validateFieldDelimiter(delimiter: string): void {
    if (VALID_FIELD_DELIMITERS.indexOf(delimiter) === -1) {
      throw new Error(`Invalid field delimiter \`${delimiter}\` is specified`);
    }
  }
}

class DefaultFieldStringifier extends FieldStringifier {
  stringify(value?: Field): string {
    if (this.isEmpty(value)) return '';
    const str = value.toString();
    return this.needsQuote(str) ? this.quoteField(str) : str;
  }

  private needsQuote(str: string): boolean {
    return str.includes(this.fieldDelimiter) || str.includes('\r') || str.includes('\n') || str.includes('"');
  }
}

class ForceQuoteFieldStringifier extends FieldStringifier {
  stringify(value?: Field): string {
    return this.isEmpty(value) ? '' : this.quoteField(value.toString());
  }
}

export function createFieldStringifier(fieldDelimiter: string = DEFAULT_FIELD_DELIMITER, alwaysQuote = false) {
  FieldStringifier.validateFieldDelimiter(fieldDelimiter);
  return alwaysQuote ? new ForceQuoteFieldStringifier(fieldDelimiter) : new DefaultFieldStringifier(fieldDelimiter);
}
