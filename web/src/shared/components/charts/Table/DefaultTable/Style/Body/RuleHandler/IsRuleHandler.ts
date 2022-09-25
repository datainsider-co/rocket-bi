/*
 * @author: tvc12 - Thien Vi
 * @created: 7/8/21, 11:32 PM
 */

import { RuleHandler } from '@chart/Table/DefaultTable/Style/Body/RuleHandler/RuleHandler';
import { Rule, MinMaxData } from '@core/domain';
import { isNaN } from 'lodash';
import { NumberUtils } from '@core/utils';

export class IsRuleHandler extends RuleHandler {
  constructor(private rule: Rule, private minMaxData: MinMaxData) {
    super();
  }

  getColor(): string | undefined {
    return this.rule.value;
  }

  isMatching(value: number): boolean {
    return !isNaN(value) && this.isConditionOk(value);
  }

  private isConditionOk(value: number): boolean {
    const firstValue = NumberUtils.toNumber(this.rule.firstCondition?.value);
    const currentValue = this.progressValue(value, this.rule.firstCondition, this.minMaxData);

    return firstValue === currentValue;
  }
}
