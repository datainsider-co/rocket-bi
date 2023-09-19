import { ConditionData } from '@/shared';
import { Condition } from '@core/common/domain/model';

export abstract class ConditionBuilder {
  abstract buildCondition(condition: ConditionData): Condition | undefined;

  static getSecondValue(condition: ConditionData): string {
    if (condition.secondValue !== undefined) {
      return condition.secondValue;
    }
    return '';
  }

  static getFirstValue(condition: ConditionData): string {
    if (condition.firstValue !== undefined) {
      return condition.firstValue;
    }
    return '';
  }

  static getAllValues(condition: ConditionData): string[] {
    if (condition.allValues !== undefined) {
      return condition.allValues;
    }
    return [];
  }
}
