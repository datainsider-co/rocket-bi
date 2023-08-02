package co.datainsider.bi.engine.bigquery

import co.datainsider.bi.domain.SqlRegex.SqlRegex
import co.datainsider.bi.domain.SqlRegex
import co.datainsider.bi.domain.query.{
  AggregateBetween,
  AggregateBetweenAndIncluding,
  AggregateCondition,
  AggregateEqual,
  AggregateGreaterThan,
  AggregateGreaterThanOrEqual,
  AggregateLessThan,
  AggregateLessThanOrEqual,
  AggregateNotEqual,
  AlwaysFalse,
  AlwaysTrue,
  And,
  Avg,
  Between,
  BetweenAndIncluding,
  Cast,
  Condition,
  ControlFunction,
  Count,
  CountAll,
  CountDistinct,
  CurrentDay,
  CurrentMonth,
  CurrentQuarter,
  CurrentWeek,
  CurrentYear,
  DateDiff,
  DatetimeToMillis,
  DatetimeToNanos,
  DatetimeToSeconds,
  Decrypt,
  DynamicCondition,
  DynamicFunction,
  Empty,
  Equal,
  EqualField,
  Field,
  FieldRelatedFunction,
  First,
  Function,
  GetArrayElement,
  GreaterOrEqualField,
  GreaterThan,
  GreaterThanField,
  GreaterThanOrEqual,
  GroupBy,
  In,
  Last,
  LastNDay,
  LastNHour,
  LastNMinute,
  LastNMonth,
  LastNQuarter,
  LastNWeek,
  LastNYear,
  LessOrEqualField,
  LessThan,
  LessThanField,
  LessThanOrEqual,
  Like,
  LikeCaseInsensitive,
  Limit,
  MatchRegex,
  Max,
  MillisToDateTime,
  Min,
  NanosToDateTime,
  NotEmpty,
  NotEqual,
  NotEqualField,
  NotIn,
  NotLike,
  NotLikeCaseInsensitive,
  NotNull,
  Null,
  Or,
  OrderBy,
  PastNDay,
  PastNMonth,
  PastNQuarter,
  PastNWeek,
  PastNYear,
  ScalarFunction,
  SecondsToDateTime,
  Select,
  SelectAll,
  SelectDistinct,
  SelectExpr,
  SelectExpression,
  SelectNull,
  Sum,
  TableField,
  ToDate,
  ToDateTime,
  ToDayNum,
  ToDayOfMonth,
  ToDayOfWeek,
  ToDayOfYear,
  ToHour,
  ToHourNum,
  ToMinute,
  ToMinuteNum,
  ToMonth,
  ToMonthNum,
  ToQuarter,
  ToQuarterNum,
  ToSecond,
  ToSecondNum,
  ToWeek,
  ToWeekNum,
  ToYear,
  ToYearNum
}
import co.datainsider.bi.engine.SqlParser
import co.datainsider.bi.engine.clickhouse.ClickhouseParser.{toAliasName, toQueryString}
import co.datainsider.bi.util.Implicits.{ImplicitString, NULL_VALUE}
import co.datainsider.bi.util.{
  DayNumFormatter,
  DayOfWeekFormatter,
  MonthFormatter,
  MonthNumFormatter,
  QuarterFormatter,
  QuarterNumFormatter,
  StringUtils,
  WeekNumFormatter
}
import datainsider.client.exception.UnsupportedError

import scala.util.matching.Regex

object BigQueryParser extends SqlParser {

  /** *****************************************************
    * Object dialect parser: Parse object to clickhouse sql *
    * *****************************************************
    */

