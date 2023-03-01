package datainsider.ingestion.domain

import com.google.inject.Inject
import com.twitter.finagle.http.Request
import datainsider.client.filter.LoggedInRequest
import datainsider.ingestion.misc.JdbcClient.Record
import education.x.commons.Serializer
import org.apache.commons.lang3.SerializationUtils

@SerialVersionUID(20210618L)
case class CsvUploadInfo(
    id: String,
    batchSize: Int,
    schema: TableSchema,
    csvSetting: CsvSetting,
    lastSuccessBatchNumber: Int,
    errorBatchNumbers: Seq[Int],
    isDone: Boolean
)

object CsvUploadInfo {
  implicit object CsvUploadInfoSerializer extends Serializer[CsvUploadInfo] {

    override def fromByte(bytes: Array[Byte]): CsvUploadInfo = {
      SerializationUtils.deserialize(bytes).asInstanceOf[CsvUploadInfo]
    }

    override def toByte(value: CsvUploadInfo): Array[Byte] = {
      SerializationUtils.serialize(value.asInstanceOf[Serializable])
    }
  }
}

case class CsvSchemaResponse(
    schema: TableSchema,
    csvSetting: CsvSetting,
    records: Seq[Record]
)

case class OldCsvUploadRequest(
    csvId: String,
    batchNumber: Int,
    data: String,
    isEnd: Boolean
)

case class OldCsvUploadResponse(
    csvId: String,
    succeed: Boolean,
    batchNumber: Int,
    rowInserted: Int,
    message: Option[String] = None
)

case class DetectCsvSchemaRequest(
    sample: String,
    schema: Option[TableSchema] = None,
    csvSetting: CsvSetting
)

case class OldCsvRegisterRequest(
    fileName: String,
    batchSize: Int,
    schema: TableSchema,
    csvSetting: CsvSetting,
    @Inject request: Request = null
) extends LoggedInRequest

case class CsvSetting(
    includeHeader: Boolean = false,
    delimiter: String = ",",
    addBatchInfo: Boolean = false
)

case class RegisterCsvSchemaRequest(
    schema: TableSchema,
    @Inject request: Request = null
) extends LoggedInRequest

case class IngestCsvRequest(
    dbName: String,
    tblName: String,
    csvSetting: CsvSetting,
    data: String,
    @Inject request: Request = null
) extends LoggedInRequest

case class IngestBatchRequest(
    dbName: String,
    tblName: String,
    records: Seq[Seq[Any]],
    @Inject request: Request = null
) extends LoggedInRequest

case class CsvUploadResponse(
    succeed: Boolean,
    rowInserted: Int,
    message: Option[String] = None
)
