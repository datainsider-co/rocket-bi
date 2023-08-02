package co.datainsider.datacook.domain.response

import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import co.datainsider.datacook.domain.Ids.{EtlJobId, JobHistoryId, OrganizationId, UserId}
import co.datainsider.datacook.domain.ETLStatus.ETLStatus
import co.datainsider.datacook.domain.EtlJobStatusRef

/**
  * @author tvc12 - Thien Vi
  * @created 09/20/2021 - 4:07 PM
  */

/**
  * Full history of etl job
  * @param id id of history
  * @param etlJobId id of etl
  * @param totalExecutionTime total time of job in milliseconds
  * @param status current status of job
  * @param message message of job
  * @param etlInfo full info of etl
  */
case class EtlJobHistoryResponse(
                                  id: JobHistoryId,
                                  etlJobId: EtlJobId,
                                  totalExecutionTime: Long,
                                  @JsonScalaEnumeration(classOf[EtlJobStatusRef]) status: ETLStatus,
                                  message: String = "",
                                  etlInfo: Option[EtlJobResponse] = None,
                                  createdTime: Option[Long] = None,
                                  updatedTime: Option[Long] = None
)
