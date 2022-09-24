package datainsider.analytics.misc.report

import com.twitter.inject.Logging
import datainsider.analytics.domain.{AnalyticsConfig, JobInfo, UserActionMetricData, UserCollectionFields}
import datainsider.analytics.repository.ReportDataRepository
import datainsider.client.domain.org.Organization
import datainsider.client.util.JdbcClient

import java.sql.ResultSet
import scala.collection.mutable.ListBuffer
import scala.concurrent.duration.DurationInt

object UserCollectionReport {
  def collectUserResult(rs: ResultSet, fn: Seq[UserActionMetricData] => Int, batchSize: Int): Long = {
    var totalUserId = 0L
    val buffer = ListBuffer.empty[UserActionMetricData]
    while (rs.next()) {
      val userId = rs.getString(1)
      val count = rs.getLong(2)
      buffer.append(UserActionMetricData(userId, count))

      if (buffer.size >= batchSize) {
        totalUserId += fn(buffer)
        buffer.clear()
      }

    }

    if (buffer.nonEmpty) {
      totalUserId += fn(buffer)
      buffer.clear()
    }

    totalUserId
  }
}

case class A1UserCollectionReport(
    config: AnalyticsConfig,
    organization: Organization,
    client: JdbcClient,
    reportDataRepository: ReportDataRepository
) extends Report
    with Logging {

  override def run(jobInfo: JobInfo): Boolean = {
    val organizationId = organization.organizationId
    val reportTime = jobInfo.reportTime

    val writeFn = (userWithActionMetrics: Seq[UserActionMetricData]) => {
      reportDataRepository.writeUserCollection(
        organizationId,
        "active_users",
        userWithActionMetrics,
        reportTime
      )
    }
    val (fromTime, toTime) = getInputDataTimeRange(reportTime)
    reportDataRepository.clearUserCollection(organizationId, "active_users", reportTime)
    val count = client.executeQuery(buildDistinctUserWithActionCountQuery(), fromTime, toTime)(
      UserCollectionReport.collectUserResult(_, writeFn, 2000)
    )
    count > 0
  }

  private def getInputDataTimeRange(reportTime: Long): (Long, Long) = {
    (reportTime, reportTime + 1.days.toMillis - 1)
  }

  private def buildDistinctUserWithActionCountQuery(): String = {
    val analyticsDbName = config.getTrackingDbName(organization.organizationId)
    val eventTblName = config.trackingEventTbl
    s"""
       |SELECT
       |  $analyticsDbName.$eventTblName.di_user_id,
       |  count($analyticsDbName.$eventTblName.di_event_id)
       |FROM $analyticsDbName.$eventTblName
       |WHERE ($analyticsDbName.$eventTblName.di_time_ms >= ?) AND ($analyticsDbName.$eventTblName.di_time_ms <= ?)
       |GROUP BY $analyticsDbName.$eventTblName.di_user_id
       |""".stripMargin
  }
}

case class ANewUserCollectionReport(
    config: AnalyticsConfig,
    organization: Organization,
    client: JdbcClient,
    reportDataRepository: ReportDataRepository
) extends Report
    with Logging {

  override def run(jobInfo: JobInfo): Boolean = {
    val organizationId = organization.organizationId
    val writeFn = (users: Seq[UserActionMetricData]) => {
      reportDataRepository.writeUserCollection(
        organizationId,
        "new_active_users",
        users.map(_.copy(totalAction = 0L)),
        jobInfo.reportTime
      )
    }

    val (previousTime, reportTime) = (jobInfo.reportTime - 1.days.toMillis, jobInfo.reportTime)
    reportDataRepository.clearUserCollection(organizationId, "new_active_users", reportTime)
    client.executeQuery(buildNewUserQuery(), reportTime, "active_users", previousTime, "a0_active_users")(
      UserCollectionReport.collectUserResult(_, writeFn, 2000)
    )
    true
  }

  private def buildNewUserQuery(): String = {
    val analyticsDbName = config.getReportDbName(organization.organizationId)
    val userCollectionTblName = config.reportUserCollectionTbl

    val userIdField = s"$analyticsDbName.$userCollectionTblName.${UserCollectionFields.USER_ID}"
    val dateField = s"$analyticsDbName.$userCollectionTblName.${UserCollectionFields.TIME_MS}"
    val categoryField = s"$analyticsDbName.$userCollectionTblName.${UserCollectionFields.CATEGORY}"

    s"""
       |SELECT
       |    $userIdField,
       |    sum($analyticsDbName.$userCollectionTblName.${UserCollectionFields.TOTAL_ACTION}),
       |    retention($dateField = ? AND $categoryField = ?, $dateField = ? AND $categoryField = ? ) AS r
       |FROM $analyticsDbName.$userCollectionTblName
       |GROUP BY $userIdField
       |HAVING r[1] = 1 AND r[2] = 0
       |""".stripMargin

  }

}

case class A0UserCollectionReport(
    config: AnalyticsConfig,
    organization: Organization,
    client: JdbcClient,
    reportDataRepository: ReportDataRepository
) extends Report
    with Logging {

  override def run(jobInfo: JobInfo): Boolean = {
    val organizationId = organization.organizationId
    val reportTime = jobInfo.reportTime

    val writeFn = (userWithActionMetrics: Seq[UserActionMetricData]) => {
      reportDataRepository.writeUserCollection(
        organizationId,
        "a0_active_users",
        userWithActionMetrics,
        reportTime
      )
    }

    reportDataRepository.clearUserCollection(organizationId, "a0_active_users", reportTime)
    client.executeQuery(buildA0UserQuery(), reportTime, "active_users")(
      UserCollectionReport.collectUserResult(_, writeFn, 2000)
    )
    true
  }

  private def buildA0UserQuery(): String = {
    val analyticsDbName = config.getReportDbName(organization.organizationId)
    val userCollectionTblName = config.reportUserCollectionTbl
    s"""
       |SELECT
       |    $analyticsDbName.$userCollectionTblName.${UserCollectionFields.USER_ID},
       |    sum($analyticsDbName.$userCollectionTblName.${UserCollectionFields.TOTAL_ACTION})
       |FROM $analyticsDbName.$userCollectionTblName
       |WHERE ($analyticsDbName.$userCollectionTblName.${UserCollectionFields.TIME_MS} <= ?)
       |  AND ($analyticsDbName.$userCollectionTblName.${UserCollectionFields.CATEGORY} = ?)
       |GROUP BY $analyticsDbName.$userCollectionTblName.${UserCollectionFields.USER_ID}
       |""".stripMargin

  }
}
