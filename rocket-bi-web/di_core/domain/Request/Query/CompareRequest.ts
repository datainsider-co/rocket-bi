/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 11:17 PM
 */

import { Condition, CompareMode } from '@core/domain';

export class CompareRequest {
  public readonly firstCondition?: Condition;
  public readonly secondCondition?: Condition;
  public readonly mode: CompareMode;

  constructor(firstCondition?: Condition, secondCondition?: Condition, mode?: CompareMode) {
    this.firstCondition = firstCondition;
    this.secondCondition = secondCondition;
    this.mode = mode || CompareMode.RawValues;
  }

  static fromObject(obj: CompareRequest): CompareRequest {
    const firstCondition = obj.firstCondition ? Condition.fromObject(obj.firstCondition) : void 0;
    const secondCondition = obj.secondCondition ? Condition.fromObject(obj.secondCondition) : void 0;
    return new CompareRequest(firstCondition, secondCondition, obj.mode);
  }
}
