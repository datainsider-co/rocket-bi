import { Condition } from '@core/common/domain/model/condition/Condition';

export abstract class NestedCondition {
  static isNestedCondition(condition: any): condition is NestedCondition {
    return !!(condition as NestedCondition)?.getConditions;
  }

  abstract getConditions(): Condition[];
}
