package co.datainsider.bi.domain.query

import co.datainsider.bi.domain.query.JoinType.JoinType
import co.datainsider.bi.engine.SqlParser
import co.datainsider.common.client.exception.BadRequestError

import scala.collection.mutable
import scala.collection.mutable.ArrayBuffer

/**
  * E.g: FromField("sale_db.data a", "a")
  *      FromField("(select * from some_table) t", "t")
  * @param sqlStr sql part after 'from', E.g from <sqlView> join <sqlView> on ...
  * @param viewName identifier to know which view is which
  */
case class FromField(sqlStr: String, viewName: String)

/**
  * E.g: (viewA.id = viewB.userId)
  * @param leftViewName view name on the left side
  * @param rightViewName view name on the right side
  * @param conditionStr condition in sql syntax, sql part after 'on'
  */
case class JoinField(joinType: JoinType, leftViewName: String, rightViewName: String, conditionStr: String)

case class CteField(exprName: String, expression: String)

object JoinType extends Enumeration {
  type JoinType = Value
  val Left: JoinType = Value("left")
  val Right: JoinType = Value("right")
  val Inner: JoinType = Value("inner")
  val Full: JoinType = Value("full")
}

/*
 * construct actual sql to be executed by sql engine
 * fields (in select, where, group by, having, order by clauses) are separated by comma -> arr.mkString(",")
 * views (in from clause) are separated by join clause -> viewA join viewB on (viewA.id = viewB.userId)
 */
class SqlBuilder(sqlParser: SqlParser) {

  val selectFields: ArrayBuffer[String] = ArrayBuffer[String]()
  val aggregateFields: ArrayBuffer[String] = ArrayBuffer[String]()
  val fromFields: mutable.Set[FromField] = mutable.Set[FromField]()
  val joinFields: ArrayBuffer[JoinField] = ArrayBuffer[JoinField]()
  val whereFields: ArrayBuffer[String] = ArrayBuffer[String]()
  val groupByFields: ArrayBuffer[String] = ArrayBuffer[String]()
  val havingFields: ArrayBuffer[String] = ArrayBuffer[String]()
  val orderByFields: ArrayBuffer[String] = ArrayBuffer[String]()
  val cteFields: ArrayBuffer[CteField] = ArrayBuffer[CteField]()
  var isGroupBy: Boolean = false
  var isDistinct: Boolean = false
  var isLimit: Boolean = false
  var limitSize: Int = 10000
  var limitOffset: Int = 0

  def addFunction(function: Function, useAliasName: Boolean): Unit = {
    function match {
      case f: Select =>
        val selectField: String = sqlParser.toSelectField(f, useAliasName)
        val groupByField: String = if (useAliasName) {
          sqlParser.toAliasName(f)
        } else selectField
        selectFields += selectField
        groupByFields += groupByField
      case f: SelectDistinct =>
        selectFields += sqlParser.toSelectField(f, useAliasName)
        isDistinct = true
      case f: GroupBy =>
        val selectField: String = sqlParser.toSelectField(f, useAliasName)
        val groupByField: String = if (useAliasName) {
          sqlParser.toAliasName(f)
        } else selectField
        selectFields += selectField
        groupByFields += groupByField
        isGroupBy = true
      case f: Count =>
        aggregateFields += sqlParser.toSelectField(f, useAliasName)
      case f: CountDistinct =>
        aggregateFields += sqlParser.toSelectField(f, useAliasName)
      case f: Avg =>
        aggregateFields += sqlParser.toSelectField(f, useAliasName)
      case f: Min =>
        aggregateFields += sqlParser.toSelectField(f, useAliasName)
      case f: Max =>
        aggregateFields += sqlParser.toSelectField(f, useAliasName)
      case f: Sum =>
        aggregateFields += sqlParser.toSelectField(f, useAliasName)
      case f: First =>
        aggregateFields += sqlParser.toSelectField(f, useAliasName)
      case f: Last =>
        aggregateFields += sqlParser.toSelectField(f, useAliasName)
      case f: SelectExpression =>
        aggregateFields += sqlParser.toSelectField(f, useAliasName)

      case f: SelectAll =>
        selectFields += "*"
      case f: SelectNull =>
        selectFields += sqlParser.toSelectField(f, useAliasName)
      case f: CountAll =>
        selectFields += sqlParser.toSelectField(f, useAliasName)
      case f: SelectExpr =>
        selectFields += sqlParser.toSelectField(f, useAliasName)

      case f: DynamicFunction =>
        addFunction(f.finalFunction.getOrElse(f.baseFunction), useAliasName)

    }
  }

