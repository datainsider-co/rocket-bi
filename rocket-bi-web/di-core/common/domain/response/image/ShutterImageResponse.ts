import { ImageInfo, ShutterImageInfo } from '@core/common/domain';

export class ShutterImageResponse {
  constructor(public data: ShutterImageInfo[], public page: number, public per_page: number, public total_count: number) {}

  static toImageInfos(obj: ShutterImageResponse): ImageInfo[] {
    return obj.data.map(imageInfo => new ImageInfo(imageInfo.assets.huge_thumb.url, imageInfo.assets.huge_thumb.url));
  }
}
