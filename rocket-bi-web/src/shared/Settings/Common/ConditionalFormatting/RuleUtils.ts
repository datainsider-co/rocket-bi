/*
 * @author: tvc12 - Thien Vi
 * @created: 7/8/21, 1:32 AM
 */

import { RuleCondition, Rule, RuleType, ValueType } from '@core/domain';
import { NumberUtils } from '@core/utils';

export class RuleUtils {
  static isNotValid(condition: RuleCondition): boolean {
    const value: number = NumberUtils.toNumber(condition.value);
    switch (condition.valueType) {
      case ValueType.Percentage:
        return value < 0 || value > 100;
      default:
        return isNaN(value);
    }
  }

  static validate(rule: Rule): boolean {
    switch (rule.firstCondition.conditionType) {
      case RuleType.Blank:
        return true;
      case RuleType.Is:
        return this.validateCondition(rule.firstCondition);
      default:
        return this.validateCondition(rule.firstCondition) && this.validateCondition(rule.secondCondition);
    }
  }

  private static validateCondition(condition: RuleCondition | undefined | null) {
    if (condition) {
      return !this.isNotValid(condition);
    } else {
      return false;
    }
  }
}
