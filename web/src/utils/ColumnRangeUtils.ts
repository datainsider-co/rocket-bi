import { SeriesOneItem, SeriesOneResponse, SeriesQuerySetting } from '@core/common/domain';
import { get, zip } from 'lodash';
import { Log } from '@core/utils';

export abstract class ColumnRangeUtils {
  static isColumnRange(query: SeriesQuerySetting): boolean {
    return get(query, 'options.options.chart.type', '') === 'columnrange';
  }

  static processResponse(seriesName: string, data: SeriesOneResponse): SeriesOneItem[] {
    const { series } = data;
    if (series.length === 0) {
      return [];
    }
    if (series.length === 1) {
      return series;
    }

    return [new SeriesOneItem(seriesName, zip(series[0].data, series[1].data), 0)];
  }
}
