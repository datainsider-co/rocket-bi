/*
 * @author: tvc12 - Thien Vi
 * @created: 5/26/21, 6:37 PM
 */

import ColorScale from 'color-scales';
import Color from 'color';
import { Log } from '@core/utils/Log';
import { StringUtils } from '@/utils/string.utils';

export class ColorUtils {
  /**
   * get color from min and max
   * @param ratio: from [0, 1]
   * @param minColor: min color
   * @param maxColor: max color
   */
  static getColorFromMinMax(ratio: number, minColor: string, maxColor: string): string {
    const colorScale: ColorScale = new ColorScale(0, 1000, [new Color(minColor).hex(), new Color(maxColor).hex()], 1);
    const percentage: number = Math.floor(ratio * 1000);
    return colorScale.getColor(percentage).toHexString();
  }

  static combine(baseHexColor: string, hexColors: string[]): string {
    let base = new Color(baseHexColor);
    hexColors.forEach(hexColor => {
      const color: Color = new Color(hexColor);
      base = this.combineColor(base, color);
    });
    return base.hex();
  }

  private static combineColor(colorA: Color, colorB: Color): Color {
    return colorA.mix(colorB, 0.4005);
  }

  static hasAlpha(baseHexColor: string): boolean {
    const color = new Color(baseHexColor);
    return color.alpha() < 1;
  }

  static mix(hexColorA: string, hexColorB: string): string {
    const colorA = new Color(hexColorA);
    const colorB = new Color(hexColorB);
    return colorA.mix(colorB).hex();
  }

  static isAlpha0(hex: string) {
    const color = new Color(hex);
    return color.alpha() === 0;
  }
  // getColorFromCssVariable(var(--primary)) => #fff
  static getColorFromCssVariable(color: string, defaultValue = '#ffffff') {
    const colorRegex = /var\(\s*([-#\w]+)(,.*)?\)/;
    const isVariable = colorRegex.test(color);
    if (isVariable) {
      // var(--primary) => --primary
      const variableName: string = StringUtils.getValueFromRegex(color, colorRegex, 1) ?? '';
      const appElement: Element = document.getElementById('app') as Element;
      const domColor = getComputedStyle(appElement)
        .getPropertyValue(variableName)
        ?.trim();
      return domColor || defaultValue;
    } else {
      return color;
    }
  }

  static parseColor(text?: string | null): string | undefined {
    if (text) {
      return ColorUtils.getColorFromCssVariable(text);
    } else {
      return void 0;
    }
  }
}