  /**
    * parse condition object to clickhouse query syntax in where clause
    */
  def toQueryString(condition: Condition): String = {
    condition match {
      case and: And                           => toAndConditionStr(and)
      case or: Or                             => toOrConditionStr(or)
      case dynamicCondition: DynamicCondition => toDynamicConditionStr(dynamicCondition)

      case in: In       => toInConditionStr(in)
      case notIn: NotIn => toNotInConditionStr(notIn)

      case EqualField(leftField, rightField, leftScalarFn, rightScalarFn) =>
        s"${applyScalarFn(leftField.fullFieldName, leftScalarFn)} = ${applyScalarFn(rightField.fullFieldName, rightScalarFn)}"
      case NotEqualField(leftField, rightField, leftScalarFn, rightScalarFn) =>
        s"${applyScalarFn(leftField.fullFieldName, leftScalarFn)} != ${applyScalarFn(rightField.fullFieldName, rightScalarFn)}"
      case GreaterThanField(leftField, rightField, leftScalarFn, rightScalarFn) =>
        s"${applyScalarFn(leftField.fullFieldName, leftScalarFn)} > ${applyScalarFn(rightField.fullFieldName, rightScalarFn)}"
      case LessThanField(leftField, rightField, leftScalarFn, rightScalarFn) =>
        s"${applyScalarFn(leftField.fullFieldName, leftScalarFn)} < ${applyScalarFn(rightField.fullFieldName, rightScalarFn)}"
      case GreaterOrEqualField(leftField, rightField, leftScalarFn, rightScalarFn) =>
        s"${applyScalarFn(leftField.fullFieldName, leftScalarFn)} >= ${applyScalarFn(rightField.fullFieldName, rightScalarFn)}"
      case LessOrEqualField(leftField, rightField, leftScalarFn, rightScalarFn) =>
        s"${applyScalarFn(leftField.fullFieldName, leftScalarFn)} <= ${applyScalarFn(rightField.fullFieldName, rightScalarFn)}"

      case Null(field, scalarFn)     => s"${applyScalarFn(field.fullFieldName, scalarFn)} is null"
      case NotNull(field, scalarFn)  => s"${applyScalarFn(field.fullFieldName, scalarFn)} is not null"
      case Empty(field, scalarFn)    => s"${applyScalarFn(field.fullFieldName, scalarFn)} = ''"
      case NotEmpty(field, scalarFn) => s"${applyScalarFn(field.fullFieldName, scalarFn)} != ''"

      case Equal(field, value, scalarFn) =>
        s"${applyScalarFn(field.fullFieldName, scalarFn)} = ${toCorrespondingValue(field.fieldType, value, scalarFn)}"
      case NotEqual(field, value, scalarFn) =>
        s"${applyScalarFn(field.fullFieldName, scalarFn)} != ${toCorrespondingValue(field.fieldType, value, scalarFn)}"
      case GreaterThan(field, value, scalarFn) =>
        s"${applyScalarFn(field.fullFieldName, scalarFn)} > ${toCorrespondingValue(field.fieldType, value, scalarFn)}"
      case GreaterThanOrEqual(field, value, scalarFn) =>
        s"${applyScalarFn(field.fullFieldName, scalarFn)} >= ${toCorrespondingValue(field.fieldType, value, scalarFn)}"
      case LessThan(field, value, scalarFn) =>
        s"${applyScalarFn(field.fullFieldName, scalarFn)} < ${toCorrespondingValue(field.fieldType, value, scalarFn)}"
      case LessThanOrEqual(field, value, scalarFn) =>
        s"${applyScalarFn(field.fullFieldName, scalarFn)} <= ${toCorrespondingValue(field.fieldType, value, scalarFn)}"
      case MatchRegex(field, value, scalarFn) =>
        s"match(${applyScalarFn(field.fullFieldName, scalarFn)}, ${toCorrespondingValue(field.fieldType, value, scalarFn)})"
      case Like(field, value, scalarFn) =>
        s"like(${applyScalarFn(field.fullFieldName, scalarFn)}, ${toCorrespondingValue(field.fieldType, s"%$value%", scalarFn)})"
      case NotLike(field, value, scalarFn) =>
        s"notLike(${applyScalarFn(field.fullFieldName, scalarFn)}, ${toCorrespondingValue(field.fieldType, s"%$value%", scalarFn)})"
      case LikeCaseInsensitive(field, value, scalarFn) =>
        s"like(lower(${applyScalarFn(field.fullFieldName, scalarFn)}), ${toCorrespondingValue(field.fieldType, s"%$value%", scalarFn)})"
      case NotLikeCaseInsensitive(field, value, scalarFn) =>
        s"notLike(lower(${applyScalarFn(field.fullFieldName, scalarFn)}), ${toCorrespondingValue(field.fieldType, s"%$value%", scalarFn)})"
      case Between(field, min, max, scalarFn) =>
        s"(${applyScalarFn(field.fullFieldName, scalarFn)} > ${toCorrespondingValue(field.fieldType, min)}) " +
          s"and (${applyScalarFn(field.fullFieldName, scalarFn)} < ${toCorrespondingValue(field.fieldType, max)})"
      case BetweenAndIncluding(field, min, max, scalarFn) =>
        s"${applyScalarFn(field.fullFieldName, scalarFn)} between ${toCorrespondingValue(field.fieldType, min)} " +
          s"and ${toCorrespondingValue(field.fieldType, max)}"

      case LastNMinute(field, nMinute, scalarFn, intervalFn) =>
        toBetweenDateCondition(
          s"toStartOfMinute(now() - toIntervalMinute($nMinute))",
          "toStartOfMinute(now())",
          field,
          scalarFn,
          intervalFn
        )
      case LastNHour(field, nHour, scalarFn, intervalFn) =>
        toBetweenDateCondition(
          s"toStartOfHour(now() - toIntervalHour($nHour))",
          "toStartOfHour(now())",
          field,
          scalarFn,
          intervalFn
        )
      case LastNDay(field, nDay, scalarFn, intervalFn) =>
        toBetweenDateCondition(
          s"today() - toIntervalDay($nDay)",
          "today()",
          field,
          scalarFn,
          intervalFn
        )
      case LastNWeek(field, nWeek, scalarFn, intervalFn) =>
        toBetweenDateCondition(
          s"toStartOfWeek(today() - toIntervalWeek($nWeek))", // begin of week is Sunday
          "toStartOfWeek(today())",
          field,
          scalarFn,
          intervalFn
        )
      case LastNMonth(field, nMonth, scalarFn, intervalFn) =>
        toBetweenDateCondition(
          s"toStartOfMonth(today() - toIntervalMonth($nMonth))",
          "toStartOfMonth(today())",
          field,
          scalarFn,
          intervalFn
        )
      case LastNQuarter(field, nQuarter, scalarFn, intervalFn) =>
        toBetweenDateCondition(
          s"toStartOfQuarter(today() - toIntervalQuarter($nQuarter))",
          "toStartOfQuarter(today())",
          field,
          scalarFn,
          intervalFn
        )
      case LastNYear(field, nYear, scalarFn, intervalFn) =>
        toBetweenDateCondition(
          s"toStartOfYear(today() - toIntervalYear($nYear))",
          "toStartOfYear(today())",
          field,
          scalarFn,
          intervalFn
        )

      case CurrentDay(field, scalarFn, intervalFn) =>
        toBetweenDateCondition(
          "toStartOfDay(now())",
          "now()",
          field,
          scalarFn,
          intervalFn
        )
      case CurrentWeek(field, scalarFn, intervalFn) =>
        toBetweenDateCondition(
          "toStartOfWeek(now())",
          "now()",
          field,
          scalarFn,
          intervalFn
        )
      case CurrentMonth(field, scalarFn, intervalFn) =>
        toBetweenDateCondition(
          "toStartOfMonth(now())",
          "now()",
          field,
          scalarFn,
          intervalFn
        )
      case CurrentQuarter(field, scalarFn, intervalFn) =>
        toBetweenDateCondition(
          "toStartOfQuarter(now())",
          "now()",
          field,
          scalarFn,
          intervalFn
        )
      case CurrentYear(field, scalarFn, intervalFn) =>
        toBetweenDateCondition(
          "toStartOfYear(now())",
          "now()",
          field,
          scalarFn,
          intervalFn
        )

      case AlwaysTrue()  => "1 = 1"
      case AlwaysFalse() => "1 != 1"

      case _ => throw new ClassNotFoundException("object query condition not found.")
    }
  }

