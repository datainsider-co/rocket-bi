package co.datainsider.bi.engine.bigquery

import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.util.TimeUtils
import co.datainsider.common.client.util.JsonParser
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column._
import com.google.cloud.bigquery.Field.Mode
import com.google.cloud.bigquery._

import scala.collection.mutable.ArrayBuffer
import scala.jdk.CollectionConverters.{asScalaBufferConverter, seqAsJavaListConverter}
import scala.util.Try

object BigQueryUtils {
  private val DATE_PATTERN = "yyyy-MM-dd"
  private val DATE_TIME_PATTERN = "yyyy-MM-dd HH:mm:ss"

  def parseColumns(schema: Schema): Seq[Column] = {
    val columns = ArrayBuffer.empty[Column]

    schema.getFields.forEach(field => {
      val colName: String = field.getName
      val description: scala.Option[String] = scala.Option(field.getDescription)
      val isNullable: Boolean = field.getMode == Mode.NULLABLE

      val column: Column = field.getType match {
        case LegacySQLTypeName.BOOLEAN    => BoolColumn(colName, colName, description, isNullable = isNullable)
        case LegacySQLTypeName.INTEGER    => Int64Column(colName, colName, description, isNullable = isNullable)
        case LegacySQLTypeName.NUMERIC    => Int64Column(colName, colName, description, isNullable = isNullable)
        case LegacySQLTypeName.BIGNUMERIC => Int64Column(colName, colName, description, isNullable = isNullable)
        case LegacySQLTypeName.FLOAT      => DoubleColumn(colName, colName, description, isNullable = isNullable)
        case LegacySQLTypeName.STRING     => StringColumn(colName, colName, description, isNullable = isNullable)
        case LegacySQLTypeName.DATE       => DateColumn(colName, colName, description, isNullable = isNullable)
        case LegacySQLTypeName.DATETIME   => DateTimeColumn(colName, colName, description, isNullable = isNullable)
        case LegacySQLTypeName.TIMESTAMP  => DateTimeColumn(colName, colName, description, isNullable = isNullable)
        case _                            => StringColumn(colName, colName, description, isNullable = isNullable)
      }

      columns += column
    })

    columns
  }

  def toField(column: Column): Field = {
    val columnMode = if (column.isNullable) {
      Mode.NULLABLE
    } else {
      Mode.REQUIRED
    }
    val fieldType: LegacySQLTypeName = toLegacySQLTypeName(column)
    val nestedFields: Seq[Field] = column match {
      case column: NestedColumn => column.nestedColumns.map(column => toField(column))
      case _                    => Seq.empty
    }
    val description: String = column.description.orNull
    val builder = Field
      .newBuilder(column.name, fieldType, nestedFields: _*)
      .setDescription(description)
      .setMode(columnMode)
    builder.build()
  }

  private def toLegacySQLTypeName(column: Column): LegacySQLTypeName = {
    column match {
      case _: BoolColumn       => LegacySQLTypeName.BOOLEAN
      case _: Int8Column       => LegacySQLTypeName.INTEGER
      case _: Int16Column      => LegacySQLTypeName.INTEGER
      case _: Int32Column      => LegacySQLTypeName.INTEGER
      case _: Int64Column      => LegacySQLTypeName.NUMERIC
      case _: FloatColumn      => LegacySQLTypeName.FLOAT
      case _: DoubleColumn     => LegacySQLTypeName.FLOAT
      case _: StringColumn     => LegacySQLTypeName.STRING
      case _: DateTimeColumn   => LegacySQLTypeName.DATETIME
      case _: DateTime64Column => LegacySQLTypeName.DATETIME
      case _: DateColumn       => LegacySQLTypeName.DATE
      case _: UInt8Column      => LegacySQLTypeName.INTEGER
      case _: UInt16Column     => LegacySQLTypeName.INTEGER
      case _: UInt32Column     => LegacySQLTypeName.NUMERIC
      case _: UInt64Column     => LegacySQLTypeName.NUMERIC
      case _: ArrayColumn      => LegacySQLTypeName.STRING
      case _: NestedColumn     => LegacySQLTypeName.RECORD
      case _                   => LegacySQLTypeName.STRING
    }
  }

  def addColumns(schema: Schema, columns: Seq[Column]): Schema = {
    val oldFields: Seq[Field] = schema.getFields.asScala.toSeq
    val newFields: Seq[Field] = columns.map(column => {
      val field: Field = BigQueryUtils.toField(column)
      // force to nullable cause, only nullable field can be added
      field.toBuilder.setMode(Field.Mode.NULLABLE).build()
    })
    val newSchema: Schema = Schema.of((oldFields ++ newFields).asJava)
    newSchema
  }

  def toLines(records: Seq[Record], destSchema: TableSchema): Seq[String] = {
    records.map(record => {
      val recordAsMap: Map[String, Any] = destSchema.columns
        .zip(record)
        .map {
          case (col, null)                    => col.name -> null
          case (col: DateTimeColumn, value)   => col.name -> Try(toDateTime(value)).getOrElse(null)
          case (col: DateTime64Column, value) => col.name -> Try(toDateTime(value)).getOrElse(null)
          case (col: DateColumn, value)       => col.name -> Try(toDate(col, value)).getOrElse(null)
          case (col, value)                   => col.name -> value
        }
        .toMap
      JsonParser.toJson(recordAsMap, false)
    })
  }

  private def toDateTime(value: Any): String = {
    value match {
      case value: java.sql.Date      => TimeUtils.format(value.getTime, DATE_TIME_PATTERN)
      case value: java.sql.Timestamp => TimeUtils.format(value.getTime, DATE_TIME_PATTERN)
      case value: String             => value
      case value: Int                => TimeUtils.format(value, DATE_TIME_PATTERN)
      case value: Long               => TimeUtils.format(value, DATE_TIME_PATTERN)
      case _                         => null
    }
  }

  private def toDate(col: DateColumn, value: Any): String = {
    value match {
      case value: java.sql.Date      => TimeUtils.format(value.getTime, DATE_PATTERN)
      case value: java.sql.Timestamp => TimeUtils.format(value.getTime, DATE_PATTERN)
      case value: String             => value
      case value: Int                => TimeUtils.format(value, DATE_PATTERN)
      case value: Long               => TimeUtils.format(value, DATE_PATTERN)
      case _                         => null
    }
  }

}
