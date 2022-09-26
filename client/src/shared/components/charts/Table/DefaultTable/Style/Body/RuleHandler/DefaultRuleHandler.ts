/*
 * @author: tvc12 - Thien Vi
 * @created: 7/8/21, 11:32 PM
 */

import { RuleHandler } from '@chart/Table/DefaultTable/Style/Body/RuleHandler/RuleHandler';
import { Rule, RuleType, MinMaxData } from '@core/domain';
import { isNaN } from 'lodash';
import { Log, NumberUtils } from '@core/utils';

export class DefaultRuleHandler extends RuleHandler {
  constructor(private rule: Rule, private minMaxData: MinMaxData) {
    super();
  }

  getColor(): string | undefined {
    return this.rule.value;
  }

  isMatching(value: number): boolean {
    return !isNaN(value) && this.isLeftConditionOk(value) && this.isRightConditionOk(value);
  }

  private isLeftConditionOk(value: number): boolean {
    const firstValue = NumberUtils.toNumber(this.rule.firstCondition?.value);
    const currentValue = this.progressValue(value, this.rule.firstCondition, this.minMaxData);
    switch (this.rule.firstCondition?.conditionType) {
      case RuleType.GreaterThan:
        return currentValue > firstValue;
      case RuleType.GreaterThanOrEqual:
        return currentValue >= firstValue;
      default:
        return false;
    }
  }

  private isRightConditionOk(value: number) {
    const currentValue = this.progressValue(value, this.rule.secondCondition!, this.minMaxData);
    const secondValue = NumberUtils.toNumber(this.rule.secondCondition?.value);
    switch (this.rule.secondCondition?.conditionType) {
      case RuleType.LessThan:
        return currentValue < secondValue;
      case RuleType.LessThanOrEqual:
        return currentValue <= secondValue;
      default:
        return false;
    }
  }
}
