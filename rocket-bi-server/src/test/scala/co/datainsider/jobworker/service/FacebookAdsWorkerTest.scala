package co.datainsider.jobworker.service

import co.datainsider.bi.util.ZConfig
import co.datainsider.jobworker.domain.job.{FacebookAdsJob, FacebookAdsTimeRange, FacebookTableName}
import co.datainsider.jobworker.domain.response.SyncInfo
import co.datainsider.jobworker.domain.source.FacebookAdsSource
import co.datainsider.jobworker.domain.{JobProgress, JobStatus}
import com.twitter.util.Future
import education.x.commons.{KVS, SsdbKVS}
import org.nutz.ssdb4j.spi.SSDB

import scala.concurrent.ExecutionContext.Implicits.global

class FacebookAdsWorkerTest extends AbstractWorkerTest {
  val workerFactory: RunnableJobFactory = injector.instance[RunnableJobFactory]
  val ssdbClient: SSDB = injector.instance[SSDB]
  val dbName: String = ZConfig.getString("schedule_service.db_name")
  val ssdbKVS: KVS[Long, Boolean] = SsdbKVS[Long, Boolean](dbName, ssdbClient)

  val fbAdsSource = FacebookAdsSource(
    id = -1,
    displayName = "test",
    accessToken =
      "EAATfsNsedB0BAEUGuZCBKHpGUfTvcHk9l9ruHOqZBlNFgNWjdLJ4HYH3WKxZAnvwnWf6bphAn8hg17WMOGkHnZCrY6wITq99TwWVZBvz9BYKrokuRNAcskNiJcIW0BErekuO8nA9RKGlmG7oc2WWKdkhSmZCfWZCdgSQWvbYzORC1G3bTMjAJ3ihvQkCp3irYfYB3HGy6gZBMZChWhZCahueyw0KNescnXBh3nbw08CeJvUvKpXCtlDpAHL2nyjPeIdIYZD"
  )

  val fbAdsJob = FacebookAdsJob(
    orgId = 1,
    jobId = 1,
    sourceId = 0,
    lastSuccessfulSync = 0,
    syncIntervalInMn = 0,
    lastSyncStatus = JobStatus.Error,
    currentSyncStatus = JobStatus.Error,
    destDatabaseName = "",
    destTableName = "",
    destinations = Seq(),
    tableName = FacebookTableName.Ad,
    accountId = "569792280183702",
    timeRange = Some(FacebookAdsTimeRange(since = "2020-11-27", until = "2022-11-28"))
  )

  test("run facebook ads wrong access token") {
    val syncInfo = SyncInfo(
      10,
      fbAdsJob,
      Some(
        fbAdsSource.copy(accessToken = "wrong 12")
      ),
      connection = connection
    )
    var finalJobProgress: JobProgress = null
    val worker = workerFactory.create(
      syncInfo,
      (jobProgress: JobProgress) => {
        println(s"Job progress ${jobProgress}")
        finalJobProgress = jobProgress
        Future.Unit
      }
    )
    worker.run()
    assert(finalJobProgress.jobStatus == JobStatus.Error)
    assert(finalJobProgress.message.isDefined)
    println(s"job failure cause ${finalJobProgress.message.get}")
  }
//
//  test("run fb ads job success") {
//    val syncInfo = SyncInfo(11, fbAdsJob, Some(fbAdsSource))
//    var finalJobProgress: JobProgress = null
//    val worker = workerFactory.create(
//      syncInfo,
//      (jobProgress: JobProgress) => {
//        println(s"Job progress ${jobProgress}")
//        finalJobProgress = jobProgress
//        Future.Unit
//      }
//    )
//    worker.run()
//    assert(finalJobProgress.jobStatus == JobStatus.Synced)
//    assert(finalJobProgress.message.isDefined)
//    assert(finalJobProgress.totalExecutionTime > 0)
//    assert(finalJobProgress.totalSyncRecord > 0)
//    println(s"job success ${finalJobProgress}")
//
//  }
//
//  test("run fb ads job and terminated") {
//    val syncInfo = SyncInfo(12, fbAdsJob, Some(fbAdsSource))
//    var finalJobProgress: JobProgress = null
//    val worker = workerFactory.create(
//      syncInfo,
//      (jobProgress: JobProgress) => {
//        println(s"Job progress ${jobProgress}")
//        finalJobProgress = jobProgress
//        Future.Unit
//      }
//    )
//    ssdbKVS.remove(syncInfo.syncId).asTwitter.syncGet()
//    worker.run()
//    assert(finalJobProgress.jobStatus == JobStatus.Terminated)
//    assert(finalJobProgress.message.isDefined)
//    assert(finalJobProgress.totalExecutionTime >= 0)
//    assert(finalJobProgress.totalSyncRecord == 0)
//    println(s"job run terminated ${finalJobProgress}")
//  }

}
