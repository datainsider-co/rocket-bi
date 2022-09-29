import * as Comlink from 'comlink';

// Warning: Support load file with absolute path or alias absolute path to file
// Support import {File} from 'worker-plugin/loader?name=foo&esModule!./foo'
import { JsonUtils } from '@core/utils/JsonUtils';
import { FilePart } from '@core/common/domain/model/file/FilePart';
import { CsvData } from '@core/common/domain/response/Page';
import { CsvDownloader } from '@/workers/CsvDownloader';
import { DownloadDataConfig } from '@core/common/domain/model/file/DownloadDataConfig';

export interface DIWorker {
  calculateRowspan(data: any, fields: any): Promise<any>;

  parseObject(data: string): Promise<any>;

  parsePureJson(data: string): Promise<any>;

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
      // eslint-disable-next-line no-console
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
      // eslint-disable-next-line no-console
      console.error("It's not a Json", data);
      return Promise.resolve(data);
    }
  },

  calculateRowspan(data: any, fields: any): Promise<any> {
    const rows = [];
    let spans = {};
    const extractRowsRecursive = (data: any, depth: number, filters: object) => {
      const fieldKey = fields[depth].key;
      // @ts-ignore
      const values = [...new Set(data.map(x => x[fieldKey]))];
      values.forEach(value => {
        const valueFilters = { ...filters, [`${fieldKey}`]: value };
        // @ts-ignore
        const filteredData = data.filter(item => item[fieldKey] === value);
        // @ts-ignore
        spans[`${fieldKey}Span`] = filteredData.length;
        if (depth + 1 < fields.length) {
          extractRowsRecursive(filteredData, depth + 1, valueFilters);
        } else {
          rows.push({ ...valueFilters, ...spans });
          spans = {};
          if (filteredData.length > 1) {
            for (let index = 0; index < filteredData.length - 1; index++) {
              rows.push(valueFilters);
            }
          }
        }
      });
    };
    if (fields.length > 0) {
      extractRowsRecursive(data, 0, {});
    } else {
      rows.push({});
    }
    return Promise.resolve(rows);
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
