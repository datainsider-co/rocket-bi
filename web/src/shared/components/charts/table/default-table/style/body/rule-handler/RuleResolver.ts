/*
 * @author: tvc12 - Thien Vi
 * @created: 7/8/21, 11:30 PM
 */

/*
 * @author: tvc12 - Thien Vi
 * @created: 7/8/21, 11:27 PM
 */

import { Rule, RuleType, MinMaxData } from '@core/common/domain';
import { RuleHandler } from '@chart/table/default-table/style/body/rule-handler/RuleHandler';
import { Log, NumberUtils } from '@core/utils';
import { IsRuleHandler } from '@chart/table/default-table/style/body/rule-handler/IsRuleHandler';
import { BlankRuleHandler } from '@chart/table/default-table/style/body/rule-handler/BlankRuleHandler';
import { DefaultRuleHandler } from '@chart/table/default-table/style/body/rule-handler/DefaultRuleHandler';

export class RuleResolver {
  private readonly ruleHandlers: RuleHandler[];
  constructor(rules: Rule[], minMaxData: MinMaxData) {
    this.ruleHandlers = this.buildRuleHandler(rules, minMaxData);
  }

  getColor(value: number): string | undefined {
    const currentValue: number = NumberUtils.toNumber(value);
    const handler: RuleHandler | undefined = this.ruleHandlers.find(handler => handler.isMatching(currentValue));
    return handler?.getColor();
  }

  private buildRuleHandler(rules: Rule[], minMaxData: MinMaxData): RuleHandler[] {
    return rules.map(rule => {
      switch (rule.firstCondition.conditionType) {
        case RuleType.Is:
          return new IsRuleHandler(rule, minMaxData);
        case RuleType.Blank:
          return new BlankRuleHandler(rule, minMaxData);
        default:
          return new DefaultRuleHandler(rule, minMaxData);
      }
    });
  }
}
