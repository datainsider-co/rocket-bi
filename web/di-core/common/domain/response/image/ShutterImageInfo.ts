import { ShutterAssets } from '@core/common/domain';

export class ShutterImageInfo {
  constructor(
    public id: string,
    public aspect: number,
    public assets: ShutterAssets,
    public description: string,
    public image_type: string,
    public media_type: string
  ) {}

  static fromObject(obj: ShutterImageInfo) {
    return new ShutterImageInfo(obj.id, obj.aspect, ShutterAssets.fromObject(obj.assets), obj.description, obj.image_type, obj.media_type);
  }
}
