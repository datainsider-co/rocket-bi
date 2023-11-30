package co.datainsider.bi.domain.query

import co.datainsider.bi.domain.RlsCondition
import co.datainsider.bi.domain.query.JoinType.JoinType
import co.datainsider.bi.engine.{ExpressionUtils, SqlParser}
import co.datainsider.bi.util.ZConfig
import com.google.inject._
import com.google.inject.assistedinject.Assisted
import com.twitter.inject.Logging
import datainsider.client.exception.BadRequestError

trait QueryParser {
  def parse(query: Query, useAliasName: Boolean = true): String
}

/** *
  * Parse query object to clickhouse string query
  * Conditions in query concatenate with each other by "and"
  * External conditions concatenate with each other by "and", connect with existing conditions with "and"
  */
final class QueryParserImpl @Inject() (@Assisted sqlParser: SqlParser) extends QueryParser with Logging {

  override def parse(query: Query, useAliasName: Boolean = true): String = {
    var sql: String = query match {
      case sqlQuery: SqlQuery    => sqlQuery.query
      case objQuery: ObjectQuery => parse(objQuery, useAliasName)
      case _                     => throw BadRequestError(s"$query parsing is not supported")
    }

    if (query.encryptKey.isDefined) {
      sql = applyDecryption(sql, query.encryptKey.get)
    }

    if (query.expressions.nonEmpty) {
      sql = ExpressionUtils.parseToFullExpr(sql, query.expressions)
    }

    if (query.parameters.nonEmpty) {
      sql = applyParameters(sql, query.parameters)
    }

    if (query.rlsConditions.nonEmpty) {
      sql = applyRlsConditions(sql, query.rlsConditions)
    }

    sql
  }

  private def parse(objQuery: ObjectQuery, useAliasName: Boolean): String = {
    val sqlBuilder = new SqlBuilder(sqlParser)
    sqlBuilder.setLimit(objQuery.limit)

    objQuery.allQueryViews.foreach(view => sqlBuilder.addFrom(FromField(toViewSqlStr(view), view.aliasName)))

//    NOTE: only clickhouse support this kind of expressions!
//    objQuery.expressions.foreach {
//      case (exprName, expr) =>
//        if (ExpressionUtils.isApplyAllExpr(expr)) {
//          val applyAllQuery: String = buildApplyAllQuery(expr, objQuery)
//          sqlBuilder.addCte(CteField(exprName, applyAllQuery))
//        } else {
//          sqlBuilder.addCte(CteField(exprName, expr))
//        }
//    }

    setJoinConditions(sqlBuilder, objQuery.joinConditions)

    objQuery.functions.foreach(func => sqlBuilder.addFunction(func, useAliasName))
    objQuery.conditions.foreach(sqlBuilder.addCondition)
    objQuery.aggregateConditions.foreach(sqlBuilder.addAggregateCondition)
    objQuery.orders.foreach(order => sqlBuilder.addOrder(order, useAliasName))

    sqlBuilder.build()

  }

  private def toViewSqlStr(view: QueryView): String = {
    view match {
      case sqlView: SqlView     => toInlineSqlView(sqlView)
      case tableView: TableView => s"${sqlParser.toTableViewFullName(tableView)} ${view.aliasName}"
    }
  }

  private def toInlineSqlView(sqlView: SqlView): String = {
    sqlView.query match {
      case objQuery: ObjectQuery => s"(${parse(objQuery)}) ${sqlView.aliasName}"
      case sqlQuery: SqlQuery    => s"(${sqlQuery.query}) ${sqlView.aliasName}"
    }
  }

  private def setJoinConditions(builder: SqlBuilder, joinConditions: Seq[JoinCondition]): Unit = {
    joinConditions.foreach(joinCondition => {
      val conditionStr: String = sqlParser.toQueryString(And(joinCondition.equals.toArray))
      val joinType: JoinType = joinCondition match {
        case _: InnerJoin => JoinType.Inner
        case _: LeftJoin  => JoinType.Left
        case _: RightJoin => JoinType.Right
        case _: FullJoin  => JoinType.Full
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

  private def applyDecryption(sql: String, encryptKey: String): String = {
    val encryptMode = ZConfig.getString("database.clickhouse.encryption.mode")
    val initialVector = ZConfig.getString("database.clickhouse.encryption.iv")

    sql.replaceAll(
      """decrypt\((.+)\)""",
      s"decrypt('$encryptMode', $$1, unhex('$encryptKey'), unhex('$initialVector'))"
    )

  }

  private def applyRlsConditions(sql: String, rlsConditions: Seq[RlsCondition]): String = {
    rlsConditions.foldLeft(sql)(applyRlsCondition) // TODO: detect related table only
  }

  private def applyRlsCondition(sql: String, rlsCondition: RlsCondition): String = {
    require(rlsCondition.dbName.nonEmpty, "rls policy dbName is missing")
    require(rlsCondition.tblName.nonEmpty, "rls policy tblName is missing")
    require(rlsCondition.conditions.nonEmpty, "rls policy conditions is missing")

    val filterQuery = ObjectQuery(
      functions = Seq(SelectAll()),
      conditions = Seq(Or(rlsCondition.conditions.toArray)),
      queryViews = Seq(TableView(rlsCondition.dbName, rlsCondition.tblName))
    )
    val filteredStatement: String = s" from (${parse(filterQuery)}) "

    val fromClauseRegex = raw"""(?i)[^\w\d]+(from\s+`?${rlsCondition.dbName}`?\.`?${rlsCondition.tblName}`?\b)""".r

    fromClauseRegex.replaceAllIn(sql, m => m.group(0).replace(m.group(1), filteredStatement))
  }

  private def buildApplyAllQuery(applyAllExpr: String, baseObjQuery: ObjectQuery): String = {
    val mainExpr: String = ExpressionUtils.getMainExpression(applyAllExpr)

    val exprQuery: ObjectQuery = baseObjQuery.copy(
      functions = Seq(SelectExpr(mainExpr)),
      queryViews = baseObjQuery.allQueryViews,
      orders = Seq.empty,
      limit = None,
      customExpressions = Map.empty
    )

    parse(exprQuery)
  }

  private def applyParameters(sql: String, parameters: Map[String, String]): String = {
    parameters.foldLeft(sql)((query, kv) => {
      val PARAM_REGEX = raw"""\{\{\s*${kv._1}\s*\}\}"""

      query.replaceAll(PARAM_REGEX, kv._2)
    })
  }

}