  private def toAndConditionStr(and: And): String = {
    val conditionsFields: Array[String] = and.conditions.map(toQueryString).filter(_.nonEmpty)
    if (conditionsFields.nonEmpty) {
      conditionsFields.mkString("(", " and ", ")")
    } else ""
  }

  private def toOrConditionStr(or: Or): String = {
    val conditionFields: Array[String] = or.conditions.map(toQueryString).filter(_.nonEmpty)
    if (conditionFields.nonEmpty) {
      conditionFields.mkString("(", " or ", ")")
    } else ""
  }

  private def toDynamicConditionStr(dynamicCond: DynamicCondition): String = {
    val conditionStr: Option[String] = dynamicCond.finalCondition.map(toQueryString).filter(_.nonEmpty)
    if (conditionStr.isDefined) {
      conditionStr.get
    } else ""
  }

  private def toInConditionStr(in: In): String = {
    val fieldStr: String = applyScalarFn(in.field.fullFieldName, in.scalarFunction)
    val valuesStr: String = in.possibleValues.filterNot(v => v.isNull).map(escapeString).mkString(",")

    if (in.isIncludeNull) {
      s"(isNull($fieldStr) or $fieldStr in (null,$valuesStr))"
    } else {
      s"$fieldStr in (null,$valuesStr)"
    }
  }

