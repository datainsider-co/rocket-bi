package datainsider.analytics.repository

import datainsider.analytics.domain.{JobInfo, JobStatus, ReportType}
import datainsider.client.domain.org.Organization
import datainsider.ingestion.util.TimeUtils

import java.util.{TimeZone, UUID}

trait JobFactory {
  def createActiveUserJobInfo(organization: Organization, reportTime: Long): JobInfo
}

case class JobFactoryImpl() extends JobFactory {

  def createActiveUserJobInfo(organization: Organization, reportTime: Long): JobInfo = {

    val reportTimeZone = organization.reportTimeZoneId.map(TimeZone.getTimeZone(_))

    val name = s"ActiveUser in ${TimeUtils
      .format(reportTime, "dd/MM/yyyy", reportTimeZone)} for ${organization.organizationId}:${organization.name}"
    val params = Map(
      "organization" -> organization,
      "report_time" -> reportTime,
      "created_time" -> System.currentTimeMillis()
    )
    JobInfo(
      UUID.randomUUID().toString,
      organization.organizationId,
      ReportType.ActiveUsers,
      name,
      None,
      reportTime,
      System.currentTimeMillis(),
      None,
      Some(0),
      Some(0),
      params,
      jobStatus = JobStatus.Idle
    )
  }
}
