import { DimensionListing, VisualizationResponse, VizResponseType } from './VisualizationResponse';
import { ListUtils } from '@/utils';

export class WordCloudItem {
  constructor(public name: string, public weight: number) {}

  static fromObject(object: WordCloudItem): WordCloudItem {
    return new WordCloudItem(object.name, object.weight);
  }
}

export class WordCloudResponse implements VisualizationResponse, DimensionListing {
  className: VizResponseType = VizResponseType.WordCloudResponse;

  constructor(public readonly name: string, public readonly data: WordCloudItem[]) {}

  static empty(): WordCloudResponse {
    return new WordCloudResponse('', []);
  }

  static fromObject(obj: WordCloudResponse): WordCloudResponse {
    const data = obj.data?.map(item => WordCloudItem.fromObject(item)) || [];

    return new WordCloudResponse(obj.name, data);
  }

  hasData(): boolean {
    return ListUtils.isNotEmpty(this.data);
  }

  getDimensions(): string[] {
    return this.data?.map(item => item.name) ?? [];
  }
}