  private def toNotInConditionStr(notIn: NotIn): String = {
    val fieldStr: String = applyScalarFn(notIn.field.fullFieldName, notIn.scalarFunction)
    val valuesStr: String = notIn.possibleValues.filterNot(v => v.isNull).map(escapeString).mkString(",")

    if (notIn.isIncludeNull) {
      s"(isNotNull($fieldStr) and $fieldStr not in (null,$valuesStr))"
    } else {
      s"$fieldStr not in (null,$valuesStr)"
    }
  }

  // TODO: aggregate function not yet support and and or
  def toQueryString(aggregateCondition: AggregateCondition): String = {
    aggregateCondition match {
      case AggregateEqual(fn, value)    => s"${toQueryString(fn)} = ${toCorrespondingValue(fn.field.fieldType, value)}"
      case AggregateNotEqual(fn, value) => s"${toQueryString(fn)} != ${toCorrespondingValue(fn.field.fieldType, value)}"
      case AggregateLessThan(fn, value) => s"${toQueryString(fn)} < ${toCorrespondingValue(fn.field.fieldType, value)}"
      case AggregateLessThanOrEqual(fn, value) =>
        s"${toQueryString(fn)} <= ${toCorrespondingValue(fn.field.fieldType, value)}"
      case AggregateGreaterThan(fn, value) =>
        s"${toQueryString(fn)} > ${toCorrespondingValue(fn.field.fieldType, value)}"
      case AggregateGreaterThanOrEqual(fn, value) =>
        s"${toQueryString(fn)} >= ${toCorrespondingValue(fn.field.fieldType, value)}"
      case AggregateBetween(fn, min, max) =>
        s"${toQueryString(fn)} > ${toCorrespondingValue(fn.field.fieldType, min)}" +
          s"and ${toQueryString(fn)} < ${toCorrespondingValue(fn.field.fieldType, max)}"
      case AggregateBetweenAndIncluding(fn, min, max) =>
        s"${toQueryString(fn)} between ${toCorrespondingValue(fn.field.fieldType, min)} and ${toCorrespondingValue(fn.field.fieldType, max)}"

      case _ => throw new ClassNotFoundException("object query condition not found.")
    }
  }

  /**
    * parse function object to clickhouse query syntax in select clause
    */
  def toQueryString(function: FieldRelatedFunction): String = {
    val fieldName = s"${function.field.fullFieldName}"
    function match {
      case f: Select           => applyScalarFn(fieldName, f.scalarFunction)
      case f: SelectDistinct   => applyScalarFn(fieldName, f.scalarFunction)
      case f: GroupBy          => applyScalarFn(fieldName, f.scalarFunction)
      case f: Count            => s"count(${applyScalarFn(fieldName, f.scalarFunction)})"
      case f: CountDistinct    => s"count(distinct(${applyScalarFn(fieldName, f.scalarFunction)}))"
      case f: Min              => s"min(${applyScalarFn(fieldName, f.scalarFunction)})"
      case f: Max              => s"max(${applyScalarFn(fieldName, f.scalarFunction)})"
      case f: Avg              => s"avg(${applyScalarFn(fieldName, f.scalarFunction)})"
      case f: Sum              => s"sum(${applyScalarFn(fieldName, f.scalarFunction)})"
      case f: First            => s"any_value(${applyScalarFn(fieldName, f.scalarFunction)})"
      case f: Last             => s"any_value(${applyScalarFn(fieldName, f.scalarFunction)})"
      case f: SelectExpression => applyScalarFn(fieldName, f.scalarFunction)
      case _                   => throw new ClassNotFoundException(s"toQueryString: can not find function: $function")
    }
  }

