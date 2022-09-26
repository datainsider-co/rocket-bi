package datainsider.analytics.misc.report

import com.twitter.inject.Logging
import datainsider.analytics.domain._
import datainsider.analytics.repository.ReportDataRepository
import datainsider.client.domain.org.Organization
import datainsider.client.exception.DbExecuteError
import datainsider.client.util.{JdbcClient, JsonParser}

import java.sql.Timestamp
import scala.concurrent.duration.DurationInt

case class ActiveUserReport(
    config: AnalyticsConfig,
    organization: Organization,
    client: JdbcClient,
    reportDataRepository: ReportDataRepository
) extends Report
    with Logging {

  override def run(jobInfo: JobInfo): Boolean = {
    try {
      val result = runReport(jobInfo)
      val isSuccess = reportDataRepository.saveActiveUserResult(
        organization.organizationId,
        MetricCategory.ACTIVE_USER,
        result,
        jobInfo.reportTime
      )

      info(s"Saved: ${JsonParser.toJson(result)} with status $isSuccess timestamp = ${jobInfo.reportTime}")
      isSuccess
    } catch {
      case ex =>
        error("Run Report Failed", ex)
        false
    }
  }

  private def runReport(jobInfo: JobInfo): ActiveUserMetric = {
    val reportTime = jobInfo.reportTime

    exportA1UserCollection(jobInfo)
    exportNewUserCollection(jobInfo)
    exportA0UserCollection(jobInfo)

    val (a1, totalA1) =
      ClickHouseDAUReport(config, organization, client).calculate(reportTime)
    val (a7, totalA7) =
      ClickHouseWAUReport(config, organization, client).calculate(reportTime)
    val (a14, totalA14) =
      ClickHouse2WAUReport(config, organization, client).calculate(reportTime)
    val (a30, totalA30) =
      ClickHouseMAUReport(config, organization, client).calculate(reportTime)
    val (aNew, _) =
      ClickHouseNewUserReport(config, organization, client).calculate(reportTime)
    val (a0, _) =
      ClickHouseA0UserReport(config, organization, client).calculate(reportTime)

    ActiveUserMetric(
      a1 = a1,
      totalA1 = totalA1,
      a7 = a7,
      totalA7 = totalA7,
      a14 = a14,
      totalA14 = totalA14,
      a30 = a30,
      totalA30 = totalA30,
      an = aNew,
      a0 = a0
    )
  }

  private def exportA1UserCollection(jobInfo: JobInfo): Unit = {
    val isExported =
      A1UserCollectionReport(config, organization, client, reportDataRepository).run(jobInfo)
    if (!isExported) {
      throw DbExecuteError("Cant export A1 active user collection")
    }
  }

  private def exportA0UserCollection(jobInfo: JobInfo): Unit = {
    val isExported =
      A0UserCollectionReport(config, organization, client, reportDataRepository).run(jobInfo)
    if (!isExported) {
      throw DbExecuteError("Cant export A0 active user collection")
    }
  }

  private def exportNewUserCollection(jobInfo: JobInfo): Unit = {
    val isExported =
      ANewUserCollectionReport(config, organization, client, reportDataRepository).run(jobInfo)
    if (!isExported) {
      throw DbExecuteError("Cant export New active user collection")
    }
  }
}

/**
  * @author andy
  * @since 7/10/20
  */
trait UserReport {
  def calculate(reportTime: Long): (Long, Long)
}

abstract class BaseOrgUserReport extends UserReport {
  val config: AnalyticsConfig
  val organization: Organization
  val client: JdbcClient

  def getInputDataTimeRange(time: Long): (Long, Long)

  override def calculate(reportTime: Long): (Long, Long) = {
    val (fromTime, toTime) = getInputDataTimeRange(reportTime)
    client.executeQuery(buildActiveUserQuery(), fromTime, toTime, "active_users")(Report.collectActiveMetric)
  }

  protected def buildActiveUserQuery(): String = {
    val analyticsDbName = config.getReportDbName(organization.organizationId)
    val userCollectionTblName = config.reportUserCollectionTbl
    s"""
       |SELECT
       |    uniqExact($analyticsDbName.$userCollectionTblName.${UserCollectionFields.USER_ID}),
       |    sum($analyticsDbName.$userCollectionTblName.${UserCollectionFields.TOTAL_ACTION})
       |FROM $analyticsDbName.$userCollectionTblName
       |WHERE ($analyticsDbName.$userCollectionTblName.${UserCollectionFields.TIME_MS} >= ?)
       |  AND ($analyticsDbName.$userCollectionTblName.${UserCollectionFields.TIME_MS} <= ?)
       |  AND ($analyticsDbName.$userCollectionTblName.${UserCollectionFields.CATEGORY} = ?)
       |""".stripMargin
  }
}

