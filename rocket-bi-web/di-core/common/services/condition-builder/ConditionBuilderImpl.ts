import { ConditionBuilder } from '@core/common/services/condition-builder/ConditionBuilder';
import { ConditionData, ConditionFamilyTypes } from '@/shared';
import { Condition, FieldRelatedCondition } from '@core/common/domain/model';
import { DateHistogramConditionBuilder } from '@core/common/services/condition-builder/DateHistogramConditionBuilder';
import { NumberConditionBuilder } from '@core/common/services/condition-builder/NumberConditionBuilder';
import { StringConditionBuilder } from '@core/common/services/condition-builder/StringConditionBuilder';
import { DynamicDateHistogramConditionBuilder, DynamicNumberConditionBuilder, DynamicStringConditionBuilder } from '@core/common/services';

export class GeospatialConditionBuilder implements ConditionBuilder {
  buildCondition(condition: ConditionData): FieldRelatedCondition | undefined {
    return undefined;
  }
}

export class CustomConditionBuilder implements ConditionBuilder {
  buildCondition(condition: ConditionData): FieldRelatedCondition | undefined {
    return undefined;
  }
}

export class MainConditionBuilder implements ConditionBuilder {
  private readonly builderAsMap: Map<string, ConditionBuilder>;
  private readonly dynamicBuilderAsMap: Map<string, ConditionBuilder>;

  constructor() {
    this.builderAsMap = this.buildBuilders();
    this.dynamicBuilderAsMap = this.buildDynamicBuilders();
  }

  buildCondition(condition: ConditionData): Condition | undefined {
    const isDynamicBuilder = condition.tabControl !== undefined;
    const builder = isDynamicBuilder ? this.dynamicBuilderAsMap.get(condition.familyType) : this.builderAsMap.get(condition.familyType);
    return builder?.buildCondition(condition);
  }

  private buildBuilders() {
    const builders = new Map<string, ConditionBuilder>();
    builders
      .set(ConditionFamilyTypes.dateHistogram, new DateHistogramConditionBuilder())
      .set(ConditionFamilyTypes.number, new NumberConditionBuilder())
      .set(ConditionFamilyTypes.string, new StringConditionBuilder());
    // .set(ConditionFamilyTypes.custom, new CustomConditionBuilder())
    // .set(ConditionFamilyTypes.geospatial, new GeospatialConditionBuilder());

    return builders;
  }

  private buildDynamicBuilders() {
    const builders = new Map<string, ConditionBuilder>();
    builders
      .set(ConditionFamilyTypes.dateHistogram, new DynamicDateHistogramConditionBuilder())
      .set(ConditionFamilyTypes.number, new DynamicNumberConditionBuilder())
      .set(ConditionFamilyTypes.string, new DynamicStringConditionBuilder());
    return builders;
  }
}
