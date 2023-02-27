package datainsider.jobworker.service

import com.twitter.inject.IntegrationTest
import com.twitter.inject.app.TestInjector
import com.twitter.util.Future
import datainsider.client.domain.Implicits.{FutureEnhanceLike, ScalaFutureLike}
import datainsider.client.module.{MockLakeClientModule, MockSchemaClientModule}
import datainsider.client.util.ZConfig
import datainsider.jobworker.domain._
import datainsider.jobworker.domain.job.{FacebookAdsJob, FacebookAdsTimeRange, FacebookTableName}
import datainsider.jobworker.domain.response.SyncInfo
import datainsider.jobworker.domain.source.FacebookAdsSource
import datainsider.jobworker.module.{JobWorkerTestModule, MockHadoopFileClientModule, TestModule}
import datainsider.jobworker.repository.reader.facebook_ads.FacebookAdsFactory
import education.x.commons.{KVS, SsdbKVS}
import org.nutz.ssdb4j.spi.SSDB

import scala.concurrent.ExecutionContext.Implicits.global

class FacebookAdsWorkerTest extends IntegrationTest {
  override protected def injector =
    TestInjector(
      TestModule,
      JobWorkerTestModule,
      MockHadoopFileClientModule,
      MockLakeClientModule,
      MockSchemaClientModule
    ).newInstance()

  val workerFactory: RunnableJobFactory = injector.instance[RunnableJobFactory]
  val ssdbClient: SSDB = injector.instance[SSDB]
  val dbName: String = ZConfig.getString("database_config.ssdb.db_name")
  val ssdbKVS: KVS[Long, Boolean] = SsdbKVS[Long, Boolean](dbName, ssdbClient)

  val fbAdsSource = FacebookAdsSource(
    id = -1,
    displayName = "test",
    accessToken =
      "EAAL6rO2TSzsBABeXlQWwy316ZAeqdZA2qNmNyz06znTddCzQ2ie31GtNcYOZBy6V8flYlWeWP2xM81Xs0yV34INzvOXuSW7Fn6Ad3LW4dHwCV2RTFG94132O6nkoqncKlATMgu0pOVS20cztPGM5QAuOX0yFBthlrs4xuqOCKwxJ8Y6uVcxIa00hkG50ZC6jcXVmVx7SgNpP7ZB8h859eDoc6CbvC4gYZD"
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
    datePreset = Some("data_maximum"),
    timeRange = Some(FacebookAdsTimeRange(since = "2020-11-27", until = "2022-11-28"))
  )

  test("run facebook ads wrong access token") {
    val syncInfo = SyncInfo(
      10,
      fbAdsJob,
      Some(
        fbAdsSource.copy(accessToken = "wrong 12")
      )
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

  test("run fb ads job success") {
    val syncInfo = SyncInfo(11, fbAdsJob, Some(fbAdsSource))
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
    assert(finalJobProgress.jobStatus == JobStatus.Synced)
    assert(finalJobProgress.message.isDefined)
    assert(finalJobProgress.totalExecutionTime > 0)
    assert(finalJobProgress.totalSyncRecord > 0)
    println(s"job success ${finalJobProgress}")

  }

  test("run fb ads job and terminated") {
    val syncInfo = SyncInfo(12, fbAdsJob, Some(fbAdsSource))
    var finalJobProgress: JobProgress = null
    val worker = workerFactory.create(
      syncInfo,
      (jobProgress: JobProgress) => {
        println(s"Job progress ${jobProgress}")
        finalJobProgress = jobProgress
        Future.Unit
      }
    )
    ssdbKVS.remove(syncInfo.syncId).asTwitter.syncGet()
    worker.run()
    assert(finalJobProgress.jobStatus == JobStatus.Terminated)
    assert(finalJobProgress.message.isDefined)
    assert(finalJobProgress.totalExecutionTime >= 0)
    assert(finalJobProgress.totalSyncRecord == 0)
    println(s"job run terminated ${finalJobProgress}")
  }

}
