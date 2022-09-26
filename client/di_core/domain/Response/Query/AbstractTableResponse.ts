/*
 * @author: tvc12 - Thien Vi
 * @created: 1/4/21, 2:52 PM
 */

import { VisualizationResponse, VizResponseType } from '@core/domain/Response/Query/VisualizationResponse';
import { TableResponse } from '@core/domain/Response/Query/TableResponse';
import { CSVData, Field } from '@core/misc/csv/record';

export class MinMaxData {
  public constructor(public valueName: string, public min: number, public max: number) {}

  static fromObject(obj: MinMaxData & any): MinMaxData {
    return new MinMaxData(obj.valueName, obj.min, obj.max);
  }

  static getMinMaxValues(obj: TableResponse): MinMaxData[] {
    return (obj.minMaxValues ?? []).map(minMaxData => MinMaxData.fromObject(minMaxData));
  }

  static from(minValue: number, maxValue: number): MinMaxData {
    return new MinMaxData('', minValue, maxValue);
  }
}

export abstract class AbstractTableResponse implements VisualizationResponse {
  abstract className: VizResponseType;

  protected constructor(public readonly headers: any[], public readonly records: any[], public minMaxValues: MinMaxData[], public total: number) {}

  abstract hasData(): boolean;

  getMinMaxValueAsMap(): Map<string, MinMaxData> {
    return new Map(this.minMaxValues.map(data => [data.valueName, data]));
  }

  abstract toCSV(): CSVData;
}
