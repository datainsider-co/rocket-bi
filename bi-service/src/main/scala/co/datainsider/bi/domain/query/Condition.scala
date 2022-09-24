package co.datainsider.bi.domain.query

import com.fasterxml.jackson.annotation.JsonSubTypes.Type
import com.fasterxml.jackson.annotation.{JsonSubTypes, JsonTypeInfo}

@JsonTypeInfo(
  use = JsonTypeInfo.Id.NAME,
  include = JsonTypeInfo.As.PROPERTY,
  property = "class_name"
)
@JsonSubTypes(
  Array(
    new Type(value = classOf[And], name = "and"),
    new Type(value = classOf[Or], name = "or"),
    new Type(value = classOf[EqualField], name = "equal_field"),
    new Type(value = classOf[NotEqualField], name = "not_equal_field"),
    new Type(value = classOf[Null], name = "null"),
    new Type(value = classOf[NotNull], name = "not_null"),
    new Type(value = classOf[Empty], name = "empty"),
    new Type(value = classOf[NotEmpty], name = "not_empty"),
    new Type(value = classOf[Equal], name = "equal"),
    new Type(value = classOf[NotEqual], name = "not_equal"),
    new Type(value = classOf[GreaterThan], name = "greater_than"),
    new Type(value = classOf[GreaterThanOrEqual], name = "greater_than_or_equal"),
    new Type(value = classOf[LessThan], name = "less_than"),
    new Type(value = classOf[LessThanOrEqual], name = "less_than_or_equal"),
    new Type(value = classOf[MatchRegex], name = "match_regex"),
    new Type(value = classOf[Like], name = "like"),
    new Type(value = classOf[NotLike], name = "not_like"),
    new Type(value = classOf[LikeCaseInsensitive], name = "like_case_insensitive"),
    new Type(value = classOf[NotLikeCaseInsensitive], name = "not_like_case_insensitive"),
    new Type(value = classOf[Between], name = "between"),
    new Type(value = classOf[BetweenAndIncluding], name = "between_and_including"),
    new Type(value = classOf[In], name = "in"),
    new Type(value = classOf[NotIn], name = "not_in"),
    new Type(value = classOf[LastNMinute], name = "last_n_minute"),
    new Type(value = classOf[LastNHour], name = "last_n_hour"),
    new Type(value = classOf[LastNDay], name = "last_n_day"),
    new Type(value = classOf[LastNWeek], name = "last_n_week"),
    new Type(value = classOf[LastNMonth], name = "last_n_month"),
    new Type(value = classOf[LastNQuarter], name = "last_n_quarter"),
    new Type(value = classOf[LastNYear], name = "last_n_year"),
    new Type(value = classOf[CurrentDay], name = "current_day"),
    new Type(value = classOf[CurrentMonth], name = "current_month"),
    new Type(value = classOf[CurrentQuarter], name = "current_quarter"),
    new Type(value = classOf[CurrentWeek], name = "current_week"),
    new Type(value = classOf[CurrentYear], name = "current_year"),
    new Type(value = classOf[AggregateEqual], name = "aggregate_equal"),
    new Type(value = classOf[AggregateNotEqual], name = "aggregate_not_equal"),
    new Type(value = classOf[AggregateLessThan], name = "aggregate_less_than"),
    new Type(value = classOf[AggregateLessThanOrEqual], name = "aggregate_less_than_or_equal"),
    new Type(value = classOf[AggregateGreaterThan], name = "aggregate_greater_than"),
    new Type(value = classOf[AggregateGreaterThanOrEqual], name = "aggregate_greater_than_or_equal"),
    new Type(value = classOf[AggregateBetween], name = "aggregate_between"),
    new Type(value = classOf[AggregateBetweenAndIncluding], name = "aggregate_between_and_including"),
    new Type(value = classOf[DynamicCondition], name = "dynamic_condition"),
    new Type(value = classOf[AlwaysTrue], name = "always_true"),
    new Type(value = classOf[AlwaysFalse], name = "always_false")
  )
)
abstract class Condition

abstract class FieldRelatedCondition extends Condition {
  val field: Field
  val scalarFunction: Option[ScalarFunction]
}

case class Null(field: Field, scalarFunction: Option[ScalarFunction] = None) extends FieldRelatedCondition

case class NotNull(field: Field, scalarFunction: Option[ScalarFunction] = None) extends FieldRelatedCondition

