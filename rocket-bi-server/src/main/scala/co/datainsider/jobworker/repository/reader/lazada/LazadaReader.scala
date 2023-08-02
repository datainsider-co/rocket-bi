package co.datainsider.jobworker.repository.reader.lazada

import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.jobworker.util.JsonUtils.ImplicitJsonNode
import com.fasterxml.jackson.databind.JsonNode
import com.twitter.util.logging.Logging
import co.datainsider.schema.domain.column._

import java.sql.Timestamp
import java.text.SimpleDateFormat
import java.util.Date
import scala.util.Try

/**
  * created 2023-04-12 5:59 PM
  *
  * @author tvc12 - Thien Vi
  */
object LazadaReader extends Logging {
  // Default formatter using ISO 8601 format. Date format like 2019-04-12T17:00:00+07:00
  lazy val DEFAULT_FORMATTER: SimpleDateFormat = {
    val format = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssXXX")
    format.setTimeZone(java.util.TimeZone.getTimeZone("UTC"))
    format
  }

  private val DATE_TIME_PATTERNS = Seq(
    "yyyy-MM-dd'T'HH:mm:ssXXX",
    "yyyy-MM-dd HH:mm:ss XXX",
    "yyyy-MM-dd HH:mm:ss"
  )

  def getLastIncrementalValue(
      records: Seq[Record],
      columns: Seq[Column],
      incrementalColumn: Option[String]
  ): Option[String] = {
    val incrementalColumnIndex: Int = columns.indexWhere(_.name == incrementalColumn.getOrElse(""))
    if (incrementalColumnIndex >= 0) {
      val value: Option[Any] = records.lastOption.flatMap(lastRecord => lastRecord.lift(incrementalColumnIndex))
      value.map(_.toString)
    } else {
      None
    }
  }

  /**
    * Parse records from json, each record is a list of value.
    * Each value is parsed from json with column type
    * column name is a path to get value from json. If path has dot, it will get value from nested json
    * example:
    * json: {"a": {"b": 1}}
    * column name: a.b
    * value: 1
    * ---
    * column name: a.c
    * value: null
    *
    * @param objectList list of json
    * @param columns    list of column
    * @return list of record
    */
  def parseRecords(objectList: Seq[JsonNode], columns: Seq[Column]): Seq[Record] = {
    val records: Seq[Record] = objectList.map(jsonNode => parseRecord(jsonNode, columns))
    records
  }

  def parseRecord(jsonNode: JsonNode, columns: Seq[Column]): Record = {
    columns.map(column => {
      // replace . to / to get value from json
      val jsonPath = String.valueOf(column.name).replaceAll("\\.", "/")
      val jsonAsNode: JsonNode = jsonNode.at(s"/${jsonPath}")
      if (jsonAsNode.isNullOrMissing) {
        null
      } else {
        val value: Any = Try(getValueWithColumnType(jsonAsNode, column)).getOrElse(null)
        value
      }
    }).toArray
  }

  private def getValueWithColumnType(jsonNode: JsonNode, column: Column): Any = {
    column match {
      case _: Int8Column     => jsonNode.asInt()
      case _: Int16Column    => jsonNode.asInt()
      case _: Int32Column    => jsonNode.asInt()
      case _: Int64Column    => jsonNode.asLong()
      case _: UInt8Column    => jsonNode.asInt()
      case _: UInt16Column   => jsonNode.asInt()
      case _: UInt32Column   => jsonNode.asInt()
      case _: UInt64Column   => jsonNode.asLong()
      case _: FloatColumn    => jsonNode.asDouble()
      case _: DoubleColumn   => jsonNode.asDouble()
      case _: DateColumn     => toDate(jsonNode)
      case _: DateTimeColumn => toDateTime(jsonNode)
      case _: StringColumn   => toString(jsonNode)
      case _: BoolColumn     => jsonNode.asBoolean()
      case _ =>
        logger.warn(s"Column ${column.name} type '${column.getClass.getSimpleName}' is not supported")
        null
    }
  }

  def toDateTime(element: JsonNode): Timestamp = {
    DATE_TIME_PATTERNS
      .map(getFormatter)
      .flatMap(formatter => Try(formatter.parse(element.asText())).toOption)
      .headOption
      .map(date => new Timestamp(date.getTime))
      .orNull
  }

  private def getFormatter(format: String): SimpleDateFormat = {
    val formatter = new SimpleDateFormat(format)
    formatter.setTimeZone(java.util.TimeZone.getTimeZone("UTC"))
    formatter
  }

  private def toDate(element: JsonNode): Date = DEFAULT_FORMATTER.parse(element.asText())

  private def toString(element: JsonNode): String = {
    if (element.isObject || element.isArray)
      element.toString
    else element.asText()
  }
}
