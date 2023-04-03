package datainsider.data_cook.domain.response

import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import datainsider.data_cook.domain.EtlJobStatus.EtlJobStatus
import datainsider.data_cook.domain.Ids.EtlJobId
import datainsider.data_cook.domain.{EtlJobStatus, EtlJobStatusRef}
import datainsider.ingestion.domain.TableSchema

/**
 * Trả về trạng thái của job
 * Nếu status là synced thì sẽ trả về data
 * Nếu status là lỗi thì trả về error
 */
case class PreviewETLResponse(
                               id: EtlJobId,
                               @JsonScalaEnumeration(classOf[EtlJobStatusRef]) status: EtlJobStatus,
                               data: Option[PreviewETLData] = None,
                               errors: Array[ErrorPreviewETLData] = Array.empty
                             )

object PreviewETLResponse {
  def success(id: EtlJobId, tableSchemas: Array[TableSchema]): PreviewETLResponse = {
    PreviewETLResponse(id, EtlJobStatus.Done, Some(PreviewETLData(tableSchemas)))
  }

  def failure(id: EtlJobId, tableSchemas: Array[TableSchema], errors: Array[ErrorPreviewETLData]): PreviewETLResponse = {
    PreviewETLResponse(id, EtlJobStatus.Error, Some(PreviewETLData(tableSchemas)), errors)
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
