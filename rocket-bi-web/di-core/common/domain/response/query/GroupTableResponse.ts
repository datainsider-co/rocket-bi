/*
 * @author: tvc12 - Thien Vi
 * @created: 5/27/21, 11:32 AM
 */

import { VizResponseType } from '@core/common/domain/response/query/VisualizationResponse';
import { TableResponse } from '@core/common/domain/response/query/TableResponse';
import { AbstractTableResponse, MinMaxData } from '@core/common/domain/response/query/AbstractTableResponse';
import { CSVData } from '@core/common/misc/csv/Record';
import { get, isArray, isObject } from 'lodash';
import { HeaderData } from '@/shared/models';

export class GroupTableResponse extends AbstractTableResponse {
  className = VizResponseType.GroupedTableResponse;

  constructor(readonly headers: any[], readonly records: any[], readonly minMaxValues: MinMaxData[], readonly total: number) {
    super(headers, records, minMaxValues, total);
  }

  static fromObject(obj: TableResponse): GroupTableResponse {
    const minMaxValues: MinMaxData[] = MinMaxData.getMinMaxValues(obj);
    return new GroupTableResponse(obj.headers, obj.records, minMaxValues, obj.total);
  }

  static empty(): GroupTableResponse {
    return new GroupTableResponse([], [], [], 0);
  }

  hasData(): boolean {
    return this.total != 0;
  }

  toCSV(): CSVData {
    const csvHeader: HeaderData[] = this.headers.flatMap(header => this.collapseHeader(header, []));
    const records: any[][] = this.records.map(row => this.toRecord(row, csvHeader));
    return new CSVData(
      csvHeader.map(header => header.label),
      records
    );
  }

  private collapseHeader(header: HeaderData, previousLabel: string[]): HeaderData[] {
    if (isArray(header.children)) {
      return header.children.flatMap(currentHeader => this.collapseHeader(currentHeader, previousLabel.concat(header.label)));
    } else {
      return [
        {
          ...header,
          label: previousLabel.concat(header.label).join(' - ')
        }
      ];
    }
  }

  private toRecord(row: any, csvHeader: HeaderData[]): any[] {
    return csvHeader.map(header => get(row, header.key));
  }
}
