import { RadiusInfo } from './RadiusInfo';
import { ColorUtils } from '@/utils';

export enum BorderPosition {
  Outside = 'outside',
  Inside = 'inside',
  Center = 'center'
}

export class BorderInfo {
  // using px
  width: number;
  color: string;
  // [0, 100] in percent
  colorOpacity: number;
  radius: RadiusInfo;
  position: BorderPosition;

  constructor(width: number, color: string, colorOpacity: number, radius: RadiusInfo, position: BorderPosition) {
    this.width = width;
    this.color = color;
    this.colorOpacity = colorOpacity;
    this.radius = radius;
    this.position = position;
  }

  static default(): BorderInfo {
    return new BorderInfo(1, '#f2f2f7', 100, RadiusInfo.default(), BorderPosition.Outside);
  }

  static none(): BorderInfo {
    return new BorderInfo(0, '#f2f2f7', 100, RadiusInfo.default(), BorderPosition.Outside);
  }

  static fromObject(obj: any): BorderInfo {
    return new BorderInfo(obj.width, obj.color, obj.colorOpacity, RadiusInfo.fromObject(obj.radius), obj.position);
  }

  toWidthCss(): string {
    return `${this.width}px`;
  }

  toColorCss(): string {
    return ColorUtils.withAlpha(this.color, this.colorOpacity);
  }
}
