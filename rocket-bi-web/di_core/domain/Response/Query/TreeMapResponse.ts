import { DimensionListing, VisualizationResponse, VizResponseType } from './VisualizationResponse';
import { ListUtils } from '@/utils';

export class TreeMapItem {
  constructor(public id: string, public name: string, public value: number, public colorValue: number, public parent?: string, public color?: string) {}

  static fromObject(object: TreeMapItem): TreeMapItem {
    return new TreeMapItem(object.id, object.name, object.value, object.colorValue, object.parent, object.color);
  }
}

export class TreeMapResponse implements VisualizationResponse, DimensionListing {
  className: VizResponseType = VizResponseType.TreeMapResponse;

  constructor(public name: string, public data: TreeMapItem[], public groupNames: []) {}

  static empty(): TreeMapResponse {
    return new TreeMapResponse('', [], []);
  }

  static fromObject(obj: TreeMapResponse): TreeMapResponse {
    const data = obj.data?.map(item => TreeMapItem.fromObject(item)) || [];
    return new TreeMapResponse(obj.name, data, obj.groupNames);
  }

  hasData(): boolean {
    return ListUtils.isNotEmpty(this.data);
  }

  getDimensions(): string[] {
    return this.groupNames ?? [];
  }
}
