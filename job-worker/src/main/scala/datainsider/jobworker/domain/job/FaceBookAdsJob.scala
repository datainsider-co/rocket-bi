package datainsider.jobworker.domain.job

import com.fasterxml.jackson.core.`type`.TypeReference
import datainsider.client.domain.scheduler.Ids.SourceId
import datainsider.jobworker.domain.DataDestination.DataDestination
import datainsider.jobworker.domain.JobStatus.JobStatus
import datainsider.jobworker.domain.JobType.JobType
import datainsider.jobworker.domain.SyncMode.SyncMode
import datainsider.jobworker.domain.job.FacebookTableName.FacebookTableName
import datainsider.jobworker.domain.{Job, JobType, SyncMode}

/**
  * @param timeRange
  * @param datePreset this fields is ignored when timeRange is defined.
  * {today, yesterday, this_month, last_month, this_quarter, maximum, data_maximum, last_3d, last_7d, last_14d, last_28d, last_30d, last_90d, last_week_mon_sun, last_week_sun_sat, last_quarter, last_year, this_week_mon_today, this_week_sun_today, this_year}
  */
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
    timeRange: Option[FacebookAdsTimeRange] = None,
    datePreset: Option[String] = None
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
