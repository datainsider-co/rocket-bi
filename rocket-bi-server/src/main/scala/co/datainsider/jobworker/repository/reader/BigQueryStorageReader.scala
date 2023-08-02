package co.datainsider.jobworker.repository.reader

import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.jobworker.domain.job.BigQueryStorageJob
import co.datainsider.jobworker.domain.source.GoogleServiceAccountSource
import co.datainsider.jobworker.util.JsonUtils
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column._
import com.fasterxml.jackson.databind.JsonNode
import com.google.api.client.util.Preconditions
import com.google.api.gax.core.FixedCredentialsProvider
import com.google.auth.oauth2.ServiceAccountCredentials
import com.google.cloud.bigquery.storage.v1.ReadSession.TableReadOptions
import com.google.cloud.bigquery.storage.v1._
import com.twitter.inject.Logging
import org.apache.avro.Schema
import org.apache.avro.generic.{GenericDatumReader, GenericRecord}
import org.apache.avro.io.{BinaryDecoder, DecoderFactory}

import java.io.{ByteArrayInputStream, IOException, InputStream}
import java.sql.{Date, Timestamp}
import java.text.SimpleDateFormat
import java.util
import java.util.concurrent.TimeUnit
import scala.collection.mutable.ArrayBuffer
import scala.concurrent.duration.MILLISECONDS
import scala.jdk.CollectionConverters.asJavaIterableConverter

trait BigQueryStorageReader {

  def getTableSchema: TableSchema

  def next: Seq[Record]

  def hasNext: Boolean

  def getLastSyncedValue: String

  def closeConnection(): Unit

}

object BigQueryStorageReader {
  def apply(
      source: GoogleServiceAccountSource,
      job: BigQueryStorageJob,
      destTableSchema: Option[TableSchema] = None
  ): BigQueryStorageReaderImpl = {
    new BigQueryStorageReaderImpl(source, job, destTableSchema)
  }
}

