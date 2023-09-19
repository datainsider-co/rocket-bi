export enum FitMode {
  Fill = 'fill',
  Fit = 'fit',
  Repeat = 'repeat',
  RepeatX = 'repeat-x',
  RepeatY = 'repeat-y',
  Parallax = 'parallax',
  None = 'none'
}

export enum BackgroundPosition {
  Top = 'top',
  Center = 'center',
  Bottom = 'bottom'
}

export class BackgroundImageInfo {
  imageName: string;
  path: string;
  fitMode: FitMode;
  // position: BackgroundPosition;

  brightness: number;
  contrast: number;
  grayscale: number;
  opacity: number;

  constructor(data: {
    imageName?: string;
    path?: string;
    fitMode?: FitMode;
    // in percent from [0, 100]
    brightness?: number;
    contrast?: number;
    grayscale?: number;
    opacity?: number;
  }) {
    this.imageName = data.imageName ?? '';
    this.path = data.path ?? '';
    this.fitMode = data.fitMode ?? FitMode.None;
    this.brightness = data.brightness ?? 100;
    this.contrast = data.contrast ?? 100;
    this.grayscale = data.grayscale ?? 0;
    this.opacity = data.opacity ?? 100;
  }

  static default(): BackgroundImageInfo {
    return new BackgroundImageInfo({
      fitMode: FitMode.Repeat
    });
  }

  static fromObject(obj: any): BackgroundImageInfo {
    return new BackgroundImageInfo(obj);
  }

  toImageCssStyle(): string {
    if (this.path) {
      return `url(${this.path})`;
    } else {
      return '';
    }
  }

  toFilterCssStyle(): string {
    return `brightness(${this.brightness}%) contrast(${this.contrast}%) grayscale(${this.grayscale}%) opacity(${this.opacity}%)`;
  }
}
