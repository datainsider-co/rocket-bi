import { Condition, ScalarFunction } from '@core/domain';

export abstract class DateRelatedCondition extends Condition {
  abstract intervalFunction: ScalarFunction | undefined;

  // abstract isDateCondition(): boolean;
  //
  // static isDateRelatedCondition(obj: any & Condition): obj is DateRelatedCondition {
  //   return obj?.isDateCondition() || false;
  // }
}
