package co.datainsider.jobworker.domain.job

import com.fasterxml.jackson.core.`type`.TypeReference
import datainsider.client.domain.scheduler.Ids.SourceId
import co.datainsider.jobworker.domain.DataDestination.DataDestination
import co.datainsider.jobworker.domain.JobStatus.JobStatus
import co.datainsider.jobworker.domain.JobType.JobType
import co.datainsider.jobworker.domain.SyncMode.SyncMode
import FacebookTableName.FacebookTableName
import co.datainsider.jobworker.domain.{Job, JobType, SyncMode}

import java.text.SimpleDateFormat
import java.time.LocalDate
import java.util.Calendar
import scala.collection.mutable.ArrayBuffer

case class FacebookAdsJob(
    orgId: Long,
    jobId: Int,
    jobType: JobType = JobType.FacebookAds,
    syncMode: SyncMode = SyncMode.FullSync,
    sourceId: SourceId,
    lastSuccessfulSync: Long,
    syncIntervalInMn: Int,
    lastSyncStatus: JobStatus,
    currentSyncStatus: JobStatus,
    destDatabaseName: String,
    destTableName: String,
    destinations: Seq[DataDestination],
    tableName: FacebookTableName,
    accountId: String,
    datePreset: Option[String] = None,
    timeRange: Option[FacebookAdsTimeRange] = None,
    lastSyncedValue: String = ""
) extends Job {

  override def jobData: String = ""

  override def copyWith(
      orgId: SourceId,
      jobId: Int,
      jobType: JobType,
      syncMode: SyncMode,
      sourceId: SourceId,
      lastSuccessfulSync: SourceId,
      syncIntervalInMn: Int,
      lastSyncStatus: JobStatus,
      currentSyncStatus: JobStatus,
      jobData: String,
      destDatabaseName: String,
      destTableName: String,
      destinations: Seq[DataDestination]
  ): Job = {
    this.copy(
      orgId = orgId,
      jobId = jobId,
      jobType = jobType,
      syncMode = syncMode,
      sourceId = sourceId,
      lastSuccessfulSync = lastSuccessfulSync,
      syncIntervalInMn = syncIntervalInMn,
      lastSyncStatus = lastSyncStatus,
      currentSyncStatus = currentSyncStatus,
      destDatabaseName = destDatabaseName,
      destTableName = destTableName,
      destinations = destinations
    )
  }

}

object FacebookTableName extends Enumeration {
  type FacebookTableName = String
  val AdAccount: FacebookTableName = "AdAccount"
  val Campaign: FacebookTableName = "Campaign"
  val AdSet: FacebookTableName = "AdSet"
  val Ad: FacebookTableName = "Ad"
  val AdInsight: FacebookTableName = "AdInsight"
  val AdSetInsight: FacebookTableName = "AdSetInsight"
  val CampaignInsight: FacebookTableName = "CampaignInsight"
  val AccountInsight: FacebookTableName = "AccountInsight"
  val Activity: FacebookTableName = "Activity"
  val AdCreative: FacebookTableName = "AdCreative"
  val CustomConversions: FacebookTableName = "CustomConversions"
  val AdImage: FacebookTableName = "AdImage"
  val AdVideo: FacebookTableName = "AdVideo"
}
class FacebookTableNameRef extends TypeReference[FacebookTableName.type]

/**
  * @param since A date in the format of "YYYY-MM-DD", which means from the beginning midnight of that day.
  * @param until A date in the format of "YYYY-MM-DD", which means to the beginning midnight of the following day.
  */
case class FacebookAdsTimeRange(since: String, until: String)

object FacebookAdsTimeRange {

  def split(timeRange: FacebookAdsTimeRange, windowDays: Int): Seq[FacebookAdsTimeRange] = {
    var sinceDate = LocalDate.parse(timeRange.since)
    val untilDate = LocalDate.parse(timeRange.until)
    val timeRanges: ArrayBuffer[FacebookAdsTimeRange] = ArrayBuffer.empty[FacebookAdsTimeRange]
    while (!sinceDate.isAfter(untilDate)) {
      timeRanges.append(FacebookAdsTimeRange(sinceDate.toString, sinceDate.plusDays(windowDays - 1).toString))
      sinceDate = sinceDate.plusDays(windowDays)
    }
    timeRanges
  }
}

object FacebookDatePreset extends Enumeration {
  type FacebookDatePreset = String
  val Last3Days: FacebookDatePreset = "last_3d"
  val Last7Days: FacebookDatePreset = "last_7d"
  val Last14Days: FacebookDatePreset = "last_14d"
  val Last28Days: FacebookDatePreset = "last_28d"
  val Last30Days: FacebookDatePreset = "last_30d"
  val Last60Days: FacebookDatePreset = "last_60d"
  val Last90Days: FacebookDatePreset = "last_90d"
  val Yesterday: FacebookDatePreset = "yesterday"
  val Today: FacebookDatePreset = "today"

  private val format = new SimpleDateFormat("yyyy-MM-dd")
  def getLastDays(days: Int): String = {
    val calendar = Calendar.getInstance()
    calendar.add(Calendar.DATE, -days)
    format.format(calendar.getTime)
  }

  def getYesterday(): String = getLastDays(1)

  def getToday(): String = getLastDays(0)

  def toTimeRange(datePreset: FacebookDatePreset): FacebookAdsTimeRange = {
    datePreset match {
      case Last3Days  => FacebookAdsTimeRange(getLastDays(3), getToday())
      case Last7Days  => FacebookAdsTimeRange(getLastDays(7), getToday())
      case Last14Days => FacebookAdsTimeRange(getLastDays(14), getToday())
      case Last28Days => FacebookAdsTimeRange(getLastDays(28), getToday())
      case Last30Days => FacebookAdsTimeRange(getLastDays(30), getToday())
      case Last60Days => FacebookAdsTimeRange(getLastDays(60), getToday())
      case Last90Days => FacebookAdsTimeRange(getLastDays(90), getToday())
      case Yesterday  => FacebookAdsTimeRange(getYesterday(), getToday())
      case Today      => FacebookAdsTimeRange(getToday(), getToday())
      case _          => throw new UnsupportedOperationException(s"'${datePreset}' is not supported ")
    }
  }
}
