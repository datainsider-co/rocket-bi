import { TextAlign } from './TextAlign';
import { ColorUtils } from '@/utils';

export class TextStyleSetting {
  // like roboto, arial, ...
  fontFamily: string;
  // in px like 12, 14, ...
  fontSize: string;
  // like 500, 600
  fontWeight: string;

  // like left, center, right, ...
  textAlign: TextAlign;
  // like #000000, #ffffff, ...
  color: string;
  // [0, 100] in percent
  colorOpacity: number;

  /**
   * override font-weight if true
   */
  isBold: boolean;

  isItalic: boolean;

  isUnderline: boolean;

  constructor(data: {
    fontFamily?: string;
    fontSize?: string;
    fontWeight?: string;
    textAlign?: TextAlign;
    color?: string;
    colorOpacity?: number;
    isBold?: boolean;
    isItalic?: boolean;
    isUnderline?: boolean;
  }) {
    this.fontFamily = data.fontFamily ?? 'Roboto';
    this.fontSize = data.fontSize ?? '14px';
    this.fontWeight = data.fontWeight ?? 'normal';
    this.textAlign = data.textAlign ?? TextAlign.Center;
    this.color = data.color ?? '#000000';
    this.colorOpacity = data.colorOpacity ?? 100;
    this.isBold = data.isBold ?? false;
    this.isItalic = data.isItalic ?? false;
    this.isUnderline = data.isUnderline ?? false;
  }

  static primaryDefault(): TextStyleSetting {
    return new TextStyleSetting({
      fontFamily: 'Roboto',
      fontSize: '20px',
      fontWeight: '500',
      textAlign: TextAlign.Center,
      color: '#4f4f4f',
      colorOpacity: 100
    });
  }

  static secondaryDefault(): TextStyleSetting {
    return new TextStyleSetting({
      fontFamily: 'Roboto',
      fontSize: '14px',
      fontWeight: 'normal',
      textAlign: TextAlign.Center,
      color: '#5f6368',
      colorOpacity: 100
    });
  }

  static fromObject(obj: any): TextStyleSetting {
    return new TextStyleSetting(obj);
  }

  toColorCss(): string {
    return ColorUtils.withAlpha(this.color, this.colorOpacity);
  }

  toFontWeightCss() {
    return this.isBold ? 'bold' : this.fontWeight;
  }

  toFontStyleCss(): string {
    return this.isItalic ? 'italic' : 'normal';
  }

  toFontUnderlinedCss(): string {
    return this.isUnderline ? 'underline' : 'none';
  }
}
