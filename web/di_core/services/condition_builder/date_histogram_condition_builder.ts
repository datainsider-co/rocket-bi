/*
 * @author: tvc12 - Thien Vi
 * @created: 1/8/21, 10:55 AM
 */
/* eslint max-len: 0 */

import { ConditionBuilder } from '@core/services/condition_builder/condition_builder';
import {
  Between,
  BetweenAndIncluding,
  Condition,
  CurrentDay,
  CurrentMonth,
  CurrentQuarter,
  CurrentWeek,
  CurrentYear,
  Equal,
  Field,
  FieldRelatedCondition,
  GreaterThan,
  In,
  LastNDay,
  LastNHour,
  LastNMinute,
  LastNMonth,
  LastNQuarter,
  LastNWeek,
  LastNYear,
  LessThan,
  NotEqual,
  NotIn,
  NotNull,
  Null
} from '@core/domain/Model';
import { ConditionData, DateHistogramConditionTypes, NumberConditionTypes, StringConditionTypes } from '@/shared';
import { createConditionIfPassChecking, isNotEmpty } from '@core/services/condition_builder/number_condition_builder';
import { ListUtils } from '@/utils';

export class DateHistogramConditionBuilder implements ConditionBuilder {
  private readonly builderAsMap: Map<string, (field: Field, firstValue: string, secondValue: string, allValues: string[]) => FieldRelatedCondition | undefined>;

  constructor() {
    this.builderAsMap = this.buildBuilder();
  }

  buildCondition(condition: ConditionData): Condition | undefined {
    const firstValue = ConditionBuilder.getFirstValue(condition);
    const secondValue = ConditionBuilder.getSecondValue(condition);
    const allValues = ConditionBuilder.getAllValues(condition);
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
      .set(DateHistogramConditionTypes.earlierThan, (field, firstValue) =>
        createConditionIfPassChecking(isNotEmpty(firstValue), () => new LessThan(field, firstValue))
      )
      .set(DateHistogramConditionTypes.laterThan, (field, firstValue) =>
        createConditionIfPassChecking(isNotEmpty(firstValue), () => new GreaterThan(field, firstValue))
      )
      .set(DateHistogramConditionTypes.between, (field, firstValue, secondValue) =>
        createConditionIfPassChecking(isNotEmpty(firstValue) && isNotEmpty(secondValue), () => new Between(field, firstValue, secondValue))
      )
      .set(DateHistogramConditionTypes.betweenAndIncluding, (field, firstValue, secondValue) =>
        createConditionIfPassChecking(isNotEmpty(firstValue) && isNotEmpty(secondValue), () => new BetweenAndIncluding(field, firstValue, secondValue))
      )
      .set(DateHistogramConditionTypes.lastNMinutes, (field, firstValue) =>
        createConditionIfPassChecking(isNotEmpty(firstValue), () => new LastNMinute(field, firstValue))
      )
      .set(DateHistogramConditionTypes.lastNHours, (field, firstValue) =>
        createConditionIfPassChecking(isNotEmpty(firstValue), () => new LastNHour(field, firstValue))
      )
      .set(DateHistogramConditionTypes.lastNDays, (field, firstValue) =>
        createConditionIfPassChecking(isNotEmpty(firstValue), () => new LastNDay(field, firstValue))
      )
      .set(DateHistogramConditionTypes.lastNQuarters, (field, firstValue) =>
        createConditionIfPassChecking(isNotEmpty(firstValue), () => new LastNQuarter(field, firstValue))
      )
      .set(DateHistogramConditionTypes.lastNWeeks, (field, firstValue) =>
        createConditionIfPassChecking(isNotEmpty(firstValue), () => new LastNWeek(field, firstValue))
      )
      .set(DateHistogramConditionTypes.lastNMonths, (field, firstValue) =>
        createConditionIfPassChecking(isNotEmpty(firstValue), () => new LastNMonth(field, firstValue))
      )
      .set(DateHistogramConditionTypes.lastNYears, (field, firstValue) =>
        createConditionIfPassChecking(isNotEmpty(firstValue), () => new LastNYear(field, firstValue))
      )
      .set(DateHistogramConditionTypes.currentDay, field => new CurrentDay(field))
      .set(DateHistogramConditionTypes.currentWeek, field => new CurrentWeek(field))
      .set(DateHistogramConditionTypes.currentMonth, field => new CurrentMonth(field))
      .set(DateHistogramConditionTypes.currentQuarter, field => new CurrentQuarter(field))
      .set(DateHistogramConditionTypes.currentYear, field => new CurrentYear(field));

    return builders;
  }
}
