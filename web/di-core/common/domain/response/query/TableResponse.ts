/*
 * @author: tvc12 - Thien Vi
 * @created: 12/9/20, 7:20 PM
 */

import { VizResponseType } from '@core/common/domain/response/query/VisualizationResponse';
import { AbstractTableResponse, MinMaxData } from '@core/common/domain/response/query/AbstractTableResponse';
import { CSVData } from '@core/common/misc/csv/Record';
import { DIException } from '@core/common/domain';

export class TableResponse extends AbstractTableResponse {
  className = VizResponseType.TableResponse;

  constructor(readonly headers: string[], readonly records: any[][], readonly minMaxValues: MinMaxData[], readonly total: number) {
    super(headers, records, minMaxValues, total);
  }

  static fromObject(obj: TableResponse): TableResponse {
    const minMaxValues: MinMaxData[] = MinMaxData.getMinMaxValues(obj);
    return new TableResponse(obj.headers, obj.records, minMaxValues, obj.total);
  }

  static empty() {
    return new TableResponse([], [], [], 0);
  }

  hasData(): boolean {
    return this.total != 0;
  }

  toCSV(): CSVData {
    return new CSVData(this.headers, this.records);
  }
}
