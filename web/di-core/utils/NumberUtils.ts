/*
 * @author: tvc12 - Thien Vi
 * @created: 6/21/21, 5:53 PM
 */

import { toNumber, isNumber } from 'lodash';
import { StringUtils } from '@/utils/StringUtils';

export class NumberUtils {
  static fromPx(text?: string | null): number {
    if (text && text.endsWith('px')) {
      const numberAsText = text.substr(0, text.length - 2);
      return toNumber(numberAsText);
    } else {
      return NaN;
    }
  }

  static toNumber(value: any) {
    return toNumber(value);
  }

  static limit(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  static isNegative(value: number): boolean {
    return Math.sign(value) === -1;
  }

  static percentage(ratio: number) {
    return ratio * 100;
  }

  static calculatedPercentage(value: number, base: number): number {
    const ratio = (value - base) / base;
    return NumberUtils.round(ratio * 100);
  }

  static round(number: number, roundingPrecision = 2): number {
    return Math.round(number * Math.pow(10, roundingPrecision)) / Math.pow(10, roundingPrecision);
  }

  static isNumber(value: any): value is number {
    const number = NumberUtils.toNumber(value);
    const hasValue = StringUtils.isNotEmpty(value);
    return hasValue && isNumber(number);
  }
}