case class Empty(field: Field, scalarFunction: Option[ScalarFunction] = None) extends FieldRelatedCondition

case class NotEmpty(field: Field, scalarFunction: Option[ScalarFunction] = None) extends FieldRelatedCondition

case class Equal(field: Field, value: String, scalarFunction: Option[ScalarFunction] = None)
    extends FieldRelatedCondition

case class NotEqual(field: Field, value: String, scalarFunction: Option[ScalarFunction] = None)
    extends FieldRelatedCondition

case class GreaterThan(field: Field, value: String, scalarFunction: Option[ScalarFunction] = None)
    extends FieldRelatedCondition

case class GreaterThanOrEqual(field: Field, value: String, scalarFunction: Option[ScalarFunction] = None)
    extends FieldRelatedCondition

case class LessThan(field: Field, value: String, scalarFunction: Option[ScalarFunction] = None)
    extends FieldRelatedCondition

case class LessThanOrEqual(field: Field, value: String, scalarFunction: Option[ScalarFunction] = None)
    extends FieldRelatedCondition

case class MatchRegex(field: Field, value: String, scalarFunction: Option[ScalarFunction] = None)
    extends FieldRelatedCondition

case class Like(field: Field, value: String, scalarFunction: Option[ScalarFunction] = None)
    extends FieldRelatedCondition

case class NotLike(field: Field, value: String, scalarFunction: Option[ScalarFunction] = None)
    extends FieldRelatedCondition

case class LikeCaseInsensitive(field: Field, value: String, scalarFunction: Option[ScalarFunction] = None)
    extends FieldRelatedCondition

case class NotLikeCaseInsensitive(field: Field, value: String, scalarFunction: Option[ScalarFunction] = None)
    extends FieldRelatedCondition

case class Between(field: Field, min: String, max: String, scalarFunction: Option[ScalarFunction] = None)
    extends FieldRelatedCondition

case class BetweenAndIncluding(field: Field, min: String, max: String, scalarFunction: Option[ScalarFunction] = None)
    extends FieldRelatedCondition

case class In(field: Field, possibleValues: Set[String], scalarFunction: Option[ScalarFunction] = None)
    extends FieldRelatedCondition

case class NotIn(field: Field, possibleValues: Set[String], scalarFunction: Option[ScalarFunction] = None)
    extends FieldRelatedCondition

case class LastNMinute(
    field: Field,
    nMinute: String,
    scalarFunction: Option[ScalarFunction] = None,
    intervalFunction: Option[ScalarFunction] = None
) extends FieldRelatedCondition

case class LastNHour(
    field: Field,
    nHour: Int,
    scalarFunction: Option[ScalarFunction] = None,
    intervalFunction: Option[ScalarFunction] = None
) extends FieldRelatedCondition

case class LastNDay(
    field: Field,
    nDay: Int,
    scalarFunction: Option[ScalarFunction] = None,
    intervalFunction: Option[ScalarFunction] = None
) extends FieldRelatedCondition

case class LastNWeek(
    field: Field,
    nWeek: Int,
    scalarFunction: Option[ScalarFunction] = None,
    intervalFunction: Option[ScalarFunction] = None
) extends FieldRelatedCondition

case class LastNMonth(
    field: Field,
    nMonth: Int,
    scalarFunction: Option[ScalarFunction] = None,
    intervalFunction: Option[ScalarFunction] = None
) extends FieldRelatedCondition

case class LastNQuarter(
    field: Field,
    nQuarter: Int,
    scalarFunction: Option[ScalarFunction] = None,
    intervalFunction: Option[ScalarFunction] = None
) extends FieldRelatedCondition

case class LastNYear(
    field: Field,
    nYear: Int,
    scalarFunction: Option[ScalarFunction] = None,
    intervalFunction: Option[ScalarFunction] = None
) extends FieldRelatedCondition

case class CurrentDay(
    field: Field,
    scalarFunction: Option[ScalarFunction] = None,
    intervalFunction: Option[ScalarFunction] = None
) extends FieldRelatedCondition

case class CurrentWeek(
    field: Field,
    scalarFunction: Option[ScalarFunction] = None,
    intervalFunction: Option[ScalarFunction] = None
) extends FieldRelatedCondition

case class CurrentMonth(
    field: Field,
    scalarFunction: Option[ScalarFunction] = None,
    intervalFunction: Option[ScalarFunction] = None
) extends FieldRelatedCondition

