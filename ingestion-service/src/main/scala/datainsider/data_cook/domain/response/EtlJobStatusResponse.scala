package datainsider.data_cook.domain.response

import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import datainsider.data_cook.domain.EtlJobStatus.EtlJobStatus
import datainsider.data_cook.domain.Ids.EtlJobId
import datainsider.data_cook.domain.operator.TransformOperator
import datainsider.data_cook.domain.{EtlJobStatus, EtlJobStatusRef}
import datainsider.data_cook.pipeline.operator._
import datainsider.ingestion.domain.TableSchema
import datainsider.ingestion.domain.Types.TblName

/**
 * Trả về trạng thái của job
 * Nếu status là synced thì sẽ trả về data
 * Nếu status là lỗi thì trả về error
 */
case class EtlJobStatusResponse(
                                 id: EtlJobId,
                                 @JsonScalaEnumeration(classOf[EtlJobStatusRef]) status: EtlJobStatus,
                                 data: Option[EtlJobData] = None,
                                 error: Option[EtlJobErrorResponse] = None
)

object EtlJobStatusResponse {
  def success(id: EtlJobId, tableSchemas: Array[TableSchema]): EtlJobStatusResponse = {
    EtlJobStatusResponse(id, EtlJobStatus.Done, Some(EtlJobData(allTableSchemas = tableSchemas)))
  }

  def failure(id: EtlJobId, tableSchemas: Array[TableSchema], ex: Throwable, operatorError: Option[Operator]): EtlJobStatusResponse = {
    if (operatorError.isDefined) {
      val tblNameError = operatorError.get match {
        case operator: GetOperator => operator.destTableConfiguration.tblName
        case operator: JoinOperator => operator.destTableConfiguration.tblName
        case operator: SQLOperator => operator.destTableConfiguration.tblName
        case operator: PivotOperator => operator.destTableConfiguration.tblName
        case operator: TransformOperator => operator.destTableConfiguration.tblName
        case operator: ManageFieldOperator => operator.destTableConfiguration.tblName
        case _ => ""
      }
      EtlJobStatusResponse(id, EtlJobStatus.Error, Some(EtlJobData(tableSchemas)), Some(EtlJobErrorResponse(ex.getMessage, tblNameError)))
    } else {
      EtlJobStatusResponse(id, EtlJobStatus.Error, Some(EtlJobData(tableSchemas)), Some(EtlJobErrorResponse(ex.getMessage, "")))
    }
  }
}

/**
  * Contains data of job
  */
case class EtlJobData(
    allTableSchemas: Array[TableSchema]
)

/**
  * Contains error of job, failure at table
  */
case class EtlJobErrorResponse(
    message: String,
    tableError: TblName
)
