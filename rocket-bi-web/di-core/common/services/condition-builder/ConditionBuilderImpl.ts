import { ConditionBuilder } from '@core/common/services/condition-builder/ConditionBuilder';
import { ConditionData, ConditionTypes } from '@/shared';
import { Condition } from '@core/common/domain/model';
import { DateHistogramConditionBuilder } from '@core/common/services/condition-builder/DateHistogramConditionBuilder';
import { NumberConditionBuilder } from '@core/common/services/condition-builder/NumberConditionBuilder';
import { StringConditionBuilder } from '@core/common/services/condition-builder/StringConditionBuilder';
import { DynamicConditionBuilder } from './DynamicConditionBuilder';

export class MainConditionBuilder implements ConditionBuilder {
  private readonly builderAsMap: Map<string, ConditionBuilder>;
  private readonly dynamicBuilderAsMap: Map<string, ConditionBuilder>;

  constructor() {
    this.builderAsMap = this.buildNormalBuilders();
    this.dynamicBuilderAsMap = this.buildDynamicBuilders();
  }

  buildCondition(condition: ConditionData): Condition | undefined {
    const isControl = condition.controlId !== undefined;
    const builder = isControl ? this.dynamicBuilderAsMap.get(condition.familyType) : this.builderAsMap.get(condition.familyType);
    return builder?.buildCondition(condition);
  }

  private buildNormalBuilders() {
    const builders = new Map<string, ConditionBuilder>();
    builders
      .set(ConditionTypes.DateHistogram, new DateHistogramConditionBuilder())
      .set(ConditionTypes.Number, new NumberConditionBuilder())
      .set(ConditionTypes.String, new StringConditionBuilder());

    return builders;
  }

  private buildDynamicBuilders() {
    const builders = new Map<string, ConditionBuilder>();
    builders
      .set(ConditionTypes.DateHistogram, new DynamicConditionBuilder(new DateHistogramConditionBuilder()))
      .set(ConditionTypes.Number, new DynamicConditionBuilder(new NumberConditionBuilder()))
      .set(ConditionTypes.String, new DynamicConditionBuilder(new StringConditionBuilder()));
    return builders;
  }
}
