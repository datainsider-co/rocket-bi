package co.datainsider.schema.service

import co.datainsider.bi.client.JdbcClient.Record
import com.fasterxml.jackson.annotation.JsonSubTypes.Type
import com.fasterxml.jackson.annotation.{JsonSubTypes, JsonTypeInfo}
import co.datainsider.common.client.exception.BadRequestError

import java.text.SimpleDateFormat
import java.util.Date

@JsonTypeInfo(
  use = JsonTypeInfo.Id.NAME,
  include = JsonTypeInfo.As.PROPERTY,
  property = "class_name"
)
@JsonSubTypes(
  Array(
    new Type(value = classOf[GenIntColumn], name = "gen_int_column"),
    new Type(value = classOf[GenLongColumn], name = "gen_long_column"),
    new Type(value = classOf[GenDoubleColumn], name = "gen_double_column"),
    new Type(value = classOf[GenStringColumn], name = "gen_string_column"),
    new Type(value = classOf[GenDateColumn], name = "gen_date_column"),
    new Type(value = classOf[GenDateTimeColumn], name = "gen_date_time_column")
  )
)
abstract class GeneratedColumn {
  val colName: String
}

case class GenIntColumn(colName: String, min: Int, max: Int) extends GeneratedColumn

case class GenLongColumn(colName: String, min: Long, max: Long) extends GeneratedColumn

case class GenDoubleColumn(colName: String, min: Double, max: Double) extends GeneratedColumn

case class GenStringColumn(colName: String, values: Array[String]) extends GeneratedColumn

case class GenDateColumn(colName: String, fromTimestamp: Long, toTimestamp: Long) extends GeneratedColumn

case class GenDateTimeColumn(colName: String, fromTimestamp: Long, toTimestamp: Long) extends GeneratedColumn

object FakeDataGenerator {
  def generate(size: Int, dataCols: Array[GeneratedColumn]): Seq[Record] = {
    Seq.fill(size) { generateRow(dataCols) }
  }

  private def generateRow(cols: Array[GeneratedColumn]): Record = {
    val r = scala.util.Random
    cols.map {
      case GenIntColumn(_, min, max) =>
        min + r.nextInt(max - min + 1)
      case GenLongColumn(_, min, max) =>
        min + ((max - min) * r.nextDouble()).toLong
      case GenDoubleColumn(_, min, max) =>
        min + ((max - min) * r.nextDouble())
      case GenStringColumn(_, values) =>
        val index = r.nextInt(values.length)
        values(index)
      case GenDateColumn(_, from, to) =>
        val timestamp = from + ((to - from) * r.nextDouble()).toLong
        val dateFormat = new SimpleDateFormat("yyyy-MM-dd")
        val date = new Date(timestamp)
        dateFormat.format(date)
      case GenDateTimeColumn(_, from, to) =>
        val timestamp = from + ((to - from) * r.nextDouble()).toLong
        val dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss")
        val date = new Date(timestamp)
        dateFormat.format(date)
      case x => throw BadRequestError(s"data generator for type $x is not supported")
    }
  }
}