  def addCondition(condition: Condition): Unit = {
    condition match {
      case And(conditions) =>
        val conditionStrings = conditions.map(sqlParser.toQueryString).filter(_.nonEmpty)
        if (conditionStrings.nonEmpty) whereFields += conditionStrings.mkString("(", " and ", ")")
      case Or(conditions) =>
        val conditionStrings = conditions.map(sqlParser.toQueryString).filter(_.nonEmpty)
        if (conditionStrings.nonEmpty) whereFields += conditionStrings.mkString("(", " or ", ")")
      case DynamicCondition(_, _, finalCondition, _) =>
        val conditionStr = finalCondition.map(sqlParser.toQueryString).filter(_.nonEmpty)
        if (conditionStr.isDefined) {
          whereFields += conditionStr.get
        }
      case _ =>
        whereFields += sqlParser.toQueryString(condition)
    }
  }

  def addAggregateCondition(aggregateCondition: AggregateCondition): Unit = {
    val havingStr = sqlParser.toQueryString(aggregateCondition)
    if (havingStr.nonEmpty) havingFields += havingStr
  }

  def addOrder(orderBy: OrderBy, useAliasName: Boolean): Unit = {
    val orderByField: String =
      if (useAliasName) {
        val aliasName = sqlParser.toAliasName(orderBy.function)
        if ((selectFields ++ aggregateFields).exists(_.contains(aliasName))) {
          aliasName
        } else sqlParser.toQueryString(orderBy.function)
      } else {
        sqlParser.toQueryString(orderBy.function)
      }

    val orderByStr = s"$orderByField ${orderBy.order.toString}"
    orderByFields += orderByStr

    if (orderBy.numElemsShown.isDefined) {
      setLimit(Some(Limit(0, orderBy.numElemsShown.get)))
    }
  }

  def setLimit(limit: Option[Limit]): Unit = {
    limit match {
      case Some(x) =>
        isLimit = true
        limitOffset = x.offset
        limitSize = x.size
      case None =>
    }
  }

  def addFrom(fromField: FromField): Unit = {
    fromFields += fromField
  }

  def addJoin(joinField: JoinField): Unit = {
    joinFields += joinField
  }

  def addCte(cteField: CteField): Unit = {
    cteFields += cteField
  }

  def build(): String = {
    val selectClause: String = selectFields.union(aggregateFields).mkString(", ")
    val fromClause: String = buildFromClause()
    val whereClause: String =
      if (whereFields.isEmpty) ""
      else whereFields.mkString("(", ") and (", ")")
    val groupByClause: String = groupByFields.mkString(", ")
    val havingClause: String =
      if (havingFields.isEmpty) ""
      else havingFields.mkString("(", ") and (", ")")
    val orderByClause: String = orderByFields.mkString(", ")
    val limitClause: String = s"$limitSize offset $limitOffset"
    val cteClause: String = cteFields.map(cte => s"(${cte.expression}) as ${cte.exprName}").mkString(",\n")

    s"""
       |${if (cteFields.nonEmpty) s"with $cteClause" else ""}
       |${if (isDistinct) s"select distinct $selectClause" else s"select $selectClause"}
       |${if (fromClause.nonEmpty) s"from $fromClause" else ""}
       |${if (whereClause.nonEmpty) s"where ($whereClause)" else ""}
       |${if (isGroupBy) s"group by $groupByClause" else ""}
       |${if (havingClause.nonEmpty) s"having $havingClause" else ""}
       |${if (orderByClause.nonEmpty) s"order by $orderByClause" else ""}
       |${if (isLimit) s"limit $limitClause" else ""}
       |""".stripMargin.replaceAll("""(?m)^\s*\r?\n""", "")
  }

  /** *
    * connect multiple tables using join clause, tables are joined using equal expressions
    * @return tblA join tblB on (tblA.id == tblB.some_id) join ...
    */
  private def buildFromClause(): String = {
    if (joinFields.nonEmpty) {
      var curView = getSqlView(joinFields(0).leftViewName) // init
      val knownViews = mutable.Set[String](joinFields(0).leftViewName)

      joinFields.foreach(join => {
        var notChanged = true

        if (!knownViews.contains(join.leftViewName)) {
          curView += s"\n  ${join.joinType.toString} join ${getSqlView(join.leftViewName)} on ${join.conditionStr}"
          knownViews += join.leftViewName
          notChanged = false
        } else if (!knownViews.contains(join.rightViewName)) {
          curView += s"\n  ${join.joinType.toString} join ${getSqlView(join.rightViewName)} on ${join.conditionStr}"
          knownViews += join.rightViewName
          notChanged = false
        }

        if (notChanged) throw BadRequestError("invalid join clause")
      })

      curView

    } else {
      if (fromFields.size > 1) {
        throw BadRequestError(s"not enough table relationship to link ${fromFields.map(_.sqlStr).mkString(", ")}")
      }
      fromFields.head.sqlStr
    }
  }

  private def getSqlView(viewName: String): String = {
    fromFields.find(from => from.viewName == viewName) match {
      case Some(from) => from.sqlStr
      case None       => throw BadRequestError(s"can not find view with name $viewName")
    }
  }

}
