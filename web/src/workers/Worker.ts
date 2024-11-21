/* eslint-disable no-console */
import * as Comlink from 'comlink';

// Warning: Support load file with absolute path or alias absolute path to file
// Support import {File} from 'worker-plugin/loader?name=foo&esModule!./foo'
import { JsonUtils } from '@core/utils/JsonUtils';
import { FilePart } from '@core/common/domain/model/file/FilePart';
import { CsvData } from '@core/common/domain/response/Page';
import { CsvDownloader } from '@/workers/CsvDownloader';
import { DownloadDataConfig } from '@core/common/domain/model/file/DownloadDataConfig';

export interface DIWorker {
  parseObject(data: string): Promise<any>;

  parsePureJson(data: string): Promise<any>;

  toJson(data: any): Promise<string>;

  downloadCsvData(
    option: DownloadDataConfig,
    getData: (param: any, from: number, size: number) => Promise<CsvData>,
    onFileDataCompleted: (file: FilePart) => void,
    onProgress?: (completedPercent: number, downloaded: number, total: number) => void
  ): Promise<boolean>;
}

const fns: DIWorker = {
  parsePureJson(data: string): Promise<any> {
    try {
      if (data) {
        return Promise.resolve(JsonUtils.fromPureJson(data));
      } else {
        return Promise.resolve({});
      }
    } catch (e) {
      console.error("It's not a Json", data);
      return Promise.resolve(data);
    }
  },

  parseObject(data: string): Promise<any> {
    try {
      if (data) {
        return Promise.resolve(JsonUtils.fromObject(data));
      } else {
        return Promise.resolve({});
      }
    } catch (e) {
      console.error("It's not a Json", data);
      return Promise.resolve(data);
    }
  },

  toJson(data: any): Promise<string> {
    try {
      if (data) {
        return Promise.resolve(JsonUtils.toJson(data, true));
      } else {
        return Promise.resolve('');
      }
    } catch (e) {
      return Promise.reject(e);
    }
  },

  async downloadCsvData(
    option: DownloadDataConfig,
    getData: (request: any, from: number, size: number) => Promise<CsvData>,
    onFileCompleted: (file: FilePart) => void,
    onProgress?: (completedPercent: number, completed: number, total: number) => void
  ): Promise<boolean> {
    return new CsvDownloader(option, getData, onFileCompleted, onProgress).start();
  }
};

Comlink.expose(fns);
