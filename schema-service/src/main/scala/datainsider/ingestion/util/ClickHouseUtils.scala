package datainsider.ingestion.util

import datainsider.client.domain.Implicits.VALUE_NULL
import datainsider.client.util.ZConfig
import datainsider.ingestion.domain._
import datainsider.ingestion.misc.JdbcClient.Record
import datainsider.ingestion.util.SqlRegex.SqlRegex

import java.sql.{ResultSet, Timestamp}
import java.text.SimpleDateFormat
import java.util.{Date, TimeZone}
import scala.collection.mutable.ListBuffer
import scala.util.matching.Regex

object SqlRegex extends Enumeration {
  type SqlRegex = Regex
  val Select: SqlRegex = """select\s""".r
  val From: SqlRegex = """\sfrom\s""".r
  val Where: SqlRegex = """\swhere\s""".r
  val GroupBy: SqlRegex = """\sgroup by\s""".r
  val Having: SqlRegex = """\shaving\s""".r
  val OrderBy: SqlRegex = """\sorder by\s""".r
  val Limit: SqlRegex = """\slimit\s""".r
}

/** *
 */
object ClickHouseUtils {
  val SINGLE_TENANT_ID = 0L
  val sqlClauseRegexes: Array[SqlRegex] = Array(
    SqlRegex.Select,
    SqlRegex.From,
    SqlRegex.Where,
    SqlRegex.GroupBy,
    SqlRegex.Having,
    SqlRegex.OrderBy,
    SqlRegex.Limit
  )
  private val prefixDbName = ZConfig.getString("data_cook.prefix_db_name", "etl")
  private val previewPrefixDbName = ZConfig.getString("data_cook.preview_prefix_db_name", "preview_etl")

  /**
   * example: org1_preview_etl_1 | org1_etl_123 | etl_123
   */
  val ETL_DATABASE_PATTERN = s"^(?:org\\d+_)?(?:${prefixDbName}|${previewPrefixDbName})_\\d+$$"
  // pattern
  val PREVIEW_ETL_DATABASE_PATTERN = s"^(?:org(\\d+)_)?${previewPrefixDbName}_\\d+$$"

  /**
   * get org id from dbName, if not matching rule return SINGLE_TENANT_ID
   */
  def getPreviewEtlOrgId(dbName: String): Long = {
    val orgId: Option[Long] = PREVIEW_ETL_DATABASE_PATTERN.r.findFirstMatchIn(dbName) match {
      case Some(matcher) if (matcher.group(1) != null) => Some(matcher.group(1).toLong)
      case _                                           => None
    }
    orgId.getOrElse(SINGLE_TENANT_ID)
  }

  /**
   * for single tenant version (organizationId is always 0) do not add prefix: "org_"
   * @param organizationId organization id
   * @param name name of db
   */
  // TODO: If change format in here, check regex of ETL_DATABASE_PATTERN & PREVIEW_ETL_DATABASE_PATTERN
  def buildDatabaseName(organizationId: Long, name: String): String = {
    if (organizationId == SINGLE_TENANT_ID) {
      name
    } else {
      s"org${organizationId}_$name"
    }
  }

  def removeDatabasePrefix(organizationId: Long, dbName: String) = {
    dbName.replaceFirst(s"org${organizationId}_", "")
  }

  def validateIdentifier(name: String): Boolean = {
    if (name == null || name.trim.isEmpty)
      false
    else {
      name.trim.matches("\\w+")
    }
  }

  def collectResults[T](resultSet: ResultSet)(collector: ResultSet => T): Seq[T] = {
    val buffer = ListBuffer.empty[T]
    while (resultSet.next()) {
      val x = collector(resultSet)
      buffer.append(x)
    }
    buffer
  }

  def removeNullInArray(data: Any): Any = {
    data match {
      case v: Seq[_]      => v.filterNot(_ == null)
      case v: Array[_]    => v.filterNot(_ == null)
      case v: Iterable[_] => v.filterNot(_ == null)
      case v: Iterator[_] => v.filterNot(_ == null)
      case v              => v
    }
  }

  /**
   * Normalize and convert the given record to the corresponding data types using its schema
   * @param columns
   * @param record
   * @return
   */
  def normalizeToCorrespondingType(columns: Seq[Column], record: Record): Record = {
    def convertNestedValues(column: NestedColumn, values: Seq[Any]): Seq[Any] = {
      values
        .map(ClickHouseUtils.normalizeToCorrespondingType(_))
        .map(x => ClickHouseUtils.normalizeToCorrespondingType(Seq(x)))
    }
    columns.zip(record).flatMap {
      case (column: NestedColumn, values) => convertNestedValues(column, values.asInstanceOf[Seq[_]])
      case (_: ArrayColumn, value)        => Seq(ClickHouseUtils.normalizeToCorrespondingType(value))
      case (_: StringColumn, "")          => Seq("")
      // date, date time, int, uint, bool column value will convert to null, if value is empty
      case (_: Column, "")                      => Seq(null)
      case (_: Column, VALUE_NULL)              => Seq(null)
      case (c: DateTimeColumn, value: String)   => Seq(Timestamp.valueOf(value))
      case (c: DateTime64Column, value: String) => Seq(Timestamp.valueOf(value))
      // https://clickhouse.com/docs/en/sql-reference/data-types/datetime/
      case (c: DateTimeColumn, ts: Timestamp) =>
        val minTs = Timestamp.valueOf("1970-01-01 00:00:00")
        val maxTs = Timestamp.valueOf("2100-01-01 00:00:00")
        if (ts.compareTo(minTs) > 0 && ts.compareTo(maxTs) < 0) Seq(ts)
        else Seq(null)
      // https://clickhouse.com/docs/en/sql-reference/data-types/datetime64/
      case (c: DateTime64Column, ts: Timestamp) =>
        // some clickhouse version only support from 1925, not 1900 as what is written in clickhouse doc
        val minTs = Timestamp.valueOf("1925-01-01 00:00:00")
        val maxTs = Timestamp.valueOf("2200-01-01 00:00:00")
        if (ts.compareTo(minTs) > 0 && ts.compareTo(maxTs) < 0) Seq(ts)
        else Seq(null)

      case (_: Column, value) => Seq(value)
    }
  }

