package datainsider.analytics.domain

import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import datainsider.analytics.domain.JobStatus.JobStatus
import datainsider.analytics.domain.ReportType.ReportType

case class JobInfo(
    jobId: String,
    organizationId: Long,
    @JsonScalaEnumeration(classOf[ReportTypeTypeRef])
    reportType: ReportType,
    name: String,
    description: Option[String],
    reportTime: Long,
    createdTime: Long,
    startedTime: Option[Long] = None,
    duration: Option[Int] = Some(0),
    runCount: Option[Int] = Some(0),
    params: Map[String, Any] = Map.empty[String, Any],
    @JsonScalaEnumeration(classOf[JobStatusTypeRef])
    jobStatus: JobStatus = JobStatus.Idle
)
