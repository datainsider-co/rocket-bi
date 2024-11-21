import { FilePart } from '@core/common/domain/model/file/FilePart';
import { CsvData } from '@core/common/domain/response/Page';
import { DownloadDataConfig } from '@core/common/domain/model/file/DownloadDataConfig';

export class CsvDownloader {
  private partNumber = 0;
  private totalFiles = 0;

  constructor(
    private option: DownloadDataConfig,
    private getData: (request: any, from: number, size: number) => Promise<CsvData>,
    private onFileCompleted: (file: FilePart) => void,
    private onProgress?: (completedPercent: number, completed: number, total: number) => void
  ) {}

  async start(): Promise<boolean> {
    const batchSize = this.option.batchSize ?? 100;

    let from = this.option.from ?? 0;

    let csvData = new CsvData([], 0, []);
    let filePart = this.createNewFilePart();
    try {
      do {
        csvData = await this.getData(this.option.request, from, batchSize);
        this.appendDataToFilePart(filePart, csvData);
        if (filePart.isCompleted(this.option.maxSizeInBytes)) {
          filePart = this.flushCompletedFilePart(filePart);
        }
        from = from + csvData.records.length;
        this.updateProgress(from, csvData.total);
      } while (csvData.records.length > 0);

      this.flushFilePart(filePart);
      return true;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      this.flushFilePart(filePart);
      return false;
    } finally {
      this.updateProgress(from, csvData.total);
    }
  }

  private appendDataToFilePart(filePart: FilePart, csvData: CsvData) {
    if (!filePart.hasData()) {
      filePart.addLines([csvData.headers]);
    }
    filePart.addLines(csvData.records);
  }

  private flushCompletedFilePart(filePart: FilePart): FilePart {
    this.flushFilePart(filePart);
    return this.createNewFilePart();
  }

  private flushFilePart(filePart: FilePart): void {
    if (filePart.hasData()) {
      this.onFileCompleted(filePart);
      this.totalFiles += 1;
    }
  }

  private createNewFilePart(): FilePart {
    this.partNumber += 1;
    return new FilePart(`${this.option.name}_Part_${this.partNumber}`);
  }

  private updateProgress(completed: number, total: number) {
    const percent = total ? (completed * 100) / total : 0;

    if (this.onProgress) {
      this.onProgress(percent, completed, total);
    }
  }
}
