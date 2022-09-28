import { AbstractFileWriter, DownloadableFileWriter } from '@core/misc/csv/file_writer';
import { CsvStringifier } from '@core/misc/csv/stringifiers/csv_stringifier';

export class CsvWriter<T> {
  private readonly fileWriter: AbstractFileWriter;

  constructor(private readonly csvStringifier: CsvStringifier<T>, path: string, encoding?: string, private append = false) {
    this.fileWriter = new DownloadableFileWriter(path, this.append, encoding);
  }

  async writeRecords(records: T[]): Promise<void> {
    const recordsString = this.csvStringifier.stringifyRecords(records);
    const writeString = this.headerString + recordsString;
    await this.fileWriter.write(writeString);
    this.append = true;
  }

  private get headerString(): string {
    const headerString = !this.append && this.csvStringifier.getHeaderString();
    return headerString || '';
  }

  close() {
    this.fileWriter.close();
  }
}
