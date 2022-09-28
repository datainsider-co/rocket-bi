/*
 * @author: tvc12 - Thien Vi
 * @created: 7/8/21, 11:30 PM
 */

import { RuleCondition, ValueType, MinMaxData } from '@core/domain';
import { ChartUtils } from '@/utils';

export abstract class RuleHandler {
  abstract isMatching(value: number): boolean;

  abstract getColor(): string | undefined;

  protected progressValue(value: number, condition: RuleCondition, minMaxData: MinMaxData): number {
    switch (condition.valueType) {
      case ValueType.Percentage: {
        const ratio = ChartUtils.calculateRatio(value, minMaxData);
        return ratio * 100;
      }
      default:
        return value;
    }
  }
}
