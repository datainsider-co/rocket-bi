package co.datainsider.bi.engine

import scala.util.matching.Regex

object TableExpressionUtils {

  /**
    * find from clause of sql
    * @param sql given sql
    * @return list of db, tbl names in this sql
    */
  def findFromClause(sql: String): Seq[(String, String)] = {
    val regex = """(?i) (from|join) (\w+.\w+)""".r
    val dbTblStrings: Seq[String] = regex.findAllMatchIn(sql).map(_.group(2)).toSeq

    dbTblStrings.map(dbTblStr => {
      val Array(dbName, tblName) = dbTblStr.split("\\.")
      Tuple2(dbName, tblName)
    })
  }

  /**
    * parse expression to its un-nested form
    * @param sql given sql
    * @param expressions map of key-value of expressionName-expressionValue
    * @return
    */
  def parseToFullExpressions(sql: String, expressions: Map[String, String]): String = {
    var loopCount: Int = 0
    val maxApplyIteration: Int = 5
    var exprNames: Set[String] = findExprFields(sql, expressions.keys.toSet)
    var finalSql: String = sql

    while (loopCount < maxApplyIteration && exprNames.nonEmpty) {
      finalSql = exprNames.foldLeft(finalSql)((sql, name) => {
        val replacement: Option[String] = expressions.get(name)
        require(replacement.isDefined, s"can not find expression value for key: ${name}")

        sql.replace(name, replacement.get)
      })

      loopCount += 1
      exprNames = findExprFields(finalSql, expressions.keys.toSet)
    }

    finalSql
  }

  /**
    * return list of fields that exists in sql
    * @param sql given sql
    * @param fields list of fields that is going to be checked
    * @return
    */
  def findExprFields(sql: String, fields: Set[String]): Set[String] = {
    val variablesRegex = fields.mkString("|")
    val regex: Regex = raw"""\W($variablesRegex)\W""".r
    regex.findAllMatchIn(sql).map(_.group(1)).toSet
  }

}