class BigQueryStorageReaderImpl(
    source: GoogleServiceAccountSource,
    job: BigQueryStorageJob,
    destTableSchema: Option[TableSchema]
) extends BigQueryStorageReader
    with Logging {

  val serviceAccountJson: JsonNode = JsonUtils.fromJson[JsonNode](source.credential)
  val projectId: String = serviceAccountJson.get("project_id").asText()

  private class SimpleAvroReader(val schema: Schema) {
    Preconditions.checkNotNull(schema)
    val datumReader = new GenericDatumReader[GenericRecord](schema)

    private var decoder: BinaryDecoder = null
    private var row: GenericRecord = null

    @throws[IOException]
    def processRows(avroRows: AvroRows, schema: TableSchema): Seq[Record] =
      Profiler(s"[DataReader] ${this.getClass.getSimpleName}::processRows") {
        decoder = DecoderFactory.get.binaryDecoder(avroRows.getSerializedBinaryRows.toByteArray, decoder)

        val records = ArrayBuffer.empty[Record]
        while ({
          !decoder.isEnd
        }) { // Reusing object row
          row = datumReader.read(row, decoder)
          val record = ArrayBuffer.empty[Any]
          schema.columns.foreach(column => {
            val data: Any = try {
              val value: AnyRef = row.get(column.name)
              column match {
                case _: StringColumn => value.toString
                case _: UInt64Column => BigInt(value.asInstanceOf[java.nio.ByteBuffer].array()) / 1000000000
                case _: Int64Column  => value.toString.toLong
                case _: DoubleColumn => value.toString.toDouble
                case _: BoolColumn => value.toString.toBoolean
                case _: DateColumn => toDate(value.toString).orNull
                case _: DateTimeColumn => toDatetime(value.toString).orNull
                case _ => value.toString
              }
            } catch {
              case _: Throwable => null
            }
            record += data
          })
          records += record.toArray
        }
        records
      }
  }

  private val bqTableUrl = s"projects/${job.projectName}/datasets/${job.datasetName}/tables/${job.tableName}"

  private val bqTableOption: TableReadOptions = {
    val builder = TableReadOptions.newBuilder()
    builder.addAllSelectedFields(job.selectedColumns.asJava)
    builder.setRowRestriction(job.rowRestrictions)
    builder.build()
  }

  private val sessionBuilder =
    ReadSession
      .newBuilder()
      .setTable(bqTableUrl)
      .setDataFormat(DataFormat.AVRO)
      .setReadOptions(bqTableOption)

  private val builder =
    CreateReadSessionRequest
      .newBuilder()
      .setParent(s"projects/${projectId}")
      .setReadSession(sessionBuilder)
      .setMaxStreamCount(1)

  var credentials: ServiceAccountCredentials = null
  try {
    val serviceAccountStream: InputStream = new ByteArrayInputStream(source.credential.getBytes())
    try credentials = ServiceAccountCredentials.fromStream(serviceAccountStream)
    finally if (serviceAccountStream != null) serviceAccountStream.close()
  }

  private val baseBigQueryReadSettings =
    BaseBigQueryReadSettings
      .newBuilder()
      .setCredentialsProvider(FixedCredentialsProvider.create(credentials))
      .build()

  private val client: BaseBigQueryReadClient = BaseBigQueryReadClient.create(baseBigQueryReadSettings)
  private val session: ReadSession = client.createReadSession(builder.build())

  Preconditions.checkState(session.getStreamsCount > 0)

  private val streamName: String = session.getStreams(0).getName
  private val readRowsRequest: ReadRowsRequest = ReadRowsRequest.newBuilder().setReadStream(streamName).build()
  private var streamIterator: util.Iterator[ReadRowsResponse] =
    client.readRowsCallable().call(readRowsRequest).iterator()

  private val reader: SimpleAvroReader = new SimpleAvroReader(
    new Schema.Parser().parse(session.getAvroSchema.getSchema)
  )

  override lazy val getTableSchema: TableSchema =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::getTableSchema") {
      TableSchema(
        name = job.destTableName,
        dbName = job.destDatabaseName,
        organizationId = job.orgId,
        displayName = job.tableName,
        columns = toColumns(reader.schema)
      )
    }

  private def toColumns(schema: Schema): Seq[Column] =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::toColumns") {
      val columns = ArrayBuffer.empty[Column]
      schema.getFields.forEach(field => {
        val jsonAvroSchema = JsonUtils.fromJson[JsonNode](field.schema().toString())
        val jsonAvroType: JsonNode =
          if (jsonAvroSchema.isArray) {
            jsonAvroSchema.get(1)
          } else {
            jsonAvroSchema
          }
        val column: Column = jsonAvroType match {
          case t if isDate(t)      => DateColumn(field.name(), field.name(), isNullable = true)
          case t if isTimeStamp(t) => DateTimeColumn(field.name(), field.name(), isNullable = true)
          case t if isDateTime(t)  => DateTimeColumn(field.name(), field.name(), isNullable = true)
          case t if isLong(t)      => Int64Column(field.name(), field.name(), isNullable = true)
          case t if isDouble(t)    => DoubleColumn(field.name(), field.name(), isNullable = true)
          case t if isDecimal(t)   => UInt64Column(field.name(), field.name(), isNullable = true)
          case t if isString(t)    => StringColumn(field.name(), field.name(), isNullable = true)
          case t if isBoolean(t)   => BoolColumn(field.name(), field.name(), isNullable = true)
          case _                   => StringColumn(field.name(), field.name(), isNullable = true)
        }
        columns += column
      })
      columns
    }

  private def isLong(jsonAvroType: JsonNode): Boolean = {
    jsonAvroType.asText().equals("long")
  }
  private def isDouble(jsonAvroType: JsonNode): Boolean = {
    jsonAvroType.asText().equals("double")
  }
  private def isString(jsonAvroType: JsonNode): Boolean = {
    jsonAvroType.asText().equals("string")
  }
  private def isBoolean(jsonAvroType: JsonNode): Boolean = {
    jsonAvroType.asText().equals("boolean")
  }
  private def isDate(jsonAvroType: JsonNode): Boolean = {
    if (jsonAvroType.has("logicalType")) {
      jsonAvroType.get("logicalType").asText().equals("date")
    } else {
      false
    }
  }
  private def isDateTime(jsonAvroType: JsonNode): Boolean = {
    if (jsonAvroType.has("logicalType")) {
      jsonAvroType.get("logicalType").asText().equals("datetime")
    } else {
      false
    }
  }
  private def isTimeStamp(jsonAvroType: JsonNode): Boolean = {
    if (jsonAvroType.has("logicalType")) {
      jsonAvroType.get("logicalType").asText().equals("timestamp-micros")
    } else {
      false
    }
  }

  private def isDecimal(jsonAvroType: JsonNode): Boolean = {
    if (jsonAvroType.has("logicalType")) {
      jsonAvroType.get("logicalType").asText().equals("decimal")
    } else {
      false
    }
  }

  private var totalRows = 0L

  override def next: Seq[Record] =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::next") {
      val readResp: ReadRowsResponse = readNext(streamIterator)
      totalRows += readResp.getRowCount

      val serializedRecords: AvroRows = readResp.getAvroRows
      reader.processRows(serializedRecords, destTableSchema.getOrElse(getTableSchema))
    }

  private def recreateReadStream(): Unit =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::recreateReadStream") {
      info(s"job ${job.jobId} - recreate read stream request to stream $streamName at offset $totalRows")
      val readRowsRequest: ReadRowsRequest =
        ReadRowsRequest.newBuilder().setReadStream(streamName).setOffset(totalRows).build()
      streamIterator = client.readRowsCallable().call(readRowsRequest).iterator()
    }

  private def readNext(streamIterator: util.Iterator[ReadRowsResponse]): ReadRowsResponse =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::readNext") {
      try {
        streamIterator.next()
      } catch {
        case e: Throwable =>
          recreateReadStream()
          streamIterator.next()
      }
    }

  private def toRecords(schema: TableSchema, records: Seq[JsonNode]): Seq[Record] =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::toRecords") {
      records.map(record => {
        val row = ArrayBuffer.empty[Any]
        schema.columns.foreach(column => {
          if (record.hasNonNull(column.name)) {
            val value: String = record.get(column.name).asText()
            val data = column match {
              case _: StringColumn   => value
              case _: Int64Column    => value.toLong
              case _: DoubleColumn   => value.toDouble
              case _: BoolColumn     => value.toBoolean
              case _: DateColumn     => toDate(value).orNull
              case _: DateTimeColumn => toDatetime(value).orNull
              case _                 => value
            }
            row += data
          } else {
            row += null
          }
        })
        row.toArray
      })
    }

  private def toDate(value: String): Option[Date] = {
    try {
      Some(new Date(MILLISECONDS.convert(value.toInt, TimeUnit.DAYS)))
    } catch {
      case _: Throwable => None
    }
  }

  private def toDatetime(value: String): Option[Timestamp] = {
    try {
      if (value.matches("""\d+""")) {
        // Microseconds to timestamp
        Some(new Timestamp(value.toLong / 1000))
      } else {
        // String to timestamp
        val formatter = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss")
        val datetime = formatter.parse(value)
        Some(new Timestamp(datetime.getTime))
      }
    } catch {
      case _: Throwable => None
    }
  }

  override def hasNext: Boolean =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::hasNext") {
      try {
        streamIterator.hasNext
      } catch {
        case e: Throwable =>
          recreateReadStream()
          streamIterator.hasNext
      }
    }

  override def getLastSyncedValue: String =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::getLastSyncedValue") {
      totalRows.toString
    }

  override def closeConnection(): Unit = {
    client.close()
  }
}