case class CurrentQuarter(
    field: Field,
    scalarFunction: Option[ScalarFunction] = None,
    intervalFunction: Option[ScalarFunction] = None
) extends FieldRelatedCondition

case class CurrentYear(
    field: Field,
    scalarFunction: Option[ScalarFunction] = None,
    intervalFunction: Option[ScalarFunction] = None
) extends FieldRelatedCondition

// function used in having clause
abstract class AggregateCondition extends Condition {
  val function: FieldRelatedFunction
}

case class AggregateEqual(function: FieldRelatedFunction, value: String) extends AggregateCondition

case class AggregateNotEqual(function: FieldRelatedFunction, value: String) extends AggregateCondition

case class AggregateLessThan(function: FieldRelatedFunction, value: String) extends AggregateCondition

case class AggregateLessThanOrEqual(function: FieldRelatedFunction, value: String) extends AggregateCondition

case class AggregateGreaterThan(function: FieldRelatedFunction, value: String) extends AggregateCondition

case class AggregateGreaterThanOrEqual(function: FieldRelatedFunction, value: String) extends AggregateCondition

case class AggregateBetween(function: FieldRelatedFunction, min: String, max: String) extends AggregateCondition

case class AggregateBetweenAndIncluding(function: FieldRelatedFunction, min: String, max: String)
    extends AggregateCondition

// condition to control behaviour of query
@JsonTypeInfo(
  use = JsonTypeInfo.Id.NAME,
  include = JsonTypeInfo.As.PROPERTY,
  property = "class_name"
)
@JsonSubTypes(
  Array(
    new Type(value = classOf[And], name = "and"),
    new Type(value = classOf[Or], name = "or"),
    new Type(value = classOf[EqualField], name = "equal_field"),
    new Type(value = classOf[NotEqualField], name = "not_equal_field"),
    new Type(value = classOf[LessThanField], name = "less_than_field"),
    new Type(value = classOf[GreaterThanField], name = "greater_than_field"),
    new Type(value = classOf[LessOrEqualField], name = "less_or_equal_field"),
    new Type(value = classOf[GreaterOrEqualField], name = "greater_or_equal_field")
  )
)
abstract class ControlCondition extends Condition

case class And(conditions: Array[Condition]) extends ControlCondition

case class Or(conditions: Array[Condition]) extends ControlCondition

case class EqualField(
    leftField: Field,
    rightField: Field,
    leftScalarFunction: Option[ScalarFunction] = None,
    rightScalarFunction: Option[ScalarFunction] = None
) extends ControlCondition

case class GreaterThanField(
    leftField: Field,
    rightField: Field,
    leftScalarFunction: Option[ScalarFunction] = None,
    rightScalarFunction: Option[ScalarFunction] = None
) extends ControlCondition

case class LessThanField(
    leftField: Field,
    rightField: Field,
    leftScalarFunction: Option[ScalarFunction] = None,
    rightScalarFunction: Option[ScalarFunction] = None
) extends ControlCondition

case class GreaterOrEqualField(
    leftField: Field,
    rightField: Field,
    leftScalarFunction: Option[ScalarFunction] = None,
    rightScalarFunction: Option[ScalarFunction] = None
) extends ControlCondition

case class LessOrEqualField(
    leftField: Field,
    rightField: Field,
    leftScalarFunction: Option[ScalarFunction] = None,
    rightScalarFunction: Option[ScalarFunction] = None
) extends ControlCondition

case class NotEqualField(
    leftField: Field,
    rightField: Field,
    leftScalarFunction: Option[ScalarFunction] = None,
    rightScalarFunction: Option[ScalarFunction] = None
) extends ControlCondition

case class DynamicCondition(
    dynamicWidgetId: Long,
    baseCondition: Condition,
    finalCondition: Option[Condition] = None
) extends ControlCondition

case class AlwaysTrue() extends ControlCondition

case class AlwaysFalse() extends ControlCondition

// ========================= condition to join views =========================

abstract class JoinCondition extends Condition {
  val leftView: QueryView
  val rightView: QueryView
  val equals: Seq[EqualField]
}

case class InnerJoin(leftView: QueryView, rightView: QueryView, equals: Seq[EqualField]) extends JoinCondition

case class LeftJoin(leftView: QueryView, rightView: QueryView, equals: Seq[EqualField]) extends JoinCondition

case class RightJoin(leftView: QueryView, rightView: QueryView, equals: Seq[EqualField]) extends JoinCondition
