package co.datainsider.jobworker.repository.reader.mixpanel

import co.datainsider.jobscheduler.util.JsonUtils.ImplicitJsonNode
import co.datainsider.schema.domain.column._
import co.datainsider.schema.misc.ColumnDetector
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.node.JsonNodeType

import java.sql.{Date, Timestamp}
import java.util
import java.util.Map
import scala.collection.mutable
import scala.collection.mutable.ArrayBuffer

object MixpanelUtil {

  /**
    * Merge columns from different groups. collect all columns and remove duplicate columns.
    */
  def mergeColumns(groupColumns: Seq[Seq[Column]]): Seq[Column] = {
    val mergedColumns = ArrayBuffer.empty[Column]
    val columnNames = mutable.Set.empty[String]
    groupColumns.foreach(columns => {
      columns.foreach(column => {
        if (!columnNames.contains(column.name)) {
          columnNames += column.name
          mergedColumns += column
        }
      })
    })
    mergedColumns
  }

  def detectColumns(json: JsonNode): Seq[Column] = {
    val columns = ArrayBuffer.empty[Column]
    val fields: util.Iterator[Map.Entry[String, JsonNode]] = json.fields()
    while (fields.hasNext) {
      val field: Map.Entry[String, JsonNode] = fields.next()
      val name: String = field.getKey
      val valueNode: JsonNode = field.getValue
      val column = MixpanelUtil.detectColumn(name, valueNode)
      if (column.isDefined) {
        columns += column.get
      }
    }
    columns
  }

  private def detectColumn(name: String, node: JsonNode): Option[Column] = {
    val column = node.getNodeType match {
      case JsonNodeType.NULL    => null
      case JsonNodeType.MISSING => null
      case JsonNodeType.BOOLEAN => BoolColumn(name = name, displayName = name)
      case JsonNodeType.NUMBER  => detectAppropriateNumberColumn(name, node)
      case JsonNodeType.ARRAY   => StringColumn(name = name, displayName = name)
      case JsonNodeType.OBJECT  => StringColumn(name = name, displayName = name)
      case JsonNodeType.POJO    => StringColumn(name = name, displayName = name)
      case JsonNodeType.BINARY  => Int8Column(name = name, displayName = name)
      case JsonNodeType.STRING  => ColumnDetector.detectAppropriateColumn(name, name, node.asText(), isNullable = true)
      case _                    => StringColumn(name = name, displayName = name)
    }

    Option(column)
  }

  private def detectAppropriateNumberColumn(name: String, node: JsonNode): Column = {
    if (node.isIntegralNumber || node.isInt || node.isLong || node.isBigInteger || node.isShort) {
      return Int64Column(name = name, displayName = name)
    } else {
      return DoubleColumn(name = name, displayName = name)
    }
  }

  /**
    * Parse value from json node.
    *
    * @param column column info for parsing
    * @param node json node in which value is stored
    * @return parsed value, null if parsing failed
    */
  def parseValue(column: Column, node: JsonNode): Any = {
    if (node.isNullOrMissing) {
      return null
    }

    try {
      column match {
        case _: StringColumn => parseToString(node)
        case _: Int8Column   => node.asInt()
        case _: Int16Column  => node.asInt()
        case _: Int32Column  => node.asInt()
        case _: Int64Column  => node.asLong()
        case _: UInt8Column  => node.asInt()
        case _: UInt16Column => node.asInt()
        case _: UInt32Column => node.asLong()
        case _: UInt64Column => node.asLong()
        case _: DoubleColumn => node.asDouble()
        case _: FloatColumn  => node.asDouble()
        case _: BoolColumn   => node.asBoolean()

        case _: DateColumn       => Date.valueOf(node.asText())
        case _: DateTimeColumn   => Timestamp.valueOf(node.asText())
        case _: DateTime64Column => Timestamp.valueOf(node.asText())

        case _ => parseToString(node)
      }
    } catch {
      case _: Throwable => null
    }
  }

  private def parseToString(node: JsonNode): Any = {
    node.getNodeType match {
      case JsonNodeType.NULL    => null
      case JsonNodeType.MISSING => null
      case JsonNodeType.STRING  => node.asText()
      case JsonNodeType.BOOLEAN => node.asText()
      case JsonNodeType.ARRAY   => node.toString
      case JsonNodeType.OBJECT  => node.toString
      case JsonNodeType.POJO    => node.toString
      case JsonNodeType.BINARY  => node.toString
      case _                    => node.toString
    }
  }
}
