import { ConditionData } from '@/shared';
import { Condition, FieldRelatedCondition } from '@core/common/domain/model';

export abstract class ConditionResolver {
  /// return [And, And, And]
  abstract buildConditions(mapConditionData: Map<number, ConditionData[]>): Condition[];

  abstract buildCondition(index: number, conditionData: ConditionData): Condition | undefined;
}
