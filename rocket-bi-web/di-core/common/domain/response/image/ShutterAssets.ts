import { ShutterImage } from '@core/common/domain';

export class ShutterAssets {
  constructor(
    public huge_thumb: ShutterImage,
    public large_thumb: ShutterImage,
    public preview: ShutterImage,
    public preview_1000: ShutterImage,
    public preview_1500: ShutterImage,
    public small_thumb: ShutterImage
  ) {}

  static fromObject(obj: ShutterAssets) {
    return new ShutterAssets(
      ShutterImage.fromObject(obj.huge_thumb),
      ShutterImage.fromObject(obj.large_thumb),
      ShutterImage.fromObject(obj.preview),
      ShutterImage.fromObject(obj.preview_1000),
      ShutterImage.fromObject(obj.preview_1500),
      ShutterImage.fromObject(obj.small_thumb)
    );
  }
}
