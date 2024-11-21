/*
 * @author: tvc12 - Thien Vi
 * @created: 5/26/21, 6:37 PM
 */

import ColorScale from 'color-scales';
import Color from 'color';
import { StringUtils } from '@/utils/StringUtils';
import { Log } from '@core/utils/Log';
export interface GradientObject {
  type: string;
  stops: [string, number][];
  limit: number;
  angle: number;
}

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
    // @ts-ignore
    return colorA.mix(colorB).hexa();
  }

  /**
   * copy hex color and set alpha.
   * @param hexColor color
   * @param alpha is [0, 100] in percent
   * @return string #ffffffff
   */
  static withAlpha(hexColor: string, alpha: number): string {
    try {
      const color = new Color(hexColor);
      const newColor = color.alpha(alpha / 100.0);
      // @ts-ignore
      return newColor.hexa();
    } catch (ex) {
      Log.debug('ColorUtils::withAlpha::error', ex);
      return hexColor;
    }
  }

  static isAlpha0(hex: string): boolean {
    const color = new Color(hex);
    return color.alpha() === 0;
  }

  /**
   * getColorFromCssVariable(var(--primary)) => #fff
   * @param color
   * @param defaultValue
   * @param targetEl element to get css variable
   */
  //
  static getColorFromCssVariable(color: string, defaultValue = '#ffffff', targetEl?: Element): string {
    const colorRegex = /var\(\s*([-#\w]+)(,.*)?\)/;
    const isVariable = colorRegex.test(color);
    if (isVariable) {
      // var(--primary) => --primary
      const variableName: string = StringUtils.getValueFromRegex(color, colorRegex, 1) ?? '';
      const appElement: Element = targetEl ?? (document.getElementById('app') as Element);
      const domColor = getComputedStyle(appElement)
        .getPropertyValue(variableName)
        ?.trim();
      return domColor || defaultValue;
    } else {
      return color;
    }
  }

  /**
   * @deprecated don't use this function in the future, because method only get color from css variable in app element. It's not in the target element, this is not correct.
   * Method will be removed as soon as possible when move logic merge color of table.
   * @param text is var(--primary)
   */
  static parseColor(text?: string | null): string | undefined {
    if (text) {
      return ColorUtils.getColorFromCssVariable(text);
    } else {
      return void 0;
    }
  }

  static isGradientColor(value: string | null | undefined): boolean {
    if (value) {
      const gradientRegex = /(linear|radial)-gradient\([\s\S]*?\)/;
      return gradientRegex.test(value);
    }
    return false;
  }

  static getColorsFromGradient(value: string | null | undefined): string[] {
    if (value) {
      const colorRegex = /#(?:[0-9a-fA-F]{3}){1,2}/g;
      return [...value.match(colorRegex)];
    }
    return [];
  }

  static parseGradient(gradientValue: string): GradientObject | null {
    const gradientRegex = /(linear|radial)-gradient\((.+?)\)/;

    const gradientMatch = gradientValue.match(gradientRegex);
    if (!gradientMatch) {
      return null; // Invalid gradient format
    }

    const gradientType = gradientMatch[1];
    const gradientData = gradientMatch[2];

    const gradientObj: GradientObject = {
      type: gradientType,
      angle: 0,
      stops: [],
      limit: 0
    };

    if (gradientType === 'linear') {
      const angleRegex = /(\d+)deg/;
      const angleMatch = gradientData.match(angleRegex);
      gradientObj.angle = parseInt(angleMatch![1]);
    }

    const colorStops = gradientData.split(',').slice(1);
    colorStops.forEach(stop => {
      const splitStop = stop!.trim().split(' ');
      const colorHex = splitStop[0];
      const positionMatch = splitStop[1];

      const position = positionMatch ? parseFloat(positionMatch.replace('%', '')) / 100 : 0;
      gradientObj.stops.push([colorHex, position]);
    });

    gradientObj.limit = gradientObj.stops.length;

    return gradientObj;
  }
}
