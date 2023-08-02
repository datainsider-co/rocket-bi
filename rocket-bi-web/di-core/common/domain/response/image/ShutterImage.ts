import { Log } from '@core/utils';

export class ShutterImage {
  constructor(public url: string, public width?: number, public height?: number) {}

  static fromObject(obj: ShutterImage) {
    // Log.debug('ShutterImage::ShutterImage::obj::', obj);
    return new ShutterImage(obj.url, obj?.width, obj?.height);
  }
}
