import { Condition } from '@core/domain/Model/Condition/Condition';

export abstract class NestedCondition {
  static isNestedCondition(condition: any): condition is NestedCondition {
    return !!(condition as NestedCondition)?.getConditions;
  }

  abstract getConditions(): Condition[];
}