  def toQueryString(controlFunction: ControlFunction): String = {
    controlFunction match {
      case f: SelectNull => "null"
      case f: SelectAll  => "*"
      case f: CountAll   => "count(*)"
      case f: SelectExpr => applyScalarFn(f.expr, f.scalarFunction)
    }
  }

  def toQueryString(function: Function): String = {
    function match {
      case dynamicFunc: DynamicFunction =>
        if (dynamicFunc.finalFunction.isDefined) toQueryString(dynamicFunc.finalFunction.get)
        else toQueryString(dynamicFunc.baseFunction)
      case controlFunc: ControlFunction    => toQueryString(controlFunc)
      case fieldFunc: FieldRelatedFunction => toQueryString(fieldFunc)
    }
  }

  def toAliasName(function: FieldRelatedFunction): String = {
    function.aliasName match {
      case Some(aliasName) => aliasName
      case None =>
        val fieldName = function.field.normalizedFieldName
        val aliasName = function match {
          case f: Select           => applyScalarFn(fieldName, f.scalarFunction)
          case f: SelectDistinct   => applyScalarFn(fieldName, f.scalarFunction)
          case f: GroupBy          => applyScalarFn(fieldName, f.scalarFunction)
          case f: Count            => s"count(${applyScalarFn(fieldName, f.scalarFunction)})"
          case f: CountDistinct    => s"uniqExact(${applyScalarFn(fieldName, f.scalarFunction)})"
          case f: Min              => s"min(${applyScalarFn(fieldName, f.scalarFunction)})"
          case f: Max              => s"max(${applyScalarFn(fieldName, f.scalarFunction)})"
          case f: Avg              => s"avg(${applyScalarFn(fieldName, f.scalarFunction)})"
          case f: Sum              => s"sum(${applyScalarFn(fieldName, f.scalarFunction)})"
          case f: First            => s"any_value(${applyScalarFn(fieldName, f.scalarFunction)})"
          case f: Last             => s"any_value(${applyScalarFn(fieldName, f.scalarFunction)})"
          case f: SelectExpression => applyScalarFn(f.field.expression, f.scalarFunction)
        }

        s"""`f_${StringUtils.shortMd5(aliasName)}`"""
    }
  }

  def toAliasName(controlFunction: ControlFunction): String = {
    controlFunction match {
      case f: SelectNull      => "`null`"
      case f: SelectExpr      => f.aliasName.getOrElse(s"expr_${this.hashCode().toChar.toInt}")
      case f: CountAll        => f.aliasName.getOrElse(s"count_all_${this.hashCode().toChar.toInt}")
      case f: DynamicFunction => toAliasName(f.finalFunction.getOrElse(f.baseFunction))
    }
  }

  def toAliasName(function: Function): String = {
    function match {
      case fieldFunc: FieldRelatedFunction => toAliasName(fieldFunc)
      case controlFunc: ControlFunction    => toAliasName(controlFunc)
    }
  }

  def toSelectField(function: Function, useAliasName: Boolean): String = {
    if (useAliasName) {
      s"${toQueryString(function)} as ${toAliasName(function)}"
    } else {
      toQueryString(function)
    }
  }

