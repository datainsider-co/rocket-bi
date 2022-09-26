import { DimensionListing, VisualizationResponse, VizResponseType } from './VisualizationResponse';
import { ListUtils } from '@/utils';
import { Geocode } from '@core/domain/Model';

export class MapItem {
  constructor(public code: Geocode, public name: string, public value: any) {}

  static fromObject(object: MapItem): MapItem {
    const value = object.value ?? void 0;
    return new MapItem(object.code, object.name, value);
  }
}

export class MapResponse implements VisualizationResponse, DimensionListing {
  className: VizResponseType = VizResponseType.MapResponse;

  constructor(public data: MapItem[], public areaPath: string, public unknownData: MapItem[], public areaCode: string[]) {}

  static empty(): MapResponse {
    return new MapResponse([], '', [], []);
  }

  static fromObject(obj: MapResponse): MapResponse {
    const data = obj.data?.map(item => MapItem.fromObject(item)) || [];
    const unknownLocation = obj.unknownData?.map(item => MapItem.fromObject(item)) || [];
    return new MapResponse(data, obj.areaPath, unknownLocation, obj.areaCode);
  }

  hasData(): boolean {
    return ListUtils.isNotEmpty(this.data);
  }
  static isMapResponse(res: any): res is MapResponse {
    return res?.className === VizResponseType.MapResponse;
  }

  getDimensions(): string[] {
    return [...this.data, ...this.unknownData].map(item => item.name);
  }
}