  def normalizeToCorrespondingType(data: Any): Any = {
    data match {
      //      case v: Seq[_]      => new ClickHouseArray(v.asJava.toArray)
      //      case v: Array[_]    => new ClickHouseArray(v.toSeq.asJava.toArray)
      //      case v: Iterable[_] => new ClickHouseArray(v.toSeq.asJava.toArray)
      //      case v: Iterator[_] => new ClickHouseArray(v.toSeq.asJava.toArray)
      case v: Boolean => if (v) 1 else 0
      case v          => v
    }
  }

  /**
   * return starting index of specific clause
   *
   * @param sql      sql to be adjust
   * @param sqlRegex : regex of search clause
   * @return Some(i) if exist else none (i: starting index of clause)
   */
  def findClause(sql: String, sqlRegex: Regex): Option[Int] = {
    sqlRegex.findFirstMatchIn(sql.toLowerCase()).map(_.start)
  }

  def applyLimit(sql: String, offset: Int, size: Int): String = {
    val newSql = findClause(sql, SqlRegex.Limit) match {
      case Some(_) => dropLimitClause(sql)
      case _       => sql
    }
    val pos = findAppropriatePos(newSql, SqlRegex.Limit)
    newSql.patch(pos, s" limit $offset, $size", 0)
  }

  def dropLimitClause(sql: String): String = {
    findClause(sql, SqlRegex.Limit) match {
      case Some(begin) =>
        val end = sql.length
        sql.replace(sql.substring(begin, end), "")
      case _ => sql
    }
  }

  /**
   * return position of clause or the next possible position of specific clause (if clause not exists)
   */
  def findAppropriatePos(sql: String, target: Regex): Int = {
    sqlClauseRegexes
      .slice(sqlClauseRegexes.indexOf(target), sqlClauseRegexes.length)
      .map(findClause(sql, _))
      .find(_.isDefined)
      .flatten match {
      case Some(i) => i
      case None    => sql.length
    }
  }

  implicit class ClickhouseDateTimeImplicits(time: Long) {

    val DEFAULT_DATE_FORMAT_UTC: SimpleDateFormat = {
      val sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS")
      sdf.setTimeZone(TimeZone.getTimeZone("UTC"))
      sdf
    }

    def toClickhouseDate(tzName: Option[String] = None): String = {
      val sdf = new SimpleDateFormat("yyyy-MM-dd")
      tzName match {
        case None    => sdf.setTimeZone(TimeZone.getTimeZone("UTC"))
        case Some(x) => sdf.setTimeZone(TimeZone.getTimeZone(x))
      }
      sdf.format(new Date(time))
    }

    def toClickhouseDateTime(tzName: Option[String] = None): String = {
      val sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss")
      tzName match {
        case None    => sdf.setTimeZone(TimeZone.getTimeZone("UTC"))
        case Some(x) => sdf.setTimeZone(TimeZone.getTimeZone(x))
      }
      sdf.format(new Date(time))
    }
  }

  implicit class EpochTimeLike(dateString: String) {

    def asMillis(tzName: Option[String] = None): Long = {
      val sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss")
      tzName match {
        case None    => sdf.setTimeZone(TimeZone.getTimeZone("UTC"))
        case Some(x) => sdf.setTimeZone(TimeZone.getTimeZone(x))
      }
      sdf.parse(dateString).getTime
    }

    def asMillisWithFormat(format: String, tzName: Option[String] = None): Long = {
      val sdf = new SimpleDateFormat(format)
      tzName match {
        case None    => sdf.setTimeZone(TimeZone.getTimeZone("UTC"))
        case Some(x) => sdf.setTimeZone(TimeZone.getTimeZone(x))
      }
      sdf.parse(dateString).getTime
    }

  }

  def normalizeString(str: String): String = {
    toUnsignVietNamese(str).trim.replaceAll("[^a-zA-Z0-9-]+", "_").replaceAll("_+", "_")
  }

  def toUnsignVietNamese(str: String): String = {
    val sourceString: String =
      "àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẤẦẨẪẬĂẮẰẲẴẶÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ"
    val finalString: String =
      "aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyydAAAAAAAAAAAAAAAAAEEEEEEEEEEEIIIIIOOOOOOOOOOOOOOOOOUUUUUUUUUUUYYYYYD"

    str.map(char => {
      if (sourceString.contains(char))
        finalString.charAt(sourceString.indexOf(char))
      else
        char
    })
  }
}
