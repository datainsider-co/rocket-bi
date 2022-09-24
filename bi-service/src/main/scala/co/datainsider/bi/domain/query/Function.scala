package co.datainsider.bi.domain.query

import co.datainsider.bi.domain.Order.Order
import co.datainsider.bi.domain.{Order, OrderType}
import com.fasterxml.jackson.annotation.JsonSubTypes.Type
import com.fasterxml.jackson.annotation.{JsonSubTypes, JsonTypeInfo}
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration

@JsonTypeInfo(
  use = JsonTypeInfo.Id.NAME,
  include = JsonTypeInfo.As.PROPERTY,
  property = "class_name"
)
@JsonSubTypes(
  Array(
    new Type(value = classOf[Select], name = "select"),
    new Type(value = classOf[SelectDistinct], name = "select_distinct"),
    new Type(value = classOf[GroupBy], name = "group"),
    new Type(value = classOf[Count], name = "count"),
    new Type(value = classOf[CountDistinct], name = "count_distinct"),
    new Type(value = classOf[Avg], name = "avg"),
    new Type(value = classOf[Sum], name = "sum"),
    new Type(value = classOf[Min], name = "min"),
    new Type(value = classOf[Max], name = "max"),
    new Type(value = classOf[First], name = "first"),
    new Type(value = classOf[Last], name = "last"),
    new Type(value = classOf[OrderBy], name = "order_by"),
    new Type(value = classOf[Limit], name = "limit"),
    new Type(value = classOf[SelectAll], name = "select_all"),
    new Type(value = classOf[CountAll], name = "count_all"),
    new Type(value = classOf[SelectNull], name = "select_null"),
    new Type(value = classOf[SelectExpr], name = "select_expr"),
    new Type(value = classOf[SelectExpression], name = "select_expression"),
    new Type(value = classOf[DynamicFunction], name = "dynamic_function")
  )
)
abstract class Function

abstract class FieldRelatedFunction extends Function {
  val field: Field
  val scalarFunction: Option[ScalarFunction]
  val aliasName: Option[String]
}

case class Select(field: Field, scalarFunction: Option[ScalarFunction] = None, aliasName: Option[String] = None)
    extends FieldRelatedFunction

case class SelectDistinct(field: Field, scalarFunction: Option[ScalarFunction] = None, aliasName: Option[String] = None)
    extends FieldRelatedFunction

case class GroupBy(field: Field, scalarFunction: Option[ScalarFunction] = None, aliasName: Option[String] = None)
    extends FieldRelatedFunction

case class Count(field: Field, scalarFunction: Option[ScalarFunction] = None, aliasName: Option[String] = None)
    extends FieldRelatedFunction

case class CountDistinct(field: Field, scalarFunction: Option[ScalarFunction] = None, aliasName: Option[String] = None)
    extends FieldRelatedFunction

case class Avg(field: Field, scalarFunction: Option[ScalarFunction] = None, aliasName: Option[String] = None)
    extends FieldRelatedFunction

case class Sum(field: Field, scalarFunction: Option[ScalarFunction] = None, aliasName: Option[String] = None)
    extends FieldRelatedFunction

case class Min(field: Field, scalarFunction: Option[ScalarFunction] = None, aliasName: Option[String] = None)
    extends FieldRelatedFunction

case class Max(field: Field, scalarFunction: Option[ScalarFunction] = None, aliasName: Option[String] = None)
    extends FieldRelatedFunction

case class First(field: Field, scalarFunction: Option[ScalarFunction] = None, aliasName: Option[String] = None)
    extends FieldRelatedFunction

case class Last(field: Field, scalarFunction: Option[ScalarFunction] = None, aliasName: Option[String] = None)
    extends FieldRelatedFunction

case class SelectExpression(
    field: ExpressionField,
    scalarFunction: Option[ScalarFunction] = None,
    aliasName: Option[String] = None
) extends FieldRelatedFunction

