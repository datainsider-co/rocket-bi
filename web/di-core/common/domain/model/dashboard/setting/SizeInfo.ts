import { Equatable } from '@core/common/domain';

export enum SizeUnit {
  px = 'px',
  percent = '%',
  auto = 'auto'
}

export class SizeInfo implements Equatable {
  width: number;
  height: number;
  widthUnit: SizeUnit;
  heightUnit: SizeUnit;

  constructor(width: number, height: number, widthUnit: SizeUnit, heightUnit: SizeUnit) {
    this.width = width;
    this.height = height;
    this.widthUnit = widthUnit;
    this.heightUnit = heightUnit;
  }

  static default() {
    return new SizeInfo(100, 0, SizeUnit.percent, SizeUnit.auto);
  }

  static fromObject(obj: any): SizeInfo {
    return new SizeInfo(obj.width, obj.height, obj.widthUnit, obj.heightUnit);
  }

  isAutoHeight(): boolean {
    return this.heightUnit === SizeUnit.auto;
  }

  toWidthCssStyle(): string {
    return this.toCssStyle(this.width, this.widthUnit);
  }

  toHeightCssStyle(): string {
    return this.toCssStyle(this.height, this.heightUnit);
  }

  private toCssStyle(size: number, unit: SizeUnit): string {
    if (unit === SizeUnit.auto) {
      return 'auto';
    } else {
      return `${size}${unit}`;
    }
  }

  equals(obj: SizeInfo): boolean {
    return this.width === obj.width && this.height === obj.height && this.widthUnit === obj.widthUnit && this.heightUnit === obj.heightUnit;
  }
}
