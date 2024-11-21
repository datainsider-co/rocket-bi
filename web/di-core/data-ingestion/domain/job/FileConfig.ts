import { CSVFileConfig } from '@core/data-ingestion';
import { DIException } from '@core/common/domain';
import { Log } from '@core/utils';

export enum FileConfigType {
  CSVConfig = 'csv_config'
}

export abstract class FileConfig {
  abstract className: FileConfigType;

  static fromObject(obj: FileConfig): FileConfig {
    switch (obj.className) {
      case FileConfigType.CSVConfig:
        return CSVFileConfig.fromObject(obj as CSVFileConfig);
      default: {
        Log.error(`FileConfigType:: ${obj.className} not supported`);
        throw new DIException('File config not supported');
      }
    }
  }

  abstract get separator(): string;

  abstract set separator(value: string);

  abstract get useFirstRowAsHeader(): boolean;

  abstract set useFirstRowAsHeader(enabled: boolean);

  abstract get skipRows(): number;

  abstract set skipRows(value: number);
}
