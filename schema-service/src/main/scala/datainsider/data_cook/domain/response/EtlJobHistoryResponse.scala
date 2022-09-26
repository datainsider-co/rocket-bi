package datainsider.data_cook.domain.response

import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import datainsider.data_cook.domain.Ids.{EtlJobId, JobHistoryId, OrganizationId, UserId}
import datainsider.data_cook.domain.EtlJobStatus.EtlJobStatus
import datainsider.data_cook.domain.EtlJobStatusRef

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
                                  @JsonScalaEnumeration(classOf[EtlJobStatusRef]) status: EtlJobStatus,
                                  message: String = "",
                                  etlInfo: Option[EtlJobResponse] = None,
                                  createdTime: Option[Long] = None,
                                  updatedTime: Option[Long] = None
)
