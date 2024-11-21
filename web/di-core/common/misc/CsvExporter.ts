import { FilePart } from '@core/common/domain/model/file/FilePart';
import { CsvWriterFactory } from '@core/common/misc/csv/CsvWriterFactory';
import { CsvStringifierFactory } from '@core/common/misc/csv/stringifiers/CsvStringifierFactory';
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
