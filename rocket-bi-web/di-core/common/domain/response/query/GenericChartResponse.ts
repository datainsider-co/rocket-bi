import { VizResponseType } from '@core/common/domain/response/query/VisualizationResponse';
import { VisualizationResponse } from '@core/common/domain/response/query/VisualizationResponse';
import { CSVData } from '@core/common/misc/csv/Record';

export class GenericChartResponse extends VisualizationResponse {
  className = VizResponseType.GenericChartResponse;

  constructor(public headers: string[], public records: any[], public lastQueryTime: number, public lastProcessingTime: number) {
    super();
  }

  static fromObject(obj: GenericChartResponse): GenericChartResponse {
    return new GenericChartResponse(obj.headers, obj.records, obj.lastQueryTime, obj.lastProcessingTime);
  }

  static empty() {
    return new GenericChartResponse([], [], -1, -1);
  }

  hasData(): boolean {
    return this.records.length !== 0;
  }

  toCSV(): CSVData {
    return new CSVData(this.headers, this.records);
  }
}
