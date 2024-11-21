import { Condition, ScalarFunction } from '@core/common/domain';

export abstract class DateRelatedCondition extends Condition {
  abstract intervalFunction: ScalarFunction | undefined;
}
