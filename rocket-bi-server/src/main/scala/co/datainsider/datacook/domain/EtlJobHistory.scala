package co.datainsider.datacook.domain

import co.datainsider.datacook.domain.ETLStatus.ETLStatus
import co.datainsider.datacook.domain.Ids.{EtlJobId, JobHistoryId, OrganizationId, UserId}
import co.datainsider.datacook.pipeline.operator.Operator
import co.datainsider.schema.domain.TableSchema
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration

case class EtlJobHistory(
    organizationId: OrganizationId,
    id: JobHistoryId,
    etlJobId: EtlJobId,
    totalExecutionTime: Long,
    @JsonScalaEnumeration(classOf[EtlJobStatusRef]) status: ETLStatus,
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
      status: ETLStatus
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
    status: ETLStatus,
    message: Option[String],
    operatorError: Option[Operator],
    tableSchemas: Array[TableSchema] = Array.empty,
    config: Option[EtlConfig] = None
)
