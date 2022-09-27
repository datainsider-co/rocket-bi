package datainsider.schema.util

object TableExpressionUtils {

  def parseFullExpr(sql: String, existingExpressions: Map[String, String]): String = {
    var curSql: String = sql
    var foundKeys: Seq[String] = existingExpressions.keys.filter(k => curSql.contains(k)).toSeq
    var loopCount = 0

    while (foundKeys.nonEmpty && loopCount < 5) {
      foundKeys.foreach(k => {
        curSql = curSql.replace(k, existingExpressions(k))
      })

      foundKeys = existingExpressions.keys.filter(k => curSql.contains(k)).toSeq
      loopCount += 1
    }

    curSql
  }

  def findDbTblNames(sql: String): Seq[(String, String)] = {
    val regex = """(?i) (from|join) (\w+.\w+)""".r
    val dbTblStrings: Seq[String] = regex.findAllMatchIn(sql).map(_.group(2)).toSeq

    dbTblStrings.map(dbTblStr => {
      val Array(dbName, tblName) = dbTblStr.split("\\.")
      (dbName, tblName)
    })
  }
}