  def toQueryString(scalarFn: ScalarFunction, field: String): String = {
    scalarFn match {
      case ToYear(_)     => s"EXTRACT(YEAR FROM $field)"
      case ToQuarter(_)  => s"EXTRACT(QUARTER FROM $field)"
      case ToMonth(_)    => s"EXTRACT(MONTH FROM $field)"
      case ToWeek(_)     => s"EXTRACT(WEEK FROM $field)"
      case ToDate(_)     => s"DATE($field)"
      case ToDateTime(_) => s"DATETIME($field)"

      case SecondsToDateTime(_) => s"TIMESTAMP_SECONDS($field)"
      case MillisToDateTime(_)  => s"TIMESTAMP_MILLIS($field)"
      case NanosToDateTime(_)   => s"TIMESTAMP_MICROS($field)"
      case DatetimeToSeconds(_) => s"UNIX_SECONDS(TIMESTAMP($field))"
      case DatetimeToMillis(_)  => s"UNIX_MILLIS(TIMESTAMP($field))"
      case DatetimeToNanos(_)   => s"UNIX_MICROS(TIMESTAMP($field))"

      case ToDayOfYear(_)  => s"EXTRACT(DAYOFYEAR FROM $field)"
      case ToDayOfMonth(_) => s"EXTRACT(DAY FROM $field)"
      case ToDayOfWeek(_)  => s"EXTRACT(DAYOFWEEK FROM $field)"
      case ToHour(_)       => s"EXTRACT(HOUR FROM DATETIME($field))"
      case ToMinute(_)     => s"EXTRACT(MINUTE FROM DATETIME($field))"
      case ToSecond(_)     => s"EXTRACT(SECOND FROM DATETIME($field))"

      case ToYearNum(_)    => s"EXTRACT(YEAR FROM $field)"
      case ToQuarterNum(_) => s"DATE_DIFF($field, DATE(1970,1,1), QUARTER)"
      case ToMonthNum(_)   => s"DATE_DIFF($field, DATE(1970,1,1), MONTH)"
      case ToWeekNum(_)    => s"DATE_DIFF($field, DATE(1970,1,1), WEEK)"
      case ToDayNum(_)     => s"DATE_DIFF($field, DATE(1970,1,1), DAY)"
      case ToHourNum(_)    => s"DATETIME_DIFF($field, DATETIME(1970,1,1,0,0,0), HOUR)"
      case ToMinuteNum(_)  => s"DATETIME_DIFF($field, DATETIME(1970,1,1,0,0,0), MINUTE)"
      case ToSecondNum(_)  => s"UNIX_SECONDS(TIMESTAMP($field))"

      case DateDiff(unit, date, _)   => s"DATE_DIFF($field, DATE('$date'), $unit)"
      case GetArrayElement(_, index) => ???
      case Decrypt(_)                => ???

      case PastNYear(num, _)    => s"DATE_SUB($field, INTERVAL $num YEAR)"
      case PastNQuarter(num, _) => s"DATE_SUB($field, INTERVAL $num QUARTER)"
      case PastNMonth(num, _)   => s"DATE_SUB($field, INTERVAL $num MONTH)"
      case PastNWeek(num, _)    => s"DATE_SUB($field, INTERVAL $num WEEK)"
      case PastNDay(num, _)     => s"DATE_SUB($field, INTERVAL $num DAY)"

      case Cast(asType, _) => s"CAST($field AS $asType)"
    }
  }

  override def toHistogramSql(fieldName: String, baseSql: String, numBin: Int): String = {
    require(numBin > 1, "Bin number should be greater than 1.")
    s"""
       |WITH
       |  base_view as ($baseSql),
       |  bin_size_view as (
       |    SELECT ( max($fieldName) - min($fieldName) ) / ${numBin - 1} as bin_size
       |    FROM base_view
       |  ),
       |  range_values_view as (
       |    SELECT FLOOR($fieldName / bin_size) * bin_size as lower_bound, bin_size
       |    FROM base_view, bin_size_view
       |  )
       |SELECT lower_bound, lower_bound + bin_size as upper_bound, COUNT(1) as value
       |FROM range_values_view
       |GROUP BY lower_bound, upper_bound
       |ORDER BY lower_bound
       |""".stripMargin
  }

  def applyScalarFunctionToField(scalarFn: ScalarFunction, field: Field): String = {
    scalarFn.innerFn match {
      case Some(innerFn) => toQueryString(scalarFn, applyScalarFunctionToField(innerFn, field))
      case _             => toQueryString(scalarFn, field.fullFieldName)
    }
  }

  def applyScalarFn(expr: String, scalarFn: Option[ScalarFunction]): String = {
    scalarFn.fold(expr)(applyScalarFunctionToString(_, expr))
  }

  def applyScalarFunctionToString(scalarFn: ScalarFunction, term: String): String = {
    scalarFn.innerFn match {
      case Some(innerFn) => toQueryString(scalarFn, applyScalarFunctionToString(innerFn, term))
      case _             => toQueryString(scalarFn, term)
    }
  }

  def toCorrespondingValue(fieldType: String, value: String, scalarFn: Option[ScalarFunction] = None): String = {
    try {
      scalarFn match {
        case Some(x) => unapplyScalarFn(x, value).toString
        case None    => toValueStr(value, fieldType)
      }
    } catch {
      case e: Throwable => throw UnsupportedError(s"fail to parse $value to sql", e)
    }
  }

