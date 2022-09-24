package co.datainsider.bi.domain.query

import co.datainsider.bi.domain.{QueryContext, RlsCondition}
import co.datainsider.bi.domain.query.JoinType.JoinType
import co.datainsider.bi.engine.{SqlParser, TableExpressionUtils}
import com.google.inject.Inject
import com.twitter.inject.Logging
import datainsider.client.exception.BadRequestError
import datainsider.client.util.ZConfig

trait QueryParser {
  def parse(query: Query): String
}

/** *
  * Parse query object to clickhouse string query
  * Conditions in query concatenate with each other by "and"
  * External conditions concatenate with each other by "and", connect with existing conditions with "and"
  */
class QueryParserImpl @Inject() (sqlParser: SqlParser) extends QueryParser with Logging {

  override def parse(query: Query): String = {
    val baseSql: String = query match {
      case sqlQuery: SqlQuery    => sqlQuery.query
      case objQuery: ObjectQuery => toQueryString(objQuery)
      case _                     => throw BadRequestError(s"$query parsing is not supported")
    }

    val encryptedSql = if (query.encryptKey.isDefined) {
      toDecryptSql(baseSql, query.encryptKey.get)
    } else {
      baseSql
    }

    val rowFilteredSql = toRowFilteredSql(encryptedSql, query.rlsConditions)

    applyContextValues(rowFilteredSql, query.getFinalContext())

  }

  private def toQueryString(objQuery: ObjectQuery): String = {
    val sqlBuilder = new SqlBuilder(sqlParser)
    sqlBuilder.setLimit(objQuery.limit)

    objQuery.allQueryViews.foreach(view => sqlBuilder.addFrom(FromField(toViewSqlStr(view), view.aliasName)))

    setJoinConditions(sqlBuilder, objQuery.joinConditions)

    objQuery.functions.foreach(sqlBuilder.addFunction)
    objQuery.conditions.foreach(sqlBuilder.addCondition)

    objQuery.aggregateConditions.foreach(sqlBuilder.addAggregateCondition)
    objQuery.orders.foreach(sqlBuilder.addOrder)

    sqlBuilder.build()

  }

  private def toViewSqlStr(view: QueryView): String = {
    view match {
      case inlineView: SqlView  => toInlineViewStr(inlineView)
      case tableView: TableView => toTableViewStr(tableView)
    }
  }

  private def toInlineViewStr(inlineView: SqlView): String = {
    inlineView.query match {
      case objQuery: ObjectQuery => s"(${toQueryString(objQuery)}) ${inlineView.aliasName}"
      case sqlQuery: SqlQuery    => s"(${sqlQuery.query}) ${inlineView.aliasName}"
    }
  }

  private def toTableViewStr(tableView: TableView): String = {
    s"${tableView.dbName}.${tableView.tblName} ${tableView.aliasName}"
  }

  private def setJoinConditions(builder: SqlBuilder, joinConditions: Seq[JoinCondition]): Unit = {
    joinConditions.foreach(joinCondition => {
      val conditionStr: String = sqlParser.toQueryString(And(joinCondition.equals.toArray))
      val joinType: JoinType = joinCondition match {
        case _: InnerJoin => JoinType.Inner
        case _: LeftJoin  => JoinType.Left
        case _: RightJoin => JoinType.Right
      }

      builder.addFrom(FromField(toViewSqlStr(joinCondition.leftView), joinCondition.leftView.aliasName))
      builder.addFrom(FromField(toViewSqlStr(joinCondition.rightView), joinCondition.rightView.aliasName))

      builder.addJoin(
        JoinField(
          joinType = joinType,
          leftViewName = joinCondition.leftView.aliasName,
          rightViewName = joinCondition.rightView.aliasName,
          conditionStr = conditionStr
        )
      )
    })
  }

  private def toDecryptSql(sql: String, encryptKey: String): String = {
    val encryptMode = ZConfig.getString("database.clickhouse.encryption.mode")
    val initialVector = ZConfig.getString("database.clickhouse.encryption.iv")

    sql.replaceAll(
      """decrypt\((.+)\)""",
      s"decrypt('$encryptMode', $$1, unhex('$encryptKey'), unhex('$initialVector'))"
    )

  }

  private def toRowFilteredSql(sql: String, rlsConditions: Seq[RlsCondition]): String = {
    rlsConditions.foldLeft(sql)(applyRlsCondition) // TODO: detect related table only
  }

  private def applyRlsCondition(sql: String, rlsCondition: RlsCondition): String = {
    require(rlsCondition.dbName.nonEmpty, "rls policy dbName is missing")
    require(rlsCondition.tblName.nonEmpty, "rls policy tblName is missing")
    require(rlsCondition.conditions.nonEmpty, "rls policy conditions is missing")

    val filterQuery = ObjectQuery(
      functions = Seq(SelectAll()),
      conditions = rlsCondition.conditions,
      queryViews = Seq(TableView(rlsCondition.dbName, rlsCondition.tblName))
    )
    val filteredStatement: String = s" from (${parse(filterQuery)}) "

    val fromClauseRegex = raw"""(?i)[^\w\d]+(from\s+`?${rlsCondition.dbName}`?\.`?${rlsCondition.tblName}`?\b)""".r

    fromClauseRegex.replaceAllIn(sql, m => m.group(0).replace(m.group(1), filteredStatement))
  }

  private def applyContextValues(sql: String, queryContext: QueryContext): String = {
    if (queryContext.variables.isEmpty) {
      return sql
    }

    TableExpressionUtils.parseToFullExpressions(sql, queryContext.variables)
  }

}
