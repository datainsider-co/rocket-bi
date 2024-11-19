package co.datainsider.bi.engine.redshift

import co.datainsider.bi.domain.query._
import co.datainsider.bi.engine.SqlParser
import co.datainsider.bi.util.Implicits.{ImplicitString, NULL_VALUE}
import co.datainsider.bi.util._
import co.datainsider.common.client.exception.UnsupportedError

object RedshiftParser extends SqlParser {

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
          s"DATE_TRUNC('minute', NOW()) - INTERVAL '$nMinute minutes'",
          "DATE_TRUNC('minute', NOW())",
          field,
          scalarFn,
          intervalFn
        )
      case LastNHour(field, nHour, scalarFn, intervalFn) =>
        toBetweenDateCondition(
          s"DATE_TRUNC('hour', NOW()) - INTERVAL '$nHour hours'",
          "DATE_TRUNC('hour', NOW())",
          field,
          scalarFn,
          intervalFn
        )
      case LastNDay(field, nDay, scalarFn, intervalFn) =>
        toBetweenDateCondition(
          s"CURRENT_DATE - INTERVAL '$nDay days'",
          "CURRENT_DATE",
          field,
          scalarFn,
          intervalFn
        )
      case LastNWeek(field, nWeek, scalarFn, intervalFn) =>
        toBetweenDateCondition(
          s"DATE_TRUNC('week', NOW()) - INTERVAL '$nWeek weeks'", // begin of week is Monday
          "DATE_TRUNC('week', NOW())",
          field,
          scalarFn,
          intervalFn
        )
      case LastNMonth(field, nMonth, scalarFn, intervalFn) =>
        toBetweenDateCondition(
          s"DATE_TRUNC('month', NOW()) - INTERVAL '$nMonth weeks'",
          "DATE_TRUNC('month', NOW())",
          field,
          scalarFn,
          intervalFn
        )
      case LastNQuarter(field, nQuarter, scalarFn, intervalFn) =>
        toBetweenDateCondition(
          s"DATE_TRUNC('quarter', NOW()) - INTERVAL '${nQuarter * 3} months'",
          "DATE_TRUNC('quarter', NOW())",
          field,
          scalarFn,
          intervalFn
        )
      case LastNYear(field, nYear, scalarFn, intervalFn) =>
        toBetweenDateCondition(
          s"DATE_TRUNC('year', NOW()) - INTERVAL '$nYear years'",
          "DATE_TRUNC('year', NOW())",
          field,
          scalarFn,
          intervalFn
        )

      case CurrentDay(field, scalarFn, intervalFn) =>
        toBetweenDateCondition(
          "CURRENT_DATE",
          "NOW()",
          field,
          scalarFn,
          intervalFn
        )
      case CurrentWeek(field, scalarFn, intervalFn) =>
        toBetweenDateCondition(
          "DATE_TRUNC('week', NOW())",
          "NOW()",
          field,
          scalarFn,
          intervalFn
        )
      case CurrentMonth(field, scalarFn, intervalFn) =>
        toBetweenDateCondition(
          "DATE_TRUNC('month', NOW())",
          "NOW()",
          field,
          scalarFn,
          intervalFn
        )
      case CurrentQuarter(field, scalarFn, intervalFn) =>
        toBetweenDateCondition(
          "DATE_TRUNC('quarter', NOW())",
          "NOW()",
          field,
          scalarFn,
          intervalFn
        )
      case CurrentYear(field, scalarFn, intervalFn) =>
        toBetweenDateCondition(
          "DATE_TRUNC('year', NOW())",
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

  override def toHistogramSql(fieldName: String, baseSql: String, numBins: Int): String = {
    require(numBins > 1, "Bin number should be greater than 1.")
    s"""
       |select
       |  min_value + bin_num * bin_size as lower_bound,
       |  min_value + (bin_num + 1) * bin_size as upper_bound,
       |  count
       |from (
       |  select
       |    floor(($fieldName - min_value) / bin_size) as bin_num,
       |    count(1) as count,
       |    min(bin_size) as bin_size,
       |    min(min_value) as min_value,
       |    max(max_value) as max_value
       |  from ($baseSql) base_data
       |  join (
       |      select
       |      ceil((max($fieldName) - min($fieldName)) / $numBins) as bin_size,
       |      min($fieldName) as min_value,
       |      max($fieldName) as max_value
       |    from ($baseSql) base_data
       |  ) bin_size_data on true
       |  group by bin_num
       |  order by bin_num
       |) histogram_values;
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
      case Some(aliasName) => s"$aliasName"
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

        s"""f_${StringUtils.shortMd5(aliasName)}"""
    }
  }

  def toAliasName(controlFunction: ControlFunction): String = {
    controlFunction match {
      case f: SelectNull      => "null"
      case f: SelectExpr      => s"${f.aliasName.getOrElse(s"expr_${this.hashCode().toChar.toInt}")}"
      case f: CountAll        => s"${f.aliasName.getOrElse(s"count_all_${this.hashCode().toChar.toInt}")}"
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
      case ToYear(_, _)     => s"DATE_PART('year', $field)"
      case ToQuarter(_, _)  => s"DATE_PART('quarter', $field)"
      case ToMonth(_, _)    => s"DATE_PART('month', $field)"
      case ToWeek(_, _)     => s"DATE_PART('week', $field)"
      case ToDate(_, _)     => s"CAST($field AS DATE)"
      case ToDateTime(_, _) => s"CAST($field AS TIMESTAMP)"

      case SecondsToDateTime(_, _) => s"TIMESTAMP 'EPOCH' + $field * INTERVAL '1 SECOND'"
      case MillisToDateTime(_, _)  => s"TIMESTAMP 'EPOCH' + $field / 1000 * INTERVAL '1 SECOND'"
      case NanosToDateTime(_, _)   => s"TIMESTAMP 'EPOCH' + $field / 1000000 * INTERVAL '1 SECOND'"
      case DatetimeToSeconds(_, _) => s"EXTRACT(EPOCH FROM $field)"
      case DatetimeToMillis(_, _)  => s"EXTRACT(EPOCH FROM $field) * 1000"
      case DatetimeToNanos(_, _)   => s"EXTRACT(EPOCH FROM $field) * 1000000"

      case ToDayOfYear(_, _)  => s"DATE_PART('doy', $field)"
      case ToDayOfMonth(_, _) => s"DATE_PART('day', $field)"
      case ToDayOfWeek(_, _)  => s"DATE_PART('dow', $field)"
      case ToHour(_, _)       => s"DATE_PART('hour', $field)"
      case ToMinute(_, _)     => s"DATE_PART('minute', $field)"
      case ToSecond(_, _)     => s"DATE_PART('second', $field)"

      case ToYearNum(_, _)    => s"DATE_PART('year', $field)"
      case ToQuarterNum(_, _) => s"TRUNC(DATE_PART('day', $field - TIMESTAMP '1970-01-01') / 90)"
      case ToMonthNum(_, _)   => s"TRUNC(DATE_PART('day', $field - TIMESTAMP '1970-01-01') / 30)"
      case ToWeekNum(_, _)    => s"TRUNC(DATE_PART('day', $field - TIMESTAMP '1970-01-01') / 7)"
      case ToDayNum(_, _)     => s"DATE_PART('day', $field - TIMESTAMP '1970-01-01')"
      case ToHourNum(_, _)    => s"EXTRACT(EPOCH FROM $field) / 3600"
      case ToMinuteNum(_, _)  => s"EXTRACT(EPOCH FROM $field) / 60"
      case ToSecondNum(_, _)  => s"EXTRACT(EPOCH FROM $field)"

      case DateDiff(unit, date, _, _)   => ???
      case GetArrayElement(_, index, _) => ???
      case Decrypt(_, _)                => ???

      case PastNYear(unit, _, _)    => s"$field - INTERVAL '$unit years'"
      case PastNQuarter(unit, _, _) => s"$field - INTERVAL '${unit * 3} months'"
      case PastNMonth(unit, _, _)   => s"$field - INTERVAL '$unit months'"
      case PastNWeek(unit, _, _)    => s"$field - INTERVAL '$unit weeks'"
      case PastNDay(unit, _, _)     => s"$field - INTERVAL '$unit days'"

      case Cast(asType, _) => s"CAST($field AS $asType)"

      case ToInt8OrNull(_, _)       => s"CAST($field as smallint)"
      case ToInt16OrNull(_, _)      => s"CAST($field as integer)"
      case ToInt32OrNull(_, _)      => s"CAST($field as integer)"
      case ToInt64OrNull(_, _)      => s"CAST($field as bigint)"
      case ToUInt8OrNull(_, _)      => s"CAST($field as smallint)"
      case ToUInt16OrNull(_, _)     => s"CAST($field as integer)"
      case ToUInt32OrNull(_, _)     => s"CAST($field as integer)"
      case ToUInt64OrNull(_, _)     => s"CAST($field as bigint)"
      case ToFloatOrNull(_, _)      => s"CAST($field as float)"
      case ToDoubleOrNull(_, _)     => s"CAST($field as double precision)"
      case ToDateOrNull(_, _)       => s"CAST($field as date)"
      case ToDateTimeOrNull(_, _)   => s"CAST($field as timestamp)"
      case ToDateTime64OrNull(_, _) => s"CAST($field as timestamp)"
      case ToStringOrNull(_, _)     => s"CAST($field as text)"
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
