package datainsider.data_cook.domain

import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import datainsider.data_cook.domain.EtlJobStatus.EtlJobStatus
import datainsider.data_cook.domain.Ids.{EtlJobId, JobHistoryId, OrganizationId, UserId}
import datainsider.data_cook.pipeline.operator.Operator
import datainsider.ingestion.domain.TableSchema

case class EtlJobHistory(
    organizationId: OrganizationId,
    id: JobHistoryId,
    etlJobId: EtlJobId,
    totalExecutionTime: Long,
    @JsonScalaEnumeration(classOf[EtlJobStatusRef]) status: EtlJobStatus,
    ownerId: UserId,
    createdTime: Long = System.currentTimeMillis(),
    updatedTime: Long = System.currentTimeMillis(),
    message: Option[String] = None,
    operatorError: Option[Operator] = None,
    tableSchemas: Option[Array[TableSchema]] = None
)

object EtlJobHistory {
  def create(
      organizationId: OrganizationId,
      etlJobId: EtlJobId,
      ownerId: UserId,
      status: EtlJobStatus
  ): EtlJobHistory = {
    EtlJobHistory(
      organizationId = organizationId,
      id = -1,
      etlJobId = etlJobId,
      totalExecutionTime = 0L,
      status = status,
      ownerId = ownerId
    )
  }
}

/**
  * track progress of on-going jobs
  * job worker will report JobProcess back to Scheduler on begin job
  */
case class EtlJobProgress(
    organizationId: OrganizationId,
    historyId: JobHistoryId,
    jobId: EtlJobId,
    startTime: Long,
    totalExecutionTime: Long,
    status: EtlJobStatus,
    message: Option[String],
    operatorError: Option[Operator],
    tableSchemas: Array[TableSchema] = Array.empty,
    config: Option[EtlConfig] = None
)
