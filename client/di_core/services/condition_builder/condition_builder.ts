import { ConditionData } from '@/shared';
import { Condition } from '@core/domain/Model';
import { get } from 'lodash';

export abstract class ConditionBuilder {
  abstract buildCondition(condition: ConditionData): Condition | undefined;

  static getSecondValue(condition: ConditionData) {
    if (condition.tabControl) {
      return get(condition.tabControl, 'values[1]', '');
    }
    if (condition.secondValue !== undefined) {
      return condition.secondValue;
    }
    return '';
  }

  static getFirstValue(condition: ConditionData) {
    if (condition.tabControl) {
      return get(condition.tabControl, 'values[0]', '');
    }
    if (condition.firstValue !== undefined) {
      return condition.firstValue;
    }
    return '';
  }

  static getAllValues(condition: ConditionData) {
    if (condition.tabControl) {
      return get(condition.tabControl, 'values', []);
    }
    if (condition.allValues !== undefined) {
      return condition.allValues;
    }
    return [];
  }
}
