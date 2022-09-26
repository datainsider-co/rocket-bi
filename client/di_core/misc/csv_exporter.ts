import { FilePart } from '@core/domain/Model/File/FilePart';
import { CsvWriterFactory } from '@core/misc/csv/csv_writer_factory';
import { CsvStringifierFactory } from '@core/misc/csv/stringifiers/csv_stringifier_factory';
import { Log } from '@core/utils';
export interface CsvConfig {
  delimiter: string;
}

export abstract class CsvExporter {
  protected constructor(protected progressCb?: (completedPercent: number, completed: number, total: number) => void) {}

  abstract run(): Promise<boolean>;

  onFileCompleted(file: FilePart): void {
    const csvWriterFactory = new CsvWriterFactory(new CsvStringifierFactory());
    const csvWriter = csvWriterFactory.createArrayCsvWriter({
      path: `${file.name}.csv`
    });

    csvWriter.writeRecords(file.lines).then(_ => {
      csvWriter.close();
    });
  }

  onProgress(completedPercent: number, completedRows: number, totalRows: number) {
    Log.debug(`Export Completed ${completedPercent}%: ${completedRows}/${totalRows} rows`);
    if (this.progressCb) {
      this.progressCb(completedPercent, completedRows, totalRows);
    }
  }
}
