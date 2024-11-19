package co.datainsider.bi.domain.query

import co.datainsider.bi.domain.Order.Order
import co.datainsider.bi.domain.{Order, OrderType}
import co.datainsider.schema.domain.column.ColType
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
abstract class Function {
  def isGroupByFunc: Boolean = {
    this match {
      case dynamicFunc: DynamicFunction => dynamicFunc.getFinalFunction.isGroupByFunc
      case _: GroupBy                   => true
      case _                            => false
    }
  }

  def isAggregateFunc: Boolean = {
    this match {
      case _: Min | _: Max | _: Sum | _: Count | _: CountDistinct | _: Avg | _: First | _: Last | _: CountAll |
          _: SelectExpr | _: SelectExpression =>
        true
      case dynamicFunc: DynamicFunction => dynamicFunc.getFinalFunction.isAggregateFunc
      case _                            => false
    }
  }
}

abstract class FieldRelatedFunction extends Function {
  val field: Field
  val scalarFunction: Option[ScalarFunction]
  val aliasName: Option[String]

  def customCopy(aliasName: Option[String]): FieldRelatedFunction
}

case class Select(field: Field, scalarFunction: Option[ScalarFunction] = None, aliasName: Option[String] = None)
    extends FieldRelatedFunction {
  override def customCopy(aliasName: Option[String]): FieldRelatedFunction = {
    this.copy(aliasName = aliasName)
  }
}

case class SelectDistinct(field: Field, scalarFunction: Option[ScalarFunction] = None, aliasName: Option[String] = None)
    extends FieldRelatedFunction {
  override def customCopy(aliasName: Option[String]): FieldRelatedFunction = {
    this.copy(aliasName = aliasName)
  }
}

case class GroupBy(field: Field, scalarFunction: Option[ScalarFunction] = None, aliasName: Option[String] = None)
    extends FieldRelatedFunction {
  override def customCopy(aliasName: Option[String]): FieldRelatedFunction = {
    this.copy(aliasName = aliasName)
  }
}

case class Count(field: Field, scalarFunction: Option[ScalarFunction] = None, aliasName: Option[String] = None)
    extends FieldRelatedFunction {
  override def customCopy(aliasName: Option[String]): FieldRelatedFunction = {
    this.copy(aliasName = aliasName)
  }
}

case class CountDistinct(field: Field, scalarFunction: Option[ScalarFunction] = None, aliasName: Option[String] = None)
    extends FieldRelatedFunction {
  override def customCopy(aliasName: Option[String]): FieldRelatedFunction = {
    this.copy(aliasName = aliasName)
  }
}

case class Avg(field: Field, scalarFunction: Option[ScalarFunction] = None, aliasName: Option[String] = None)
    extends FieldRelatedFunction {
  override def customCopy(aliasName: Option[String]): FieldRelatedFunction = {
    this.copy(aliasName = aliasName)
  }
}

case class Sum(field: Field, scalarFunction: Option[ScalarFunction] = None, aliasName: Option[String] = None)
    extends FieldRelatedFunction {
  override def customCopy(aliasName: Option[String]): FieldRelatedFunction = {
    this.copy(aliasName = aliasName)
  }
}

case class Min(field: Field, scalarFunction: Option[ScalarFunction] = None, aliasName: Option[String] = None)
    extends FieldRelatedFunction {
  override def customCopy(aliasName: Option[String]): FieldRelatedFunction = {
    this.copy(aliasName = aliasName)
  }
}

case class Max(field: Field, scalarFunction: Option[ScalarFunction] = None, aliasName: Option[String] = None)
    extends FieldRelatedFunction {
  override def customCopy(aliasName: Option[String]): FieldRelatedFunction = {
    this.copy(aliasName = aliasName)
  }
}

case class First(field: Field, scalarFunction: Option[ScalarFunction] = None, aliasName: Option[String] = None)
    extends FieldRelatedFunction {
  override def customCopy(aliasName: Option[String]): FieldRelatedFunction = {
    this.copy(aliasName = aliasName)
  }
}

case class Last(field: Field, scalarFunction: Option[ScalarFunction] = None, aliasName: Option[String] = None)
    extends FieldRelatedFunction {
  override def customCopy(aliasName: Option[String]): FieldRelatedFunction = {
    this.copy(aliasName = aliasName)
  }
}

case class SelectExpression(
    field: ExpressionField,
    scalarFunction: Option[ScalarFunction] = None,
    aliasName: Option[String] = None
) extends FieldRelatedFunction {
  override def customCopy(aliasName: Option[String]): FieldRelatedFunction = {
    this.copy(aliasName = aliasName)
  }
}

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

case class SelectExpr(expr: String, aliasName: Option[String] = None, scalarFunction: Option[ScalarFunction] = None)
    extends ControlFunction

