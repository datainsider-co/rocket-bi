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

export const createConditionIfPassChecking = (checkingCondition: boolean, creator: () => FieldRelatedCondition): FieldRelatedCondition | undefined => {
  if (checkingCondition) {
    return creator();
  } else {
    return void 0;
  }
};

export const isNotEmpty = (firstValue: string) => {
  return firstValue !== '';
};

export class NumberConditionBuilder implements ConditionBuilder {
  private readonly builderAsMap: Map<string, (field: Field, firstValue: string, secondValue: string, allValues: string[]) => FieldRelatedCondition | undefined>;

  constructor() {
    this.builderAsMap = this.buildBuilder();
  }

  buildCondition(condition: ConditionData): Condition | undefined {
    const firstValue = ConditionBuilder.getFirstValue(condition);
    const secondValue = ConditionBuilder.getSecondValue(condition);
    const allValues = ConditionBuilder.getAllValues(condition) ?? [firstValue, secondValue];
    const field = condition.field;

    const builder = this.builderAsMap.get(condition.subType || '');
    if (builder) {
      return builder(field, firstValue, secondValue, allValues.filter(isNotEmpty));
    }
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
      .set(NumberConditionTypes.equal, (field, firstValue) => createConditionIfPassChecking(isNotEmpty(firstValue), () => new Equal(field, firstValue)))
      .set(NumberConditionTypes.notEqual, (field, firstValue) => createConditionIfPassChecking(isNotEmpty(firstValue), () => new NotEqual(field, firstValue)))
      .set(StringConditionTypes.isnull, field => new Null(field))
      .set(StringConditionTypes.notNull, field => new NotNull(field))
      .set(NumberConditionTypes.greaterThan, (field, firstValue) =>
        createConditionIfPassChecking(isNotEmpty(firstValue), () => new GreaterThan(field, firstValue))
      )
      .set(NumberConditionTypes.greaterThanOrEqual, (field, firstValue) =>
        createConditionIfPassChecking(isNotEmpty(firstValue), () => new GreaterThanOrEqual(field, firstValue))
      )
      .set(NumberConditionTypes.lessThan, (field, firstValue) => createConditionIfPassChecking(isNotEmpty(firstValue), () => new LessThan(field, firstValue)))
      .set(NumberConditionTypes.lessThanOrEqual, (field, firstValue) =>
        createConditionIfPassChecking(isNotEmpty(firstValue), () => new LessThanOrEqual(field, firstValue))
      )
      .set(NumberConditionTypes.between, (field, firstValue, secondValue) =>
        createConditionIfPassChecking(isNotEmpty(firstValue) && isNotEmpty(firstValue), () => new Between(field, firstValue, secondValue))
      )
      .set(NumberConditionTypes.betweenAndIncluding, (field, firstValue, secondValue) =>
        createConditionIfPassChecking(isNotEmpty(firstValue) && isNotEmpty(firstValue), () => new BetweenAndIncluding(field, firstValue, secondValue))
      );

    return builders;
  }
}
