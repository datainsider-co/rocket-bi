import { FileConfig, FileConfigType } from '@core/data-ingestion/domain/job/FileConfig';
import { Log } from '@core/utils';

export class CSVFileConfig extends FileConfig {
  className: FileConfigType = FileConfigType.CSVConfig;
  skipRows: number;
  delimiter: string;
  fileExtensions: string[];
  includeHeader: boolean;

  constructor(skipRows: number, separator: string, fileExtensions: string[], includeHeader: boolean) {
    super();
    this.skipRows = skipRows;
    this.delimiter = separator;
    this.fileExtensions = fileExtensions;
    this.includeHeader = includeHeader;
  }

  static fromObject(obj: CSVFileConfig): CSVFileConfig {
    return new CSVFileConfig(obj.skipRows, obj.delimiter, obj.fileExtensions, obj.includeHeader);
  }

  static default(): CSVFileConfig {
    return new CSVFileConfig(0, ',', ['csv', 'txt'], true);
  }

  get separator(): string {
    return this.delimiter;
  }

  set separator(value: string) {
    this.delimiter = value;
  }

  get useFirstRowAsHeader(): boolean {
    return this.includeHeader;
  }

  set useFirstRowAsHeader(enabled: boolean) {
    this.includeHeader = enabled;
  }
}
