import { ConditionResolver } from '@core/common/services/condition-builder/ConditionResolver';
import { ListUtils, MapUtils } from '@/utils';
import { And, Condition, FieldRelatedCondition, GetArrayElement } from '@core/common/domain/model';
import { ConditionData } from '@/shared';
import { ConditionBuilder } from '@core/common/services/condition-builder/ConditionBuilder';
import { Inject } from 'typescript-ioc';
import { Log } from '@core/utils';

export class DiConditionResolver implements ConditionResolver {
  @Inject
  private builder!: ConditionBuilder;

  buildCondition(index: number, conditionData: ConditionData): Condition | undefined {
    const condition = this.builder.buildCondition(conditionData);
    if (condition && FieldRelatedCondition.isFieldRelatedCondition(condition) && conditionData.isNested) {
      if (condition.scalarFunction) {
        condition.scalarFunction.withScalarFunction(new GetArrayElement());
      } else {
        condition.setScalarFunction(new GetArrayElement());
      }
    }
    return condition;
  }

  buildConditions(mapConditionData: Map<number, ConditionData[]>): Condition[] {
    return MapUtils.map(mapConditionData, (key, rawConditions) => {
      const conditions = rawConditions.map((condition, index) => this.buildCondition(index, condition)).filter((item): item is FieldRelatedCondition => !!item);
      if (ListUtils.isNotEmpty(conditions)) {
        return new And(conditions);
      } else {
        return void 0;
      }
    }).filter((item): item is And => !!item);
  }
}
