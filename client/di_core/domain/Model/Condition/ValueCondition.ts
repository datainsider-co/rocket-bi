import { Condition, FieldRelatedCondition } from '@core/domain/Model';

export abstract class ValueCondition {
  static isValueCondition(condition: ValueCondition | FieldRelatedCondition | Condition): condition is ValueCondition {
    return (condition as ValueCondition)?.getValues() != undefined;
  }

  abstract getValues(): string[];

  abstract setValues(values: string[]): void;
}
