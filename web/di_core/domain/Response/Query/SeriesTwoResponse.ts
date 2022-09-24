import { DimensionListing, VisualizationResponse, VizResponseType } from './VisualizationResponse';
import { ListUtils } from '@/utils';
import { isArray } from 'lodash';

export class SeriesTwoItem {
  constructor(public name: string, public data: any[][]) {}

  static fromObject(object: SeriesTwoItem): SeriesTwoItem {
    return new SeriesTwoItem(object.name, object.data);
  }
}

export class SeriesTwoResponse implements VisualizationResponse, DimensionListing {
  className: VizResponseType = VizResponseType.SeriesTwoResponse;

  constructor(public series: SeriesTwoItem[], public xAxis?: any[], public yAxis?: any[]) {}

  static empty(): SeriesTwoResponse {
    return new SeriesTwoResponse([], [], []);
  }

  static fromObject(obj: SeriesTwoResponse): SeriesTwoResponse {
    const series = obj.series?.map(item => SeriesTwoItem.fromObject(item)) || [];
    return new SeriesTwoResponse(series, obj.xAxis, obj.yAxis);
  }
  hasData(): boolean {
    const itemHaveData: SeriesTwoItem | undefined = this.series.find(item => ListUtils.isNotEmpty(item.data));
    return itemHaveData != undefined;
  }

  getDimensions(): string[] {
    if (isArray(this.xAxis)) {
      return this.xAxis;
    } else {
      const dimensions = this.series.flatMap(seriesOne => seriesOne.data.map(items => items[0]));
      return Array.from(new Set(dimensions));
    }
  }
}