  def toValueStr(value: String, fieldType: String): String = {
    fieldType.toLowerCase match {
      case "string"     => s"${escapeString(value)}"
      case "date"       => s"toDate('$value')"
      case "datetime"   => s"toDateTime('$value')"
      case "datetime64" => s"toDateTime('$value')"
      case _            => s"$value"
    }
  }

  private def unapplyScalarFn(scalarFn: ScalarFunction, value: String): Object = {
    scalarFn match {
      case _: ToDayOfWeek  => DayOfWeekFormatter.deformat(value)
      case _: ToQuarterNum => QuarterNumFormatter.deformat(value)
      case _: ToMonthNum   => MonthNumFormatter.deformat(value)
      case _: ToWeekNum    => WeekNumFormatter.deformat(value)
      case _: ToDayNum     => DayNumFormatter.deformat(value)
      case _: ToQuarter    => QuarterFormatter.deformat(value)
      case _: ToMonth      => MonthFormatter.deformat(value)
      case _               => s"'$value'"
    }
  }

  /** **********************************************************
    * Sql modifier: Transform raw sql query to fit custom cases
    * **********************************************************
    */

  /**
    * standardize sql query for easier manipulation: remove redundant character, standard sql format
    * clause of query is separated by a single space: E.g: select ... from ... where ...
    * query field is separated by a single comma: E.g: select name,age,address from tbl1,tbl2
    */
  def standardizeSql(sql: String): String = {
    val functions = Array[String => String](
      sql => sql.replaceAll(";", ""),
      sql => sql.replaceAll("""\s+""", " "),
      sql => sql.replaceAll(""", """, ","),
      sql => sql.replaceAll(""" ,""", ","),
      sql => sql.replaceAll(""" , """, ","),
      sql => sql.trim
    )
    functions.foldLeft(sql)((sql, f) => f(sql))
  }

  val sqlClauseRegexes: Array[Regex] = Array(
    SqlRegex.SelectRegex,
    SqlRegex.FromRegex,
    SqlRegex.WhereRegex,
    SqlRegex.GroupByRegex,
    SqlRegex.HavingRegex,
    SqlRegex.OrderByRegex,
    SqlRegex.LimitRegex
  )

  /**
    * return starting index of specific clause
    *
    * @param sql      sql to be adjust
    * @param sqlRegex : regex of search clause
    * @return Some(i) if exist else none (i: starting index of clause)
    */
  def findFirstMatch(sql: String, sqlRegex: Regex): Option[Int] = {
    sqlRegex.findFirstMatchIn(sql.toLowerCase()).map(_.start)
  }

  def findLastMatch(sql: String, sqlRegex: Regex): Option[Int] = {
    sqlRegex.findAllMatchIn(sql.toLowerCase()).toSeq.map(_.start).reverse.headOption
  }

  /**
    * return position of clause or the next possible position of specific clause (if clause not exists)
    */
  def findAppropriatePos(sql: String, target: SqlRegex): Int = {
    sqlClauseRegexes
      .slice(sqlClauseRegexes.indexOf(target), sqlClauseRegexes.length)
      .map(findFirstMatch(sql, _))
      .find(_.isDefined)
      .flatten match {
      case Some(i) => i
      case None    => sql.length
    }
  }

  /**
    * add condition or function to query by converting condition object to clickhouse sql
    * and insert into appropriate position
    */
  def addSelect(sql: String, select: FieldRelatedFunction): String = {
    val fieldName = toSelectField(select, useAliasName = false)
    findFirstMatch(sql, SqlRegex.SelectRegex) match {
      case Some(i) => sql.patch(i + 7, s"$fieldName,", 0)
      case None    => s"select $fieldName" + sql
    }
  }

  // adding conditions to existed conditions with "and"
  def addCondition(sql: String, condition: Condition): String = {
    val conditionStr = toQueryString(condition)
    findFirstMatch(sql, SqlRegex.WhereRegex) match {
      case Some(i) =>
        val paramSql = wrapParenBetweenWhereClause(sql)
        paramSql.patch(i + 7, s"($conditionStr) and ", 0)
      case None =>
        val pos = findAppropriatePos(sql, SqlRegex.WhereRegex)
        sql.patch(pos, s" where ($conditionStr)", 0)
    }
  }

