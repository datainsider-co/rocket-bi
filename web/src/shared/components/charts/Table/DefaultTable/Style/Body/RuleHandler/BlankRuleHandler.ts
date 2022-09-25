/*
 * @author: tvc12 - Thien Vi
 * @created: 7/8/21, 11:32 PM
 */

import { RuleHandler } from '@chart/Table/DefaultTable/Style/Body/RuleHandler/RuleHandler';
import { Rule, MinMaxData } from '@core/domain';
import { isNaN } from 'lodash';

export class BlankRuleHandler extends RuleHandler {
  constructor(private rule: Rule, private minMaxData: MinMaxData) {
    super();
  }

  getColor(): string | undefined {
    return this.rule.value;
  }

  isMatching(value: number): boolean {
    return isNaN(value);
  }
}
