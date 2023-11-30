package co.datainsider.schema.misc

import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.util.ZConfig
import co.datainsider.schema.domain.column.{
  ArrayColumn,
  Column,
  DateTime64Column,
  DateTimeColumn,
  NestedColumn,
  StringColumn
}
import datainsider.client.domain.Implicits.VALUE_NULL

import java.sql.Timestamp
import java.text.SimpleDateFormat
import java.util.{Date, TimeZone}
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
  private def DB_PREFIX(orgId: Long) = s""

  private val PREFIX_DB_NAME = ZConfig.getString("data_cook.prefix_db_name", "etl")
  private val PREVIEW_PREFIX_DB_NAME = ZConfig.getString("data_cook.preview_prefix_db_name", "preview_etl")

  /**
    * example: org1_preview_etl_1 | org1_etl_123 | etl_123
    */
  val ETL_DATABASE_PATTERN = s"^(?:org\\d+_)?(?:${PREFIX_DB_NAME}|${PREVIEW_PREFIX_DB_NAME})_\\d+$$"
  // pattern
  val PREVIEW_ETL_DATABASE_PATTERN = s"^(?:org(\\d+)_)?${PREVIEW_PREFIX_DB_NAME}_\\d+$$"

  /**
    * for single tenant version (organizationId is always 0) do not add prefix: "org_"
    * @param orgId organization id
    * @param name name of db
    */
  def buildDatabaseName(orgId: Long, name: String): String = {
    if (orgId == SINGLE_TENANT_ID) {
      name
    } else {
      if (!name.startsWith(DB_PREFIX(orgId))) {
        DB_PREFIX(orgId) + name
      } else name
    }
  }

  def removeDatabasePrefix(orgId: Long, dbName: String): String = {
    dbName.replaceFirst(DB_PREFIX(orgId), "")
  }

  /**
    * get org id from dbName, if not matching rule return SINGLE_TENANT_ID
    */
  def reverseETLOrgId(dbName: String): Long = {
    val orgId: Option[Long] = PREVIEW_ETL_DATABASE_PATTERN.r.findFirstMatchIn(dbName) match {
      case Some(matcher) if (matcher.group(1) != null) => Some(matcher.group(1).toLong)
      case _                                           => None
    }
    orgId.getOrElse(SINGLE_TENANT_ID)
  }

  /**
    * Normalize and convert the given record to the corresponding data types using its schema
    *
    * @param columns
    * @param record
    * @return
    */
  def normalizeToCorrespondingType(columns: Seq[Column], record: Seq[Any]): Record = {
    def convertNestedValues(column: NestedColumn, values: Seq[Any]): Seq[Any] = {
      values
        .map(ClickHouseUtils.normalizeToCorrespondingType(_))
        .map(x => ClickHouseUtils.normalizeToCorrespondingType(Seq(x)))
    }

    columns
      .zip(record)
      .flatMap {
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
      .toArray
  }

  def normalizeToCorrespondingType(data: Any): Any = {
    import scala.jdk.CollectionConverters.seqAsJavaListConverter
    data match {
      //      case v: Seq[_]      => new ClickHouseArray(v.asJava.toArray)
      //      case v: Array[_]    => new ClickHouseArray(v.toSeq.asJava.toArray)
      //      case v: Iterable[_] => new ClickHouseArray(v.toSeq.asJava.toArray)
      //      case v: Iterator[_] => new ClickHouseArray(v.toSeq.asJava.toArray)
      case v: Boolean => if (v) 1 else 0
      case v          => v
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
    toUnsignVietNamese(str).trim.replaceAll("[^a-zA-Z0-9]+", "_").replaceAll("_+", "_")
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
