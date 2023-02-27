package datainsider.jobworker.repository.reader

import scala.util.matching.Regex

abstract class UpdateQueryUtils {
  def rebuildQueryStatement(queryStatement: String, offset: Int, limit: Int): String
  def rebuildGetTotalQuery(queryStatement: String): String
  def rebuildQueryByRange(
      queryStatement: String,
      lowerBound: String,
      upperBound: String,
      incrementalCol: String,
      limit: Int
  ): String
  def rebuildQueryByValue(
      queryStatement: String,
      currentValue: String,
      offset: Int,
      incrementalCol: String,
      limit: Int
  ): String
}

case class MySqlUpdateQueryUtils() extends UpdateQueryUtils {

  override def rebuildQueryStatement(queryStatement: String, offset: Int, limit: Int): String = {
    var query = queryStatement.replaceAll(";", "")
    query = removeStatement(queryStatement, "(?i)limit ".r)
    query + s" limit $limit offset $offset"
  }

  override def rebuildGetTotalQuery(queryStatement: String): String = {
    val pattern = new Regex("((as.*'.*'\\sfrom)|\\sfrom)\\s(.*(\\s+(?:where|group by)\\s+.*)?)")
    val matcher = pattern.findFirstIn(queryStatement)
    val indexToCut = queryStatement.indexOf(matcher.head)
    "select count(*) " + queryStatement.substring(indexToCut)
  }

  override def rebuildQueryByRange(
      queryStatement: String,
      lowerBound: String,
      upperBound: String,
      incrementalCol: String,
      limit: Int
  ): String = {
    var query = queryStatement.replaceAll(";", "")
    val condition = s" $incrementalCol > ${toValue(lowerBound)} && $incrementalCol <= ${toValue(upperBound)} "

    query = removeStatement(query, "(?i)limit ".r)
    query = removeStatement(query, "(?i)order by ".r)
    query = insertCondition(query, condition)
    query + s" order by $incrementalCol asc limit $limit"
  }

  override def rebuildQueryByValue(
      queryStatement: String,
      currentValue: String,
      offset: Int,
      incrementalCol: String,
      limit: Int
  ): String = {
    var query = queryStatement.replaceAll(";", "")
    val condition = s" $incrementalCol = ${toValue(currentValue)} "

    query = removeStatement(query, "(?i)limit ".r)
    query = insertCondition(query, condition)
    query + s" limit $limit offset $offset"
  }

  def removeStatement(query: String, pattern: Regex): String = {
    val matcher = pattern.findAllIn(query)
    if (matcher.nonEmpty) {
      val indexToCut = query.lastIndexOf(matcher.toList.last)
      if (query.substring(indexToCut).contains("'"))
        query
      else
        query.substring(0, indexToCut)
    } else
      query
  }

  def insertCondition(query: String, condition: String): String = {

    var indexToInsert = 0
    val wherePattern: Regex = "(?i)where ".r
    val whereMatcher = wherePattern.findFirstIn(query)
    if (whereMatcher.nonEmpty) {
      indexToInsert = query.indexOf(whereMatcher.head) + 5
      query.substring(0, indexToInsert) + condition + " and " + query.substring(indexToInsert)
    } else {
      val orderByPattern: Regex = "(?i)order by ".r
      val orderByMatcher = orderByPattern.findAllIn(query)
      val groupByPattern: Regex = "(?i)group by ".r
      val groupByMatcher = groupByPattern.findAllIn(query)
      if (orderByMatcher.nonEmpty)
        indexToInsert = query.lastIndexOf(orderByMatcher.toSeq.last)
      if (groupByMatcher.nonEmpty)
        indexToInsert = query.lastIndexOf(groupByMatcher.toSeq.last)
      if (indexToInsert.equals(0)) {
        query + " where" + condition
      } else {
        query.substring(0, indexToInsert) + " where " + condition + query.substring(indexToInsert)
      }
    }
  }
  def toValue(str: String): String = {
    val numberRegex = """^-?\d+(.?\d+(E\d+)?)?$"""
    if (numberRegex matches str) str
    else s"'$str'"
  }
}
