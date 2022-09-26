import {
  AlwaysFalse,
  AlwaysTrue,
  And,
  Between,
  BetweenAndIncluding,
  ConditionType,
  CurrentDay,
  CurrentMonth,
  CurrentQuarter,
  CurrentWeek,
  CurrentYear,
  DynamicValueCondition,
  Empty,
  Equal,
  EqualField,
  Field,
  FieldRelatedCondition,
  GreaterThan,
  GreaterThanOrEqual,
  In,
  LastNDay,
  LastNHour,
  LastNMinute,
  LastNMonth,
  LastNQuarter,
  LastNWeek,
  LastNYear,
  LessThan,
  LessThanOrEqual,
  Like,
  LikeCaseInsensitive,
  MatchRegex,
  NotEmpty,
  NotEqual,
  NotEqualField,
  NotIn,
  NotLike,
  NotLikeCaseInsensitive,
  NotNull,
  Null,
  Or
} from '@core/domain/Model';
import { ClassNotFound } from '@core/domain/Exception/ClassNotFound';
import { Log } from '@core/utils';

export abstract class Condition {
  abstract className: ConditionType;

  getAllFields(): Field[] {
    return [];
  }

  static fromObject(obj: any): Condition | FieldRelatedCondition {
    // Log.debug('Condition::fromObject::', obj);
    switch (obj.className) {
      case ConditionType.And:
        return And.fromObject(obj);
      case ConditionType.Or:
        return Or.fromObject(obj);
      case ConditionType.IsNull:
        return Null.fromObject(obj);
      case ConditionType.NotNull:
        return NotNull.fromObject(obj);
      case ConditionType.Equal:
        return Equal.fromObject(obj);
      case ConditionType.NotEqual:
        return NotEqual.fromObject(obj);
      case ConditionType.EqualField:
        return EqualField.fromObject(obj);
      case ConditionType.NotEqualField:
        return NotEqualField.fromObject(obj);
      case ConditionType.GreaterThan:
        return GreaterThan.fromObject(obj);
      case ConditionType.GreaterThanOrEqual:
        return GreaterThanOrEqual.fromObject(obj);
      case ConditionType.LessThan:
        return LessThan.fromObject(obj);
      case ConditionType.LessThanOrEqual:
        return LessThanOrEqual.fromObject(obj);
      case ConditionType.MatchRegex:
        return MatchRegex.fromObject(obj);
      case ConditionType.Like:
        return Like.fromObject(obj);
      case ConditionType.NotLike:
        return NotLike.fromObject(obj);
      case ConditionType.LikeCaseInsensitive:
        return LikeCaseInsensitive.fromObject(obj);
      case ConditionType.NotLikeCaseInsensitive:
        return NotLikeCaseInsensitive.fromObject(obj);
      case ConditionType.Between:
        return Between.fromObject(obj);
      case ConditionType.BetweenAndIncluding:
        return BetweenAndIncluding.fromObject(obj);
      case ConditionType.IsIn:
        return In.fromObject(obj);
      case ConditionType.NotIn:
        return NotIn.fromObject(obj);
      case ConditionType.LastNMinute:
        return LastNMinute.fromObject(obj);
      case ConditionType.LastNHour:
        return LastNHour.fromObject(obj);
      case ConditionType.LastNDay:
        return LastNDay.fromObject(obj);
      case ConditionType.LastNWeek:
        return LastNWeek.fromObject(obj);
      case ConditionType.LastNMonth:
        return LastNMonth.fromObject(obj);
      case ConditionType.LastNQuarter:
        return LastNQuarter.fromObject(obj);
      case ConditionType.LastNYear:
        return LastNYear.fromObject(obj);
      case ConditionType.CurrentDay:
        return CurrentDay.fromObject(obj);
      case ConditionType.CurrentMonth:
        return CurrentMonth.fromObject(obj);
      case ConditionType.CurrentQuarter:
        return CurrentQuarter.fromObject(obj);
      case ConditionType.CurrentYear:
        return CurrentYear.fromObject(obj);
      case ConditionType.CurrentWeek:
        return CurrentWeek.fromObject(obj);
      case ConditionType.IsEmpty:
        return Empty.fromObject(obj);
      case ConditionType.NotEmpty:
        return NotEmpty.fromObject(obj);
      case ConditionType.Dynamic:
        return DynamicValueCondition.fromObject(obj);
      case ConditionType.AlwaysTrue:
        return AlwaysTrue.fromObject(obj);
      case ConditionType.AlwaysFalse:
        return AlwaysFalse.fromObject(obj);
      default:
        throw new ClassNotFound(`fromObject: object with className ${obj.className} not found`);
    }
  }
}
