import { ColorUtils } from '@/utils';

export class BackgroundInfo {
  color: string;
  opacity: number;

  constructor(data: { color?: string; opacity?: number }) {
    this.color = data.color ?? '#FAFAFB';
    this.opacity = data.opacity ?? 100;
  }

  static default(): BackgroundInfo {
    return new BackgroundInfo({
      color: '#FAFAFB',
      opacity: 100
    });
  }

  static widgetDefault(): BackgroundInfo {
    return new BackgroundInfo({
      color: '#FFFFFF',
      opacity: 100
    });
  }

  static fromObject(obj: any): BackgroundInfo {
    return new BackgroundInfo(obj);
  }

  toColorCss(): string {
    if (this.opacity === 100) {
      return this.color;
    } else {
      return ColorUtils.withAlpha(this.color, this.opacity);
    }
  }
}
