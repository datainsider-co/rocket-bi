package co.datainsider.jobworker.repository.reader.tiktok

import com.fasterxml.jackson.databind.JsonNode
import com.twitter.util.logging.Logging
import co.datainsider.schema.domain.column._

import java.sql.Timestamp
import java.text.SimpleDateFormat
import java.util.Date

class TikTokRecordParser extends Logging {
  val formatter = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss")

  private def getDataAsDateTime(element: JsonNode): Timestamp = {
    val dataTimeAsMillis = formatter.parse(element.asText()).getTime
    new Timestamp(dataTimeAsMillis)
  }

  private def getDataAsDate(element: JsonNode): Date = formatter.parse(element.asText())

  private def getDataAsString(element: JsonNode): String = {
    if (element.isObject || element.isArray)
      element.toString
    else element.asText()
  }

  def parse(column: Column, element: JsonNode): Any = {
    if (!element.isNull) {
      column match {
        case _: Int8Column     => element.asInt()
        case _: Int16Column    => element.asInt()
        case _: Int32Column    => element.asInt()
        case _: Int64Column    => element.asLong()
        case _: UInt8Column    => element.asInt()
        case _: UInt16Column   => element.asInt()
        case _: UInt32Column   => element.asInt()
        case _: UInt64Column   => element.asLong()
        case _: FloatColumn    => element.asDouble()
        case _: DoubleColumn   => element.asDouble()
        case _: DateColumn     => getDataAsDate(element)
        case _: DateTimeColumn => getDataAsDateTime(element)
        case _: StringColumn   => getDataAsString(element)
        case _: BoolColumn     => element.asBoolean()
        case _ =>
          logger.warn(s"TikTokAds Reader::parse:: Column type '${column.getClass.getSimpleName}' is not supported,(${column.name})")
          null
      }
    } else null
  }


}
