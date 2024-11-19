package co.datainsider.bi.engine.mysql

import co.datainsider.bi.domain.query._
import co.datainsider.bi.engine.SqlParser
import co.datainsider.bi.util.Implicits.{ImplicitString, NULL_VALUE}
import co.datainsider.bi.util._
import co.datainsider.common.client.exception.UnsupportedError

object MySqlParser extends SqlParser {

  /** *****************************************************
    * Object dialect parser: Parse object to clickhouse sql *
    * *****************************************************
    */

  override def toTableViewFullName(view: TableView): String = {
    s"`${view.dbName}`.`${view.tblName}`"
  }

  def toQueryString(condition: Condition): String = {
    condition match {
      case and: And                           => toAndConditionStr(and)
      case or: Or                             => toOrConditionStr(or)
      case dynamicCondition: DynamicCondition => toDynamicConditionStr(dynamicCondition)

      case in: In       => toInConditionStr(in)
      case notIn: NotIn => toNotInConditionStr(notIn)

      case EqualField(leftField, rightField, leftScalarFn, rightScalarFn) =>
        s"${applyScalarFn(leftField.fullFieldNameWithEscape, leftScalarFn)} = ${applyScalarFn(rightField.fullFieldNameWithEscape, rightScalarFn)}"
      case NotEqualField(leftField, rightField, leftScalarFn, rightScalarFn) =>
        s"${applyScalarFn(leftField.fullFieldNameWithEscape, leftScalarFn)} != ${applyScalarFn(rightField.fullFieldNameWithEscape, rightScalarFn)}"
      case GreaterThanField(leftField, rightField, leftScalarFn, rightScalarFn) =>
        s"${applyScalarFn(leftField.fullFieldNameWithEscape, leftScalarFn)} > ${applyScalarFn(rightField.fullFieldNameWithEscape, rightScalarFn)}"
      case LessThanField(leftField, rightField, leftScalarFn, rightScalarFn) =>
        s"${applyScalarFn(leftField.fullFieldNameWithEscape, leftScalarFn)} < ${applyScalarFn(rightField.fullFieldNameWithEscape, rightScalarFn)}"
      case GreaterOrEqualField(leftField, rightField, leftScalarFn, rightScalarFn) =>
        s"${applyScalarFn(leftField.fullFieldNameWithEscape, leftScalarFn)} >= ${applyScalarFn(rightField.fullFieldNameWithEscape, rightScalarFn)}"
      case LessOrEqualField(leftField, rightField, leftScalarFn, rightScalarFn) =>
        s"${applyScalarFn(leftField.fullFieldNameWithEscape, leftScalarFn)} <= ${applyScalarFn(rightField.fullFieldNameWithEscape, rightScalarFn)}"

      case Null(field, scalarFn)     => s"${applyScalarFn(field.fullFieldNameWithEscape, scalarFn)} is null"
      case NotNull(field, scalarFn)  => s"${applyScalarFn(field.fullFieldNameWithEscape, scalarFn)} is not null"
      case Empty(field, scalarFn)    => s"${applyScalarFn(field.fullFieldNameWithEscape, scalarFn)} = ''"
      case NotEmpty(field, scalarFn) => s"${applyScalarFn(field.fullFieldNameWithEscape, scalarFn)} != ''"

      case Equal(field, value, scalarFn) =>
        s"${applyScalarFn(field.fullFieldNameWithEscape, scalarFn)} = ${toCorrespondingValue(field.fieldType, value, scalarFn)}"
      case NotEqual(field, value, scalarFn) =>
        s"${applyScalarFn(field.fullFieldNameWithEscape, scalarFn)} != ${toCorrespondingValue(field.fieldType, value, scalarFn)}"
      case GreaterThan(field, value, scalarFn) =>
        s"${applyScalarFn(field.fullFieldNameWithEscape, scalarFn)} > ${toCorrespondingValue(field.fieldType, value, scalarFn)}"
      case GreaterThanOrEqual(field, value, scalarFn) =>
        s"${applyScalarFn(field.fullFieldNameWithEscape, scalarFn)} >= ${toCorrespondingValue(field.fieldType, value, scalarFn)}"
      case LessThan(field, value, scalarFn) =>
        s"${applyScalarFn(field.fullFieldNameWithEscape, scalarFn)} < ${toCorrespondingValue(field.fieldType, value, scalarFn)}"
      case LessThanOrEqual(field, value, scalarFn) =>
        s"${applyScalarFn(field.fullFieldNameWithEscape, scalarFn)} <= ${toCorrespondingValue(field.fieldType, value, scalarFn)}"
      case MatchRegex(field, value, scalarFn) =>
        s"match(${applyScalarFn(field.fullFieldNameWithEscape, scalarFn)}, ${toCorrespondingValue(field.fieldType, value, scalarFn)})"
      case Like(field, value, scalarFn) =>
        s"like(${applyScalarFn(field.fullFieldNameWithEscape, scalarFn)}, ${toCorrespondingValue(field.fieldType, s"%$value%", scalarFn)})"
      case NotLike(field, value, scalarFn) =>
        s"not like(${applyScalarFn(field.fullFieldNameWithEscape, scalarFn)}, ${toCorrespondingValue(field.fieldType, s"%$value%", scalarFn)})"
      case LikeCaseInsensitive(field, value, scalarFn) =>
        s"like(lower(${applyScalarFn(field.fullFieldNameWithEscape, scalarFn)}), ${toCorrespondingValue(field.fieldType, s"%$value%", scalarFn)})"
      case NotLikeCaseInsensitive(field, value, scalarFn) =>
        s"not like(lower(${applyScalarFn(field.fullFieldNameWithEscape, scalarFn)}), ${toCorrespondingValue(field.fieldType, s"%$value%", scalarFn)})"
      case Between(field, min, max, scalarFn) =>
        s"(${applyScalarFn(field.fullFieldNameWithEscape, scalarFn)} > ${toCorrespondingValue(field.fieldType, min)}) " +
          s"and (${applyScalarFn(field.fullFieldNameWithEscape, scalarFn)} < ${toCorrespondingValue(field.fieldType, max)})"
      case BetweenAndIncluding(field, min, max, scalarFn) =>
        s"${applyScalarFn(field.fullFieldNameWithEscape, scalarFn)} between ${toCorrespondingValue(field.fieldType, min)} " +
          s"and ${toCorrespondingValue(field.fieldType, max)}"

      case LastNMinute(field, nMinute, scalarFn, intervalFn) =>
        toBetweenDateCondition(
          s"DATE_SUB(DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:00'), INTERVAL $nMinute MINUTE)",
          "DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:00')",
          field,
          scalarFn,
          intervalFn
        )
      case LastNHour(field, nHour, scalarFn, intervalFn) =>
        toBetweenDateCondition(
          s"DATE_SUB(DATE_FORMAT(NOW(), '%Y-%m-%d %H:00:00'), INTERVAL $nHour HOUR)",
          "DATE_FORMAT(NOW(), '%Y-%m-%d %H:00:00')",
          field,
          scalarFn,
          intervalFn
        )
      case LastNDay(field, nDay, scalarFn, intervalFn) =>
        toBetweenDateCondition(
          s"DATE_SUB(CURDATE(), INTERVAL $nDay DAY)",
          "CURDATE()",
          field,
          scalarFn,
          intervalFn
        )
      case LastNWeek(field, nWeek, scalarFn, intervalFn) =>
        toBetweenDateCondition(
          s"DATE_SUB(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL $nWeek WEEK)", // begin of week is Monday
          "DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)",
          field,
          scalarFn,
          intervalFn
        )
      case LastNMonth(field, nMonth, scalarFn, intervalFn) =>
        toBetweenDateCondition(
          s"DATE_SUB(DATE_SUB(CURDATE(), INTERVAL (DAY(CURDATE()) -1) DAY), INTERVAL $nMonth MONTH)",
          "DATE_SUB(CURDATE(), INTERVAL (DAY(CURDATE()) -1) DAY)",
          field,
          scalarFn,
          intervalFn
        )
      case LastNQuarter(field, nQuarter, scalarFn, intervalFn) =>
        toBetweenDateCondition(
          s"DATE_SUB(DATE_ADD(MAKEDATE(YEAR(NOW()), 1), INTERVAL (QUARTER(NOW()) - 1) QUARTER), INTERVAL $nQuarter QUARTER)",
          "DATE_ADD(MAKEDATE(YEAR(NOW()), 1), INTERVAL (QUARTER(NOW()) - 1) QUARTER)",
          field,
          scalarFn,
          intervalFn
        )
      case LastNYear(field, nYear, scalarFn, intervalFn) =>
        toBetweenDateCondition(
          s"DATE_SUB(MAKEDATE(YEAR(NOW()), 1), INTERVAL $nYear YEAR)",
          "MAKEDATE(YEAR(NOW()), 1)",
          field,
          scalarFn,
          intervalFn
        )

      case CurrentDay(field, scalarFn, intervalFn) =>
        toBetweenDateCondition(
          "CURDATE()",
          "NOW()",
          field,
          scalarFn,
          intervalFn
        )
      case CurrentWeek(field, scalarFn, intervalFn) =>
        toBetweenDateCondition(
          "DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)",
          "NOW()",
          field,
          scalarFn,
          intervalFn
        )
      case CurrentMonth(field, scalarFn, intervalFn) =>
        toBetweenDateCondition(
          "DATE_SUB(CURDATE(), INTERVAL (DAY(CURDATE()) -1) DAY)",
          "NOW()",
          field,
          scalarFn,
          intervalFn
        )
      case CurrentQuarter(field, scalarFn, intervalFn) =>
        toBetweenDateCondition(
          "DATE_ADD(MAKEDATE(YEAR(NOW()), 1), INTERVAL (QUARTER(NOW()) - 1) QUARTER)",
          "NOW()",
          field,
          scalarFn,
          intervalFn
        )
      case CurrentYear(field, scalarFn, intervalFn) =>
        toBetweenDateCondition(
          "MAKEDATE(YEAR(NOW()), 1)",
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
       |  least(max_value, min_value + (bin_num + 1) * bin_size) as upper_bound,
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
       |  ) bin_size_data
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
    val fieldStr: String = applyScalarFn(in.field.fullFieldNameWithEscape, in.scalarFunction)
    val valuesStr: String = in.possibleValues.filterNot(v => v.isNull).map(escapeString).mkString(",")

    if (in.isIncludeNull) {
      s"(isNull($fieldStr) or $fieldStr in (null,$valuesStr))"
    } else {
      s"$fieldStr in (null,$valuesStr)"
    }
  }

  private def toNotInConditionStr(notIn: NotIn): String = {
    val fieldStr: String = applyScalarFn(notIn.field.fullFieldNameWithEscape, notIn.scalarFunction)
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
    val fieldName = s"${function.field.fullFieldNameWithEscape}"
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
      case Some(aliasName) => s"`$aliasName`"
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

        s"""`f_${StringUtils.shortMd5(aliasName)}`"""
    }
  }

