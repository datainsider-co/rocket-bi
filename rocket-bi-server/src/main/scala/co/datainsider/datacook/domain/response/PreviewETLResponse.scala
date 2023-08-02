package co.datainsider.datacook.domain.response

import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import co.datainsider.datacook.domain.ETLStatus.ETLStatus
import co.datainsider.datacook.domain.Ids.EtlJobId
import co.datainsider.datacook.domain.{ETLStatus, EtlJobStatusRef}
import co.datainsider.schema.domain.TableSchema

/**
  * Trả về trạng thái của job
  * Nếu status là synced thì sẽ trả về data
  * Nếu status là lỗi thì trả về error
  */
case class PreviewETLResponse(
                               id: EtlJobId,
                               @JsonScalaEnumeration(classOf[EtlJobStatusRef]) status: ETLStatus,
                               data: Option[PreviewETLData] = None,
                               errors: Array[ErrorPreviewETLData] = Array.empty
)

object PreviewETLResponse {
  def success(id: EtlJobId, tableSchemas: Array[TableSchema]): PreviewETLResponse = {
    PreviewETLResponse(id, ETLStatus.Done, Some(PreviewETLData(tableSchemas)))
  }

  def failure(
      id: EtlJobId,
      tableSchemas: Array[TableSchema],
      errors: Array[ErrorPreviewETLData]
  ): PreviewETLResponse = {
    PreviewETLResponse(id, ETLStatus.Error, Some(PreviewETLData(tableSchemas)), errors)
  }
}

/**
  * Contains data of job
  */
case class PreviewETLData(
    allTableSchemas: Array[TableSchema]
)

/**
  * Contains error of job, failure at table
  */
case class ErrorPreviewETLData(
    message: String,
    errorTblName: String
)
