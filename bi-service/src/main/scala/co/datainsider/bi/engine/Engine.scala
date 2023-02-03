package co.datainsider.bi.engine

import co.datainsider.bi.domain.query.{AggregateCondition, Condition, Function, ScalarFunction, SelectExpression}

trait Engine[R] {

  def execute(sql: String, doFormatValues: Boolean = true): R

  def executeHistogramQuery(histogramSql: String): R
}

/*
 * parse function and condition to specific sql language syntax
 */
trait SqlParser {

  def toQueryString(condition: Condition): String

  def toQueryString(aggregateCondition: AggregateCondition): String

  def toQueryString(function: Function): String

  def toQueryString(scalarFn: ScalarFunction, field: String): String

  def toAliasName(function: Function): String

  def toFieldWithAliasName(function: Function): String
}
