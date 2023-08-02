package co.datainsider.jobworker.domain.shopify

import com.fasterxml.jackson.databind.JsonNode
import com.twitter.util.logging.Logging
import co.datainsider.schema.domain.column._
import co.datainsider.jobworker.repository.reader.shopify.ShopifyReader.ImplicitJsonNode
import org.joda.time.format.{DateTimeFormatter, ISODateTimeFormat}
import org.joda.time.{DateTime, DateTimeZone}

import java.math
import java.sql.Timestamp

/**
  * Cho phep serialize data thanh data co the write xuong clickhouse
  */
case class ShopifyColumn(val column: Column, val path: String)

object ShopifyJsonParser extends Logging {
  private val formatter: DateTimeFormatter = ISODateTimeFormat.dateTimeParser.withOffsetParsed.withZoneUTC

  /**
    * parse data dua tren type of column, default return string of data.
    * return null if parse failure
    */
  def parse(shopifyColumn: ShopifyColumn, data: JsonNode): Any = {
    try {
      shopifyColumn.column match {
        case _: DateTimeColumn   => toDateTime(data, shopifyColumn.path)
        case _: DateTime64Column => toDateTime(data, shopifyColumn.path)
        case _: DateColumn       => toDateTime(data, shopifyColumn.path)
        case _: Int64Column      => toInt64(data, shopifyColumn.path)
        case _: DoubleColumn     => toDouble(data, shopifyColumn.path)
        case _: BoolColumn       => toBoolean(data, shopifyColumn.path)
        case _: StringColumn     => toString(data, shopifyColumn.path)
        case _ =>
          debug(s"failure detect column type of ${shopifyColumn}, use default")
          toString(data, shopifyColumn.path)
      }
    } catch {
      case ex: Throwable =>
        error(s"parse column ${shopifyColumn.column.getClass.getSimpleName} path ${shopifyColumn.path} error", ex)
        null
    }
  }

  private def toDateTime(data: JsonNode, path: String) = {
    val node: JsonNode = data.at(path)
    if (node.isNotExists()) {
      null
    } else {
      val dateTime: DateTime = DateTime.parse(node.asText(), formatter).toDateTime(DateTimeZone.UTC)
      new Timestamp(dateTime.getMillis)
    }
  }

  private def toInt64(data: JsonNode, path: String) = {
    val node: JsonNode = data.at(path)
    if (node.isNotExists()) {
      null
    } else {
      new math.BigDecimal(node.asText()).longValue()
    }
  }

  private def toDouble(data: JsonNode, path: String) = {
    val node: JsonNode = data.at(path)
    if (node.isNotExists()) {
      null
    } else {
      new math.BigDecimal(node.asText()).doubleValue()
    }
  }

  private def toString(data: JsonNode, path: String) = {
    val node: JsonNode = data.at(path)
    if (node.isNotExists()) {
      null
    } else if (node.isObject || node.isArray) {
      node.toString
    } else {
      node.asText()
    }
  }

  private def toBoolean(data: JsonNode, path: String) = {
    val node: JsonNode = data.at(path)
    if (node.isNotExists()) {
      null
    } else {
      node.asBoolean()
    }
  }

}