/**
  * Daily active user report (A1)
  */
case class ClickHouseDAUReport(config: AnalyticsConfig, organization: Organization, client: JdbcClient)
    extends BaseOrgUserReport {

  override def getInputDataTimeRange(reportTime: Long): (Long, Long) = {
    (reportTime, reportTime)
  }
}

/**
  * Weekly active user report (A7)
  */
case class ClickHouseWAUReport(config: AnalyticsConfig, organization: Organization, client: JdbcClient)
    extends BaseOrgUserReport {
  override def getInputDataTimeRange(reportTime: Long): (Long, Long) = {
    (reportTime - 6.days.toMillis, reportTime)
  }
}

/**
  * 2 Week active user report (A14)
  */
case class ClickHouse2WAUReport(config: AnalyticsConfig, organization: Organization, client: JdbcClient)
    extends BaseOrgUserReport {

  override def getInputDataTimeRange(reportTime: Long): (Long, Long) = {
    (reportTime - 13.days.toMillis, reportTime)
  }
}

/**
  * Monthly active user report (A30)
  */
case class ClickHouseMAUReport(config: AnalyticsConfig, organization: Organization, client: JdbcClient)
    extends BaseOrgUserReport {

  override def getInputDataTimeRange(reportTime: Long): (Long, Long) = {
    (reportTime - 29.days.toMillis, reportTime)
  }
}

/**
  * New active user report (Anew)
  */
case class ClickHouseNewUserReport(config: AnalyticsConfig, organization: Organization, client: JdbcClient)
    extends BaseOrgUserReport {

  override def getInputDataTimeRange(reportTime: Long): (Long, Long) = {
    (reportTime, reportTime)
  }

  override def calculate(reportTime: Long): (Long, Long) = {
    val (fromTime, toTime) = getInputDataTimeRange(reportTime)
    client.executeQuery(buildActiveUserQuery(), fromTime, toTime, "new_active_users")(Report.collectActiveMetric)
  }
}

/**
  * Total active user report (A0)
  */
case class ClickHouseA0UserReport(
    config: AnalyticsConfig,
    organization: Organization,
    client: JdbcClient
) extends UserReport {

  override def calculate(reportTime: Long): (Long, Long) = {

    client.executeQuery(buildTotalUserQueryStr(), reportTime, "a0_active_users")(
      Report.collectActiveMetric
    )
  }

  private def buildTotalUserQueryStr(): String = {
    val analyticsDbName = config.getReportDbName(organization.organizationId)
    val userCollectionTblName = config.reportUserCollectionTbl
    s"""
       |SELECT
       |    uniqExact($analyticsDbName.$userCollectionTblName.${UserCollectionFields.USER_ID}),
       |    sum($analyticsDbName.$userCollectionTblName.${UserCollectionFields.TOTAL_ACTION})
       |FROM $analyticsDbName.$userCollectionTblName
       |WHERE ($analyticsDbName.$userCollectionTblName.${UserCollectionFields.TIME_MS} <= ?)
       |  AND ($analyticsDbName.$userCollectionTblName.${UserCollectionFields.CATEGORY} = ?)
       |""".stripMargin
  }
}

case class ClickHouseRegisteredUserReport(
    config: AnalyticsConfig,
    organization: Organization,
    client: JdbcClient
) extends UserReport {

  override def calculate(reportTime: Long): (Long, Long) = {
    client.executeQuery(buildTotalUserQueryStr(), new Timestamp(reportTime))(Report.collectActiveMetric)
  }

  private def buildTotalUserQueryStr(): String = {
    val analyticsDbName = config.getTrackingDbName(organization.organizationId)
    val eventTblName = config.trackingProfileTbl
    s"""
       |SELECT
       |    uniqExact($analyticsDbName.$eventTblName.user_id),
       |    count($analyticsDbName.$eventTblName.user_id)
       |FROM $analyticsDbName.$eventTblName
       |WHERE ($analyticsDbName.$eventTblName.created_time <= ?)
       |""".stripMargin
  }
}
