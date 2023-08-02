export class ImageInfo {
  constructor(public previewUrl: string, public url: string) {}

  static fromObject(obj: ImageInfo) {
    return new ImageInfo(obj.previewUrl, obj.url);
  }
}
