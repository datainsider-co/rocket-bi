/*
 * @author: tvc12 - Thien Vi
 * @created: 1/8/21, 10:55 AM
 */
/* eslint max-len: 0 */

import { ConditionBuilder } from '@core/common/services/condition-builder/ConditionBuilder';
import {
  Between,
  BetweenAndIncluding,
  Condition,
  DynamicValueCondition,
  Equal,
  Field,
  FieldRelatedCondition,
  GreaterThan,
  GreaterThanOrEqual,
  In,
  LessThan,
  LessThanOrEqual,
  NotEqual,
  NotIn,
  NotNull,
  Null
} from '@core/common/domain/model';
import { ConditionData, NumberConditionTypes, StringConditionTypes } from '@/shared';
import { ListUtils } from '@/utils';
import { createConditionIfPassChecking, isNotEmpty } from '@core/common/services';
import { isNumber } from 'lodash';

export class DynamicNumberConditionBuilder implements ConditionBuilder {
  private readonly builderAsMap: Map<string, (field: Field, firstValue: string, secondValue: string, allValues: string[]) => FieldRelatedCondition | undefined>;
  private readonly dynamicBuilderAsMap: Map<
    string,
    (field: Field, firstValue: string, secondValue: string, allValues: string[]) => FieldRelatedCondition | undefined
  >;

  constructor() {
    this.builderAsMap = this.buildBuilder();
    this.dynamicBuilderAsMap = this.buildDynamicBuilder();
  }
  buildCondition(condition: ConditionData): Condition | undefined {
    const firstValue = ConditionBuilder.getFirstValue(condition);
    const secondValue = ConditionBuilder.getSecondValue(condition);
    const allValues = ConditionBuilder.getAllValues(condition);
    const field = condition.field;
    const tabControlData = condition!.tabControl!;

    const finalConditionBuilder = this.builderAsMap.get(condition.subType || '');
    const finalCondition = finalConditionBuilder ? finalConditionBuilder(field, firstValue, secondValue, allValues.filter(isNotEmpty)) : void 0;

    const baseConditionBuilder = this.dynamicBuilderAsMap.get(condition.subType || '');
    const baseCondition = baseConditionBuilder ? baseConditionBuilder(field, firstValue || '0', secondValue || '0', allValues) : void 0;

    return baseCondition ? new DynamicValueCondition(baseCondition, tabControlData.id, tabControlData.displayName, finalCondition) : void 0;
  }

  private buildDynamicBuilder() {
    const builders = new Map<string, (field: Field, firstValue: string, secondValue: string, allValues: string[]) => FieldRelatedCondition | undefined>();
    builders
      .set(NumberConditionTypes.in, (field, firstValue, secondValue, allValues) => new In(field, allValues))
      .set(NumberConditionTypes.notIn, (field, firstValue, secondValue, allValues) => new NotIn(field, allValues))
      .set(NumberConditionTypes.equal, (field, firstValue) => new Equal(field, firstValue))
      .set(NumberConditionTypes.notEqual, (field, firstValue) => new NotEqual(field, firstValue))
      .set(StringConditionTypes.isnull, field => new Null(field))
      .set(StringConditionTypes.notNull, field => new NotNull(field))
      .set(NumberConditionTypes.greaterThan, (field, firstValue) => new GreaterThan(field, firstValue))
      .set(NumberConditionTypes.greaterThanOrEqual, (field, firstValue) => new GreaterThanOrEqual(field, firstValue))
      .set(NumberConditionTypes.lessThan, (field, firstValue) => new LessThan(field, firstValue))
      .set(NumberConditionTypes.lessThanOrEqual, (field, firstValue) => new LessThanOrEqual(field, firstValue))
      .set(NumberConditionTypes.between, (field, firstValue, secondValue) => new Between(field, firstValue, secondValue))
      .set(NumberConditionTypes.betweenAndIncluding, (field, firstValue, secondValue) => new BetweenAndIncluding(field, firstValue, secondValue));

    return builders;
  }
  private buildBuilder() {
    const builders = new Map<string, (field: Field, firstValue: string, secondValue: string, allValues: string[]) => FieldRelatedCondition | undefined>();
    builders
      .set(NumberConditionTypes.in, (field, firstValue, secondValue, allValues) =>
        createConditionIfPassChecking(ListUtils.isNotEmpty(allValues), () => new In(field, allValues))
      )
      .set(NumberConditionTypes.notIn, (field, firstValue, secondValue, allValues) =>
        createConditionIfPassChecking(ListUtils.isNotEmpty(allValues), () => new NotIn(field, allValues))
      )
      .set(NumberConditionTypes.equal, (field, firstValue) =>
        createConditionIfPassChecking(isNotEmpty(firstValue) && isNumber(firstValue), () => new Equal(field, firstValue))
      )
      .set(NumberConditionTypes.notEqual, (field, firstValue) =>
        createConditionIfPassChecking(isNotEmpty(firstValue) && isNumber(firstValue), () => new NotEqual(field, firstValue))
      )
      .set(StringConditionTypes.isnull, field => new Null(field))
      .set(StringConditionTypes.notNull, field => new NotNull(field))
      .set(NumberConditionTypes.greaterThan, (field, firstValue) =>
        createConditionIfPassChecking(isNotEmpty(firstValue) && isNumber(firstValue), () => new GreaterThan(field, firstValue))
      )
      .set(NumberConditionTypes.greaterThanOrEqual, (field, firstValue) =>
        createConditionIfPassChecking(isNotEmpty(firstValue) && isNumber(firstValue), () => new GreaterThanOrEqual(field, firstValue))
      )
      .set(NumberConditionTypes.lessThan, (field, firstValue) =>
        createConditionIfPassChecking(isNotEmpty(firstValue) && isNumber(firstValue), () => new LessThan(field, firstValue))
      )
      .set(NumberConditionTypes.lessThanOrEqual, (field, firstValue) =>
        createConditionIfPassChecking(isNotEmpty(firstValue) && isNumber(firstValue), () => new LessThanOrEqual(field, firstValue))
      )
      .set(NumberConditionTypes.between, (field, firstValue, secondValue) =>
        createConditionIfPassChecking(
          isNotEmpty(firstValue) && isNotEmpty(secondValue) && isNumber(firstValue) && isNumber(secondValue),
          () => new Between(field, firstValue, secondValue)
        )
      )
      .set(NumberConditionTypes.betweenAndIncluding, (field, firstValue, secondValue) =>
        createConditionIfPassChecking(
          isNotEmpty(firstValue) && isNotEmpty(secondValue) && isNumber(firstValue) && isNumber(secondValue),
          () => new BetweenAndIncluding(field, firstValue, secondValue)
        )
      );

    return builders;
  }
}
