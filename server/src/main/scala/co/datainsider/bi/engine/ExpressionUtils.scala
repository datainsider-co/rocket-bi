package co.datainsider.bi.engine

import com.twitter.inject.Logging

import scala.util.matching.Regex

object ExpressionUtils extends Logging {

  private def EXPR_REGEX(word: String) = raw"""\W($word)\W""".r

  /**
    * return list of fields that exists in sql
    * @param sql given sql
    * @param fields list of fields that is going to be checked
    * @return
    */
  def findExprFields(sql: String, fields: Set[String]): Set[String] = {
    val multiFieldStr = fields.mkString("|")
    val regex: Regex = EXPR_REGEX(multiFieldStr)
    regex.findAllMatchIn(sql).map(_.group(1)).toSet
  }

  /**
    * find from clause which select directly from a dbName.tblName table.
    * @param sql given query
    * @return list of db, tbl names in this sql
    */
  def findDbTblNames(sql: String): Seq[(String, String)] = {
    try {
      val regex = """(?i)\s+(from|join)\s+(`?\w+`?\.`?\w+`?)""".r
      val dbTblStrings: Seq[String] = regex.findAllMatchIn(sql).map(_.group(2)).toSeq

      dbTblStrings.map(dbTblStr => {
        val Array(dbName, tblName) = dbTblStr.split("\\.").map(_.replaceAll("`", ""))
        (dbName, tblName)
      })
    } catch {
      case e: Throwable =>
        logger.error(s"findDbTblNames in query ${sql} failed with exception: ${e.getMessage}", e)
        Seq.empty
    }
  }

  /**
    * expands all expressions to its values.
    * @param sql query
    * @param expressions expressions map
    * @return
    */
  def parseToFullExpr(sql: String, expressions: Map[String, String]): String = {
    var finalSql: String = sql
    var expressionTerms: Seq[String] = expressions.keys.filter(exprTerm => finalSql.contains(exprTerm)).toSeq
    var loopCount = 0

    while (expressionTerms.nonEmpty && loopCount < 5) {
      expressionTerms.foreach(exprTerm => {
        finalSql = EXPR_REGEX(exprTerm).replaceAllIn(finalSql, m => m.group(0).replace(exprTerm, expressions(exprTerm)))
      })

      expressionTerms = expressions.keys.filter(term => finalSql.contains(term)).toSeq
      loopCount += 1
    }

    finalSql
  }

  private val APPLY_ALL_EXPR_REGEX = raw"""(?i)^ *# *\((.+)\)""".r

  def isApplyAllExpr(expr: String): Boolean = {
    APPLY_ALL_EXPR_REGEX.findFirstMatchIn(expr).map(_.group(1)).isDefined
  }

  def getMainExpression(expr: String): String = {
    require(isApplyAllExpr(expr), s"Expression $expr is not an apply all expression.")
    APPLY_ALL_EXPR_REGEX.findFirstMatchIn(expr).map(_.group(1)).get
  }

}