  def addGroupBy(sql: String, groupBy: FieldRelatedFunction): String = {
    val fieldName = toAliasName(groupBy)
    findFirstMatch(sql, SqlRegex.GroupByRegex) match {
      case Some(i) => sql.patch(i + 10, s"$fieldName,", 0)
      case None =>
        val pos = findAppropriatePos(sql, SqlRegex.GroupByRegex)
        sql.patch(pos, s" group by $fieldName", 0)
    }
  }

  def addOrderBy(sql: String, orderBy: OrderBy): String = {
    val fieldName = s"${toAliasName(orderBy.function)} ${orderBy.order.toString}"
    findFirstMatch(sql, SqlRegex.OrderByRegex) match {
      case Some(i) => sql.patch(i + 10, s"$fieldName,", 0)
      case None =>
        val pos = findAppropriatePos(sql, SqlRegex.OrderByRegex)
        sql.patch(pos, s" order by $fieldName", 0)
    }
  }

  def addLimit(sql: String, limit: Limit): String = {
    s"select * from ($sql) limit ${limit.offset}, ${limit.size}"
  }

  /**
    * remove specific clause of clickhouse sql query
    */
  def dropSelectClause(sql: String): String = {
    findFirstMatch(sql, SqlRegex.SelectRegex) match {
      case Some(begin) =>
        val end = findAppropriatePos(sql, SqlRegex.FromRegex)
        sql.replace(sql.substring(begin, end), "")
      case _ => sql
    }
  }

  def dropGroupByClause(sql: String): String = {
    findFirstMatch(sql, SqlRegex.GroupByRegex) match {
      case Some(begin) =>
        val end = findAppropriatePos(sql, SqlRegex.HavingRegex)
        sql.replace(sql.substring(begin, end), "")
      case _ => sql
    }
  }

  def dropOrderByClause(sql: String): String = {
    findFirstMatch(sql, SqlRegex.OrderByRegex) match {
      case Some(begin) =>
        val end = findAppropriatePos(sql, SqlRegex.LimitRegex)
        sql.replace(sql.substring(begin, end), "")
      case _ => sql
    }
  }

  def dropLimitClause(sql: String): String = {
    findFirstMatch(sql, SqlRegex.LimitRegex) match {
      case Some(begin) =>
        val end = sql.length
        sql.replace(sql.substring(begin, end), "")
      case _ => sql
    }
  }

  /**
    * add a sequence of conditions or functions to appropriate position in query
    */
  def addListSelects(sql: String, selects: Seq[FieldRelatedFunction]): String = {
    selects.reverse.foldLeft(sql)(addSelect)
  }

  def addListConditions(sql: String, conditions: Seq[Condition]): String = {
    conditions.reverse.foldLeft(sql)(addCondition)
  }

  def addListGroupBys(sql: String, groupBys: Seq[FieldRelatedFunction]): String = {
    groupBys.reverse.foldLeft(sql)(addGroupBy)
  }

  def addListOrderBys(sql: String, orderBys: Seq[OrderBy]): String = {
    orderBys.reverse.foldLeft(sql)(addOrderBy)
  }

  /**
    * add parenthesis in where clauses to apply additional conditions
    */
  def wrapParenBetweenWhereClause(sql: String): String = {
    findFirstMatch(sql, SqlRegex.WhereRegex) match {
      case Some(begin) =>
        val end: Int = findAppropriatePos(sql, SqlRegex.GroupByRegex)
        sql.patch(begin + 7, "(", 0).patch(end + 1, ")", 0)
      case None => sql
    }
  }

  def toCountSql(sql: String): String = {
    s"select count(1) from (${dropLimitClause(sql)})"
  }

  def toBetweenDateCondition(
      startDateExpr: String,
      endDateExpr: String,
      dateField: Field,
      scalarFunction: Option[ScalarFunction],
      intervalFunction: Option[ScalarFunction]
  ): String = {
    val date: String = applyScalarFn(dateField.fullFieldName, scalarFunction)
    val startDate: String = applyScalarFn(startDateExpr, intervalFunction)
    val endDate: String = applyScalarFn(endDateExpr, intervalFunction)

    s"$date >= $startDate and $date < $endDate"
  }

  private def escapeString(value: String): String = {
    if (value != null) {
      val escapedValue = value.replaceAll("'", "\\\\'")
      s"'$escapedValue'"
    } else NULL_VALUE
  }

}