case class DynamicFunction(
    dynamicWidgetId: Long,
    baseFunction: Function,
    finalFunction: Option[Function] = None
) extends ControlFunction {
  def getFinalFunction: Function = {
    require(
      finalFunction.isDefined && !finalFunction.get.isInstanceOf[DynamicFunction],
      "final function of dynamic function can not be another dynamic function"
    )
    finalFunction.get
  }
}

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
    new Type(value = classOf[PastNDay], name = "past_n_day"),
    new Type(value = classOf[Cast], name = "cast"),
    new Type(value = classOf[ToInt8OrNull], name = "to_int8_or_null"),
    new Type(value = classOf[ToInt16OrNull], name = "to_int16_or_null"),
    new Type(value = classOf[ToInt32OrNull], name = "to_int32_or_null"),
    new Type(value = classOf[ToInt64OrNull], name = "to_int64_or_null"),
    new Type(value = classOf[ToUInt8OrNull], name = "to_uint8_or_null"),
    new Type(value = classOf[ToUInt16OrNull], name = "to_uint16_or_null"),
    new Type(value = classOf[ToUInt32OrNull], name = "to_uint32_or_null"),
    new Type(value = classOf[ToUInt64OrNull], name = "to_uint64_or_null"),
    new Type(value = classOf[ToFloatOrNull], name = "to_float_or_null"),
    new Type(value = classOf[ToDoubleOrNull], name = "to_double_or_null"),
    new Type(value = classOf[ToDateOrNull], name = "to_date_or_null"),
    new Type(value = classOf[ToDateTimeOrNull], name = "to_date_time_or_null"),
    new Type(value = classOf[ToDateTime64OrNull], name = "to_date_time64_or_null"),
    new Type(value = classOf[ToStringOrNull], name = "to_string_or_null"),
  )
)
abstract class ScalarFunction {
  val innerFn: Option[ScalarFunction]
  val resultType: String
}

case class ToYear(innerFn: Option[ScalarFunction] = None, resultType: String = ColType.Int32) extends ScalarFunction

case class ToQuarter(innerFn: Option[ScalarFunction] = None, resultType: String = ColType.Int32) extends ScalarFunction

case class ToMonth(innerFn: Option[ScalarFunction] = None, resultType: String = ColType.Int32) extends ScalarFunction

case class ToWeek(innerFn: Option[ScalarFunction] = None, resultType: String = ColType.Int32) extends ScalarFunction

case class ToDate(innerFn: Option[ScalarFunction] = None, resultType: String = ColType.Date) extends ScalarFunction

case class ToDateTime(innerFn: Option[ScalarFunction] = None, resultType: String = ColType.DateTime)
    extends ScalarFunction

case class ToDayOfYear(innerFn: Option[ScalarFunction] = None, resultType: String = ColType.Int32)
    extends ScalarFunction

case class ToDayOfMonth(innerFn: Option[ScalarFunction] = None, resultType: String = ColType.Int32)
    extends ScalarFunction

case class ToDayOfWeek(innerFn: Option[ScalarFunction] = None, resultType: String = ColType.Int32)
    extends ScalarFunction

case class ToHour(innerFn: Option[ScalarFunction] = None, resultType: String = ColType.Int32) extends ScalarFunction

case class ToMinute(innerFn: Option[ScalarFunction] = None, resultType: String = ColType.Int32) extends ScalarFunction

case class ToSecond(innerFn: Option[ScalarFunction] = None, resultType: String = ColType.Int32) extends ScalarFunction

/**
  * return an int represent number of years since day 0 month 0 of year 0 (0000-00-00).
  * E.g: date = 2023-08-03 => toQuarterNum(date) = 2023
  */
case class ToYearNum(innerFn: Option[ScalarFunction] = None, resultType: String = ColType.Int32) extends ScalarFunction

/**
  * return an int represent number of quarters since day 0 month 0 of year 0 (0000-00-00).
  * E.g: date = 2023-08-03 => toQuarterNum(date) = 8094
  */
case class ToQuarterNum(innerFn: Option[ScalarFunction] = None, resultType: String = ColType.Int32)
    extends ScalarFunction

/**
  * return an int represent number of months since day 0 month 0 of year 0 (0000-00-00).
  * E.g: date = 2023-08-03 => toMonthNum(date) = 24284
  */
case class ToMonthNum(innerFn: Option[ScalarFunction] = None, resultType: String = ColType.Int32) extends ScalarFunction

/**
  * return an int represent number of weeks since day 1 month 1 of year 1970 (1970-01-01).
  * E.g: date = 2023-08-03 => toWeekNum(date) = 2796
  */
case class ToWeekNum(innerFn: Option[ScalarFunction] = None, resultType: String = ColType.Int32) extends ScalarFunction

/**
  * return an int represent number of days since day 1 month 1 of year 1970 (1970-01-01).
  * E.g: date = 2023-08-03 => toDayNum(date) = 19572
  */
case class ToDayNum(innerFn: Option[ScalarFunction] = None, resultType: String = ColType.Int32) extends ScalarFunction

/**
  * return an int represent number of hours since day 1 month 1 of year 1970 (1970-01-01).
  * E.g: date = 2023-08-03 => toHourNum(date) = 469728
  */