// functions that control behaviour of data
@JsonTypeInfo(
  use = JsonTypeInfo.Id.NAME,
  include = JsonTypeInfo.As.PROPERTY,
  property = "class_name"
)
@JsonSubTypes(
  Array(
    new Type(value = classOf[OrderBy], name = "order_by"),
    new Type(value = classOf[Limit], name = "limit"),
    new Type(value = classOf[SelectAll], name = "select_all"),
    new Type(value = classOf[CountAll], name = "count_all"),
    new Type(value = classOf[SelectNull], name = "select_null"),
    new Type(value = classOf[SelectExpr], name = "select_expr"),
    new Type(value = classOf[DynamicFunction], name = "dynamic_function")
  )
)
abstract class ControlFunction extends Function

case class OrderBy(
    function: Function,
    @JsonScalaEnumeration(classOf[OrderType])
    order: Order = Order.ASC,
    numElemsShown: Option[Int] = None
) extends ControlFunction

case class Limit(offset: Int, size: Int) extends ControlFunction

case class SelectAll() extends ControlFunction

case class SelectNull() extends ControlFunction

case class CountAll(aliasName: Option[String] = None) extends ControlFunction

case class SelectExpr(expr: String, aliasName: Option[String]) extends ControlFunction

case class DynamicFunction(
    dynamicWidgetId: Long,
    baseFunction: Function,
    finalFunction: Option[Function] = None
) extends ControlFunction

// functions that apply per row to transform data
@JsonTypeInfo(
  use = JsonTypeInfo.Id.NAME,
  include = JsonTypeInfo.As.PROPERTY,
  property = "class_name"
)
@JsonSubTypes(
  Array(
    new Type(value = classOf[ToYear], name = "to_year"),
    new Type(value = classOf[ToQuarter], name = "to_quarter"),
    new Type(value = classOf[ToMonth], name = "to_month"),
    new Type(value = classOf[ToWeek], name = "to_week"),
    new Type(value = classOf[ToDate], name = "to_date"),
    new Type(value = classOf[ToDateTime], name = "to_date_time"),
    new Type(value = classOf[ToDayOfYear], name = "to_day_of_year"),
    new Type(value = classOf[ToDayOfMonth], name = "to_day_of_month"),
    new Type(value = classOf[ToDayOfWeek], name = "to_day_of_week"),
    new Type(value = classOf[ToHour], name = "to_hour"),
    new Type(value = classOf[ToMinute], name = "to_minute"),
    new Type(value = classOf[ToSecond], name = "to_second"),
    new Type(value = classOf[ToYearNum], name = "to_year_num"),
    new Type(value = classOf[ToQuarterNum], name = "to_quarter_num"),
    new Type(value = classOf[ToMonthNum], name = "to_month_num"),
    new Type(value = classOf[ToWeekNum], name = "to_week_num"),
    new Type(value = classOf[ToDayNum], name = "to_day_num"),
    new Type(value = classOf[ToHourNum], name = "to_hour_num"),
    new Type(value = classOf[ToMinuteNum], name = "to_minute_num"),
    new Type(value = classOf[ToSecondNum], name = "to_second_num"),
    new Type(value = classOf[GetArrayElement], name = "get_array_element"),
    new Type(value = classOf[DateDiff], name = "date_diff"),
    new Type(value = classOf[Decrypt], name = "decrypt"),
    new Type(value = classOf[SecondsToDateTime], name = "seconds_to_datetime"),
    new Type(value = classOf[MillisToDateTime], name = "millis_to_datetime"),
    new Type(value = classOf[NanosToDateTime], name = "nanos_to_datetime"),
    new Type(value = classOf[DatetimeToSeconds], name = "datetime_to_seconds"),
    new Type(value = classOf[DatetimeToMillis], name = "datetime_to_millis"),
    new Type(value = classOf[DatetimeToNanos], name = "datetime_to_nanos"),
    new Type(value = classOf[PastNYear], name = "past_n_year"),
    new Type(value = classOf[PastNQuarter], name = "past_n_quarter"),
    new Type(value = classOf[PastNMonth], name = "past_n_month"),
    new Type(value = classOf[PastNWeek], name = "past_n_week"),
    new Type(value = classOf[PastNDay], name = "past_n_day")
  )
)
abstract class ScalarFunction {
  val innerFn: Option[ScalarFunction]
}

