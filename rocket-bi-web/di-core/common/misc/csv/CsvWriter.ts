import { AbstractFileWriter, DownloadableFileWriter } from '@core/common/misc/csv/AbstractFileWriter';
import { CsvStringifier } from '@core/common/misc/csv/stringifiers/CsvStringifier';

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