case class ToHourNum(innerFn: Option[ScalarFunction] = None, resultType: String = ColType.Int32) extends ScalarFunction

/**
  * return an int represent number of minutes since day 1 month 1 of year 1970 (1970-01-01).
  * E.g: date = 2023-08-03 => toMinuteNum(date) = 28183680
  */
case class ToMinuteNum(innerFn: Option[ScalarFunction] = None, resultType: String = ColType.Int32)
    extends ScalarFunction

/**
  * return an int represent number of seconds since day 1 month 1 of year 1970 (1970-01-01).
  * E.g: date = 2023-08-03 => toSecondNum(date) = 1691020800
  */
case class ToSecondNum(innerFn: Option[ScalarFunction] = None, resultType: String = ColType.Int32)
    extends ScalarFunction

case class DateDiff(
    unit: String,
    fromDate: String,
    innerFn: Option[ScalarFunction] = None,
    resultType: String = ColType.Int32
) extends ScalarFunction

case class Decrypt(innerFn: Option[ScalarFunction] = None, resultType: String = ColType.String) extends ScalarFunction

/**
  * Indexes in an array begin from one.
  */
case class GetArrayElement(
    innerFn: Option[ScalarFunction] = None,
    index: Option[Int] = None,
    resultType: String = ColType.String
) extends ScalarFunction

// Datetime conversion
case class SecondsToDateTime(innerFn: Option[ScalarFunction] = None, resultType: String = ColType.DateTime)
    extends ScalarFunction

case class MillisToDateTime(innerFn: Option[ScalarFunction] = None, resultType: String = ColType.DateTime)
    extends ScalarFunction

case class NanosToDateTime(innerFn: Option[ScalarFunction] = None, resultType: String = ColType.DateTime)
    extends ScalarFunction

case class DatetimeToSeconds(innerFn: Option[ScalarFunction] = None, resultType: String = ColType.Int32)
    extends ScalarFunction

case class DatetimeToMillis(innerFn: Option[ScalarFunction] = None, resultType: String = ColType.Int64)
    extends ScalarFunction

case class DatetimeToNanos(innerFn: Option[ScalarFunction] = None, resultType: String = ColType.Int64)
    extends ScalarFunction

// Date interval
case class PastNYear(nYear: Int, innerFn: Option[ScalarFunction] = None, resultType: String = ColType.DateTime)
    extends ScalarFunction

case class PastNQuarter(nQuarter: Int, innerFn: Option[ScalarFunction] = None, resultType: String = ColType.DateTime)
    extends ScalarFunction

case class PastNMonth(nMonth: Int, innerFn: Option[ScalarFunction] = None, resultType: String = ColType.DateTime)
    extends ScalarFunction

case class PastNWeek(nWeek: Int, innerFn: Option[ScalarFunction] = None, resultType: String = ColType.DateTime)
    extends ScalarFunction

case class PastNDay(nDay: Int, innerFn: Option[ScalarFunction] = None, resultType: String = ColType.DateTime)
    extends ScalarFunction

case class Cast(asType: String, innerFn: Option[ScalarFunction] = None) extends ScalarFunction {
  override val resultType: String = asType
}

case class ToInt8OrNull(innerFn: Option[ScalarFunction] = None, resultType: String = ColType.Int8) extends ScalarFunction
case class ToInt16OrNull(innerFn: Option[ScalarFunction] = None, resultType: String = ColType.Int16) extends ScalarFunction
case class ToInt32OrNull(innerFn: Option[ScalarFunction] = None, resultType: String = ColType.Int32) extends ScalarFunction
case class ToInt64OrNull(innerFn: Option[ScalarFunction] = None, resultType: String = ColType.Int64) extends ScalarFunction
case class ToUInt8OrNull(innerFn: Option[ScalarFunction] = None, resultType: String = ColType.UInt8) extends ScalarFunction
case class ToUInt16OrNull(innerFn: Option[ScalarFunction] = None, resultType: String = ColType.UInt16) extends ScalarFunction
case class ToUInt32OrNull(innerFn: Option[ScalarFunction] = None, resultType: String = ColType.UInt32) extends ScalarFunction
case class ToUInt64OrNull(innerFn: Option[ScalarFunction] = None, resultType: String = ColType.UInt64) extends ScalarFunction
case class ToFloatOrNull(innerFn: Option[ScalarFunction] = None, resultType: String = ColType.Float) extends ScalarFunction
case class ToDoubleOrNull(innerFn: Option[ScalarFunction] = None, resultType: String = ColType.Double) extends ScalarFunction
case class ToDateOrNull(innerFn: Option[ScalarFunction] = None, resultType: String = ColType.Date) extends ScalarFunction
case class ToDateTimeOrNull(innerFn: Option[ScalarFunction] = None, resultType: String = ColType.DateTime) extends ScalarFunction
case class ToDateTime64OrNull(innerFn: Option[ScalarFunction] = None, resultType: String = ColType.DateTime64) extends ScalarFunction
case class ToStringOrNull(innerFn: Option[ScalarFunction] = None, resultType: String = ColType.String) extends ScalarFunction