case class ToYear(innerFn: Option[ScalarFunction] = None) extends ScalarFunction

case class ToQuarter(innerFn: Option[ScalarFunction] = None) extends ScalarFunction

case class ToMonth(innerFn: Option[ScalarFunction] = None) extends ScalarFunction

case class ToWeek(innerFn: Option[ScalarFunction] = None) extends ScalarFunction

case class ToDate(innerFn: Option[ScalarFunction] = None) extends ScalarFunction

case class ToDateTime(innerFn: Option[ScalarFunction] = None) extends ScalarFunction

case class ToDayOfYear(innerFn: Option[ScalarFunction] = None) extends ScalarFunction

case class ToDayOfMonth(innerFn: Option[ScalarFunction] = None) extends ScalarFunction

case class ToDayOfWeek(innerFn: Option[ScalarFunction] = None) extends ScalarFunction

case class ToHour(innerFn: Option[ScalarFunction] = None) extends ScalarFunction

case class ToMinute(innerFn: Option[ScalarFunction] = None) extends ScalarFunction

case class ToSecond(innerFn: Option[ScalarFunction] = None) extends ScalarFunction

case class ToYearNum(innerFn: Option[ScalarFunction] = None) extends ScalarFunction

case class ToQuarterNum(innerFn: Option[ScalarFunction] = None) extends ScalarFunction

case class ToMonthNum(innerFn: Option[ScalarFunction] = None) extends ScalarFunction

case class ToWeekNum(innerFn: Option[ScalarFunction] = None) extends ScalarFunction

case class ToDayNum(innerFn: Option[ScalarFunction] = None) extends ScalarFunction

case class ToHourNum(innerFn: Option[ScalarFunction] = None) extends ScalarFunction

case class ToMinuteNum(innerFn: Option[ScalarFunction] = None) extends ScalarFunction

case class ToSecondNum(innerFn: Option[ScalarFunction] = None) extends ScalarFunction

case class DateDiff(unit: String, fromDate: String, innerFn: Option[ScalarFunction] = None) extends ScalarFunction

case class Decrypt(innerFn: Option[ScalarFunction] = None) extends ScalarFunction

/**
  * Indexes in an array begin from one.
  */
case class GetArrayElement(innerFn: Option[ScalarFunction] = None, index: Option[Int] = None) extends ScalarFunction

// Datetime conversion
case class SecondsToDateTime(innerFn: Option[ScalarFunction] = None) extends ScalarFunction

case class MillisToDateTime(innerFn: Option[ScalarFunction] = None) extends ScalarFunction

case class NanosToDateTime(innerFn: Option[ScalarFunction] = None) extends ScalarFunction

case class DatetimeToSeconds(innerFn: Option[ScalarFunction] = None) extends ScalarFunction

case class DatetimeToMillis(innerFn: Option[ScalarFunction] = None) extends ScalarFunction

case class DatetimeToNanos(innerFn: Option[ScalarFunction] = None) extends ScalarFunction

// Date interval
case class PastNYear(nYear: Int, innerFn: Option[ScalarFunction] = None) extends ScalarFunction

case class PastNQuarter(nQuarter: Int, innerFn: Option[ScalarFunction] = None) extends ScalarFunction

case class PastNMonth(nMonth: Int, innerFn: Option[ScalarFunction] = None) extends ScalarFunction

case class PastNWeek(nWeek: Int, innerFn: Option[ScalarFunction] = None) extends ScalarFunction

case class PastNDay(nDay: Int, innerFn: Option[ScalarFunction] = None) extends ScalarFunction
