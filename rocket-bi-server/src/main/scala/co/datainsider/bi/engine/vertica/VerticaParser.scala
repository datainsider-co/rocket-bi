package co.datainsider.bi.engine.vertica

import co.datainsider.bi.domain.query._
import co.datainsider.bi.engine.SqlParser
import co.datainsider.bi.util.Implicits.{ImplicitString, NULL_VALUE}
import co.datainsider.bi.util._
import datainsider.client.exception.UnsupportedError

object VerticaParser extends SqlParser {

  /** *****************************************************
    * Object dialect parser: Parse object to vertica sql  *
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
        s"REGEXP_LIKE(${applyScalarFn(field.fullFieldName, scalarFn)}, ${toCorrespondingValue(field.fieldType, value, scalarFn)})"
      case Like(field, value, scalarFn) =>
        s"like(${applyScalarFn(field.fullFieldName, scalarFn)}, ${toCorrespondingValue(field.fieldType, s"%$value%", scalarFn)})"
      case NotLike(field, value, scalarFn) =>
        s"not like(${applyScalarFn(field.fullFieldName, scalarFn)}, ${toCorrespondingValue(field.fieldType, s"%$value%", scalarFn)})"
      case LikeCaseInsensitive(field, value, scalarFn) =>
        s"like(lower(${applyScalarFn(field.fullFieldName, scalarFn)}), ${toCorrespondingValue(field.fieldType, s"%$value%", scalarFn)})"
      case NotLikeCaseInsensitive(field, value, scalarFn) =>
        s"not like(lower(${applyScalarFn(field.fullFieldName, scalarFn)}), ${toCorrespondingValue(field.fieldType, s"%$value%", scalarFn)})"
      case Between(field, min, max, scalarFn) =>
        s"(${applyScalarFn(field.fullFieldName, scalarFn)} > ${toCorrespondingValue(field.fieldType, min)}) " +
          s"and (${applyScalarFn(field.fullFieldName, scalarFn)} < ${toCorrespondingValue(field.fieldType, max)})"
      case BetweenAndIncluding(field, min, max, scalarFn) =>
        s"${applyScalarFn(field.fullFieldName, scalarFn)} between ${toCorrespondingValue(field.fieldType, min)} " +
          s"and ${toCorrespondingValue(field.fieldType, max)}"

      case LastNMinute(field, nMinute, scalarFn, intervalFn) =>
        toBetweenDateCondition(
          s"TRUNC(now(), 'MI') - interval '${nMinute}m'",
          "TRUNC(NOW(), 'MI')",
          field,
          scalarFn,
          intervalFn
        )
      case LastNHour(field, nHour, scalarFn, intervalFn) =>
        toBetweenDateCondition(
          s"TRUNC(now(), 'HH') - interval '${nHour}h'",
          "TRUNC(now(), 'HH')",
          field,
          scalarFn,
          intervalFn
        )
      case LastNDay(field, nDay, scalarFn, intervalFn) =>
        toBetweenDateCondition(
          s"CURRENT_DATE() - INTERVAL '${nDay}d'",
          "CURRENT_DATE()",
          field,
          scalarFn,
          intervalFn
        )
      case LastNWeek(field, nWeek, scalarFn, intervalFn) =>
        toBetweenDateCondition(
          s"TRUNC(CURRENT_DATE() - INTERVAL '${nWeek}w', 'DAY')", // begin of week is Sunday
          "TRUNC(CURRENT_DATE(), 'DAY')",
          field,
          scalarFn,
          intervalFn
        )
      case LastNMonth(field, nMonth, scalarFn, intervalFn) =>
        toBetweenDateCondition(
          s"TRUNC(CURRENT_DATE() - INTERVAL '${nMonth} MONTH', 'MM')",
          "TRUNC(CURRENT_DATE(), 'MM')",
          field,
          scalarFn,
          intervalFn
        )
      case LastNQuarter(field, nQuarter, scalarFn, intervalFn) =>
        toBetweenDateCondition(
          s"TRUNC(CURRENT_DATE() - INTERVAL '${nQuarter}Q', 'Q')",
          "TRUNC(CURRENT_DATE(), 'Q')",
          field,
          scalarFn,
          intervalFn
        )
      case LastNYear(field, nYear, scalarFn, intervalFn) =>
        toBetweenDateCondition(
          s"TRUNC(CURRENT_DATE() - INTERVAL '${nYear}Y', 'Y')",
          "TRUNC(CURRENT_DATE(), 'Y')",
          field,
          scalarFn,
          intervalFn
        )

      case CurrentDay(field, scalarFn, intervalFn) =>
        toBetweenDateCondition(
          "CURRENT_DATE()",
          "NOW()",
          field,
          scalarFn,
          intervalFn
        )
      case CurrentWeek(field, scalarFn, intervalFn) =>
        toBetweenDateCondition(
          "TRUNC(CURRENT_DATE(), 'DAY')",
          "NOW()",
          field,
          scalarFn,
          intervalFn
        )
      case CurrentMonth(field, scalarFn, intervalFn) =>
        toBetweenDateCondition(
          "TRUNC(CURRENT_DATE(), 'MM')",
          "NOW()",
          field,
          scalarFn,
          intervalFn
        )
      case CurrentQuarter(field, scalarFn, intervalFn) =>
        toBetweenDateCondition(
          "TRUNC(CURRENT_DATE(), 'Q')",
          "NOW()",
          field,
          scalarFn,
          intervalFn
        )
      case CurrentYear(field, scalarFn, intervalFn) =>
        toBetweenDateCondition(
          "TRUNC(CURRENT_DATE(), 'Y')",
          "NOW()",
          field,
          scalarFn,
          intervalFn
        )

      case AlwaysTrue()  => "1 = 1"
      case AlwaysFalse() => "1 != 1"

      case _ => throw new ClassNotFoundException("object query condition not found.")
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
      case f: First            => s"min(${applyScalarFn(fieldName, f.scalarFunction)})"
      case f: Last             => s"max(${applyScalarFn(fieldName, f.scalarFunction)})"
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
      case Some(aliasName) => s""""$aliasName""""
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
          case f: First            => s"min(${applyScalarFn(fieldName, f.scalarFunction)})"
          case f: Last             => s"max(${applyScalarFn(fieldName, f.scalarFunction)})"
          case f: SelectExpression => applyScalarFn(f.field.expression, f.scalarFunction)
        }

        s""""f_${StringUtils.shortMd5(aliasName)}""""
    }
  }

  def toAliasName(controlFunction: ControlFunction): String = {
    controlFunction match {
      case f: SelectNull      => """"null""""
      case f: SelectExpr      => s""""${f.aliasName.getOrElse(s"expr_${this.hashCode().toChar.toInt}")}""""
      case f: CountAll        => s""""${f.aliasName.getOrElse(s"count_all_${this.hashCode().toChar.toInt}")}""""
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
      case ToYear(_)     => s"YEAR($field)"
      case ToQuarter(_)  => s"QUARTER($field)"
      case ToMonth(_)    => s"MONTH($field)"
      case ToWeek(_)     => s"WEEK($field)"
      case ToDate(_)     => s"DATE($field)"
      case ToDateTime(_) => s"$field::DATETIME"

      case SecondsToDateTime(_) => s"TO_TIMESTAMP($field)"
      case MillisToDateTime(_)  => s"TO_TIMESTAMP($field / 1000)"
      case NanosToDateTime(_)   => s"TO_TIMESTAMP($field / 1000000)"
      case DatetimeToSeconds(_) => s"EXTRACT(EPOCH FROM $field)"
      case DatetimeToMillis(_)  => s"EXTRACT(EPOCH FROM $field) * 1000"
      case DatetimeToNanos(_)   => s"EXTRACT(EPOCH FROM $field) * 1000000"

      case ToDayOfYear(_)  => s"DAYOFYEAR($field)"
      case ToDayOfMonth(_) => s"DAYOFMONTH($field)"
      case ToDayOfWeek(_)  => s"DAYOFWEEK($field)"
      case ToHour(_)       => s"HOUR($field)"
      case ToMinute(_)     => s"MINUTE($field)"
      case ToSecond(_)     => s"SECOND($field)"

      case ToYearNum(_)    => s"YEAR($field)"
      case ToQuarterNum(_) => s"TIMESTAMPDIFF(QUARTER, DATE('1970-01-01'), $field)"
      case ToMonthNum(_)   => s"TIMESTAMPDIFF(MONTH, DATE('1970-01-01'), $field)"
      case ToWeekNum(_)    => s"TIMESTAMPDIFF(WEEK, DATE('1970-01-01'), $field)"
      case ToDayNum(_)     => s"TIMESTAMPDIFF(DAY, DATE('1970-01-01'), $field)"
      case ToHourNum(_)    => s"TIMESTAMPDIFF(HOUR, DATE('1970-01-01'), $field)"
      case ToMinuteNum(_)  => s"TIMESTAMPDIFF(MINUTE, DATE('1970-01-01'), $field)"
      case ToSecondNum(_)  => s"EXTRACT(EPOCH FROM $field)"

      case DateDiff(unit, date, _)   => s"TIMESTAMPDIFF($unit, '$date', $field)"
      case GetArrayElement(_, index) => ???
      case Decrypt(_)                => ???

      case PastNYear(unit, _)    => s"$field - INTERVAL '$unit YEAR'"
      case PastNQuarter(unit, _) => s"$field - INTERVAL '$unit QUARTER'"
      case PastNMonth(unit, _)   => s"$field - INTERVAL '$unit MONTH'"
      case PastNWeek(unit, _)    => s"$field - INTERVAL '$unit WEEK'"
      case PastNDay(unit, _)     => s"$field - INTERVAL '$unit DAY'"

      case Cast(asType, _) => s"$field::$asType"
    }
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

    s"$date BETWEEN $startDate AND $endDate"
  }

  private def escapeString(value: String): String = {
    if (value != null) {
      val escapedValue = value.replaceAll("'", "\\\\'")
      s"'$escapedValue'"
    } else NULL_VALUE
  }

}
