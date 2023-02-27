package datainsider.jobworker.service.worker

import datainsider.client.domain.schema.TableSchema
import datainsider.client.domain.schema.column.Column
import datainsider.client.service.SchemaClientService
import datainsider.jobworker.client.JdbcClient.Record
import datainsider.jobworker.domain.DataDestination.DataDestination
import datainsider.jobworker.domain.{DataDestination, JdbcSource}
import datainsider.jobworker.repository.writer.DataWriter
import datainsider.jobworker.util.Implicits.FutureEnhance
import datainsider.jobworker.util.JsonUtils

import java.lang.System

/**
  * Created by phg on 4/21/21.
 **/


trait DepotAssistant {
  /**
   * Support depot data to destination
   */
  def put(records: Seq[Record]): Unit
}

/**
 * @deprecated using MultiDepotAssistant instead of SingleDepotAssistant
 * @param source connection information of data source
 * @param schemaService schema service
 * @param tableSchema schema of table to be written to
 */
case class SingleDepotAssistant(source: JdbcSource, schemaService: SchemaClientService, tableSchema: TableSchema) extends DepotAssistant {

  initSchema(tableSchema)
  // TODO: temporary use only clickhouse, supply correct writers
  private val _writer: DataWriter = DataWriter(DataDestination.Clickhouse)

  def put(records: Seq[Record]): Unit = {
    _writer.write(records, tableSchema)
  }

  def writer: DataWriter = _writer

  private def initSchema(schema: TableSchema): Unit = {
    if (null != schemaService) {
      schemaService.ensureDatabaseCreated(schema.organizationId, schema.dbName, None).sync()
      schemaService.createOrMergeTableSchema(schema).sync()
    }
  }
}

case class MultiDepotAssistant(schemaService: SchemaClientService, destinations: Seq[DataDestination], tableSchema: TableSchema) extends DepotAssistant with AutoCloseable{
  private lazy val writers: Seq[DataWriter] = destinations.map(destination => DataWriter(destination))
  init()


  def put(records: Seq[Record]): Unit = {
    writers.foreach(_.write(records, tableSchema))
  }



  private def init(): Unit = {
    destinations.foreach {
      case DataDestination.Clickhouse => schemaService.createOrMergeTableSchema(tableSchema).sync()
      case DataDestination.Hadoop =>
    }
  }

  override def close(): Unit = {
    writers.foreach(_.finishing())
  }
}


object DepotAssistant {

  case class ColumnBuilder(name: String) {
    private var _dataType: String = "string"

    private var _displayName: String = name

    def setDataType(dt: String): ColumnBuilder = {
      _dataType = dt
      this
    }

    def UInt64: ColumnBuilder = setDataType(DataType.UInt64)

    def Int: ColumnBuilder = setDataType(DataType.Int)

    def Long: ColumnBuilder = setDataType(DataType.Long)

    def Double: ColumnBuilder = setDataType(DataType.Double)

    def Boolean: ColumnBuilder = setDataType(DataType.Boolean)

    def String: ColumnBuilder = setDataType(DataType.String)

    def Array: ColumnBuilder = setDataType(DataType.Array)

    def setDisplayName(dn: String): ColumnBuilder = {
      _displayName = dn
      this
    }

    def build(): Column = {
      JsonUtils.fromJson[Column](s"""{
           |   "class_name": "${_dataType}",
           |   "name": "${name}",
           |   "display_name": "${_displayName}"
           |}
        """.stripMargin)
    }
  }
  //name = "float"
  //name = "double"
  //name = "string"
  //name = "date"
  //name = "datetime"
  //name = "datetime64"
  //name = "array"
  //name = "nested"
  object DataType {
    val Boolean = "bool"
    val Int8 = "int8"
    val Int16 = "int16"
    val Int32 = "int32"
    val Int64 = "int64"
    val UInt8 = "uint8"
    val UInt16 = "uint16"
    val UInt32 = "uint32"
    val UInt64 = "uint64"
    val Float32 = "float"
    val Float64 = "double"
    val String = "string"
    val Date = "date"
    val DateTime = "datetime"
    val DateTime64 = "datetime64"
    val Array = "array"
    val Nested = "nested"
    val Map: String = Nested
    val Int: String = Int32
    val Long: String = Int64
    val Float: String = Float32
    val Double: String = Float64
  }
}