  def toAliasName(controlFunction: ControlFunction): String = {
    controlFunction match {
      case f: SelectNull      => "`null`"
      case f: SelectExpr      => s"`${f.aliasName.getOrElse(s"expr_${this.hashCode().toChar.toInt}")}`"
      case f: CountAll        => s"`${f.aliasName.getOrElse(s"count_all_${this.hashCode().toChar.toInt}")}`"
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
      case ToYear(_, _)     => s"YEAR($field)"
      case ToQuarter(_, _)  => s"QUARTER($field)"
      case ToMonth(_, _)    => s"MONTH($field)"
      case ToWeek(_, _)     => s"WEEK($field)"
      case ToDate(_, _)     => s"DATE($field)"
      case ToDateTime(_, _) => s"CONVERT($field, DATETIME)"

      case SecondsToDateTime(_, _) => s"FROM_UNIXTIME($field)"
      case MillisToDateTime(_, _)  => s"FROM_UNIXTIME($field / 1000)"
      case NanosToDateTime(_, _)   => s"FROM_UNIXTIME($field / 1000000)"
      case DatetimeToSeconds(_, _) => s"UNIX_TIMESTAMP($field)"
      case DatetimeToMillis(_, _)  => s"UNIX_TIMESTAMP($field) * 1000"
      case DatetimeToNanos(_, _)   => s"UNIX_TIMESTAMP($field) * 1000000"

      case ToDayOfYear(_, _)  => s"DAYOFYEAR($field)"
      case ToDayOfMonth(_, _) => s"DAYOFMONTH($field)"
      case ToDayOfWeek(_, _)  => s"DAYOFWEEK($field)"
      case ToHour(_, _)       => s"HOUR($field)"
      case ToMinute(_, _)     => s"MINUTE($field)"
      case ToSecond(_, _)     => s"SECOND($field)"

      case ToYearNum(_, _)    => s"YEAR($field)"
      case ToQuarterNum(_, _) => s"TIMESTAMPDIFF(QUARTER, DATE('1970-01-01'), $field)"
      case ToMonthNum(_, _)   => s"TIMESTAMPDIFF(MONTH, DATE('1970-01-01'), $field)"
      case ToWeekNum(_, _)    => s"TIMESTAMPDIFF(WEEK, DATE('1970-01-01'), $field)"
      case ToDayNum(_, _)     => s"TIMESTAMPDIFF(DAY, DATE('1970-01-01'), $field)"
      case ToHourNum(_, _)    => s"TIMESTAMPDIFF(HOUR, DATE('1970-01-01'), $field)"
      case ToMinuteNum(_, _)  => s"TIMESTAMPDIFF(MINUTE, DATE('1970-01-01'), $field)"
      case ToSecondNum(_, _)  => s"UNIX_TIMESTAMP($field)"

      case DateDiff(unit, date, _, _)   => s"TIMESTAMPDIFF($unit, $date, $field)"
      case GetArrayElement(_, index, _) => ???
      case Decrypt(_, _)                => ???

      case PastNYear(unit, _, _)    => s"DATE_SUB($field, INTERVAL $unit YEAR)"
      case PastNQuarter(unit, _, _) => s"DATE_SUB($field, INTERVAL $unit QUARTER)"
      case PastNMonth(unit, _, _)   => s"DATE_SUB($field, INTERVAL $unit MONTH)"
      case PastNWeek(unit, _, _)    => s"DATE_SUB($field, INTERVAL $unit WEEK)"
      case PastNDay(unit, _, _)     => s"DATE_SUB($field, INTERVAL $unit DAY)"

      case Cast(asType, _) => s"CONVERT($field, $asType)"

      case ToInt8OrNull(_, _)       => s"CONVERT($field, DECIMAL)"
      case ToInt16OrNull(_, _)      => s"CONVERT($field, DECIMAL)"
      case ToInt32OrNull(_, _)      => s"CONVERT($field, DECIMAL)"
      case ToInt64OrNull(_, _)      => s"CONVERT($field, DECIMAL)"
      case ToUInt8OrNull(_, _)      => s"CONVERT($field, DECIMAL)"
      case ToUInt16OrNull(_, _)     => s"CONVERT($field, DECIMAL)"
      case ToUInt32OrNull(_, _)     => s"CONVERT($field, DECIMAL)"
      case ToUInt64OrNull(_, _)     => s"CONVERT($field, DECIMAL)"
      case ToFloatOrNull(_, _)      => s"CONVERT($field, DECIMAL)"
      case ToDoubleOrNull(_, _)     => s"CONVERT($field, DECIMAL)"
      case ToDateOrNull(_, _)       => s"CONVERT($field, DATE)"
      case ToDateTimeOrNull(_, _)   => s"CONVERT($field, DATETIME)"
      case ToDateTime64OrNull(_, _) => s"CONVERT($field, DATETIME)"
      case ToStringOrNull(_, _)     => s"CONVERT($field, NCHAR)"
    }
  }

  def applyScalarFunctionToField(scalarFn: ScalarFunction, field: Field): String = {
    scalarFn.innerFn match {
      case Some(innerFn) => toQueryString(scalarFn, applyScalarFunctionToField(innerFn, field))
      case _             => toQueryString(scalarFn, field.fullFieldNameWithEscape)
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
    val date: String = applyScalarFn(dateField.fullFieldNameWithEscape, scalarFunction)
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
