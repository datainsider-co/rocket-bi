export class RadiusInfo {
  topLeft: number;
  topRight: number;
  bottomRight: number;
  bottomLeft: number;

  constructor(topLeft: number, topRight: number, bottomRight: number, bottomLeft: number) {
    this.topLeft = topLeft;
    this.topRight = topRight;
    this.bottomRight = bottomRight;
    this.bottomLeft = bottomLeft;
  }

  static default(defaultRadius = 20) {
    return new RadiusInfo(20, 20, 20, 20);
  }

  static fromObject(obj: any): RadiusInfo {
    return new RadiusInfo(obj.topLeft, obj.topRight, obj.bottomRight, obj.bottomLeft);
  }

  isMixed() {
    return this.topLeft !== this.topRight || this.topLeft !== this.bottomRight || this.topLeft !== this.bottomLeft;
  }

  isAllSame() {
    return this.topLeft === this.topRight && this.topLeft === this.bottomRight && this.topLeft === this.bottomLeft;
  }

  isAllZero() {
    return this.topLeft === 0 && this.topRight === 0 && this.bottomRight === 0 && this.bottomLeft === 0;
  }

  isValueValid() {
    return this.topLeft >= 0 && this.topRight >= 0 && this.bottomRight >= 0 && this.bottomLeft >= 0;
  }

  setAllRadius(radius: number) {
    this.topLeft = radius;
    this.topRight = radius;
    this.bottomRight = radius;
    this.bottomLeft = radius;
  }

  /**
   * convert to css style
   */
  toCssStyle(): string {
    if (this.isAllZero()) {
      return '0';
    }
    if (this.isAllSame()) {
      return `${this.topLeft}px`;
    }

    return `${this.topLeft}px ${this.topRight}px ${this.bottomRight}px ${this.bottomLeft}px`;
  }
}
