package co.datainsider.jobworker.service

import co.datainsider.bi.domain.ClickhouseConnection
import co.datainsider.bi.module.TestContainerModule
import co.datainsider.bi.util.ZConfig
import co.datainsider.jobworker.domain._
import co.datainsider.jobworker.domain.job.{GaDateRange, GaDimension, GaJob, GaMetric}
import co.datainsider.jobworker.domain.response.SyncInfo
import co.datainsider.jobworker.domain.source.GaSource
import co.datainsider.jobworker.module.JobWorkerTestModule
import co.datainsider.schema.module.MockSchemaClientModule
import com.twitter.inject.IntegrationTest
import com.twitter.inject.app.TestInjector
import com.twitter.util.Future
import datainsider.client.module.{MockHadoopFileClientModule, MockLakeClientModule}
import education.x.commons.{KVS, SsdbKVS}
import org.nutz.ssdb4j.spi.SSDB

import java.text.SimpleDateFormat
import java.util.Calendar

/**
  * Created by phg on 4/1/21.
  */
class GaWorkerTest extends AbstractWorkerTest {
  val googleSource = GaSource(
    orgId = 1L,
    id = 1L,
    displayName = "google source",
    accessToken =
      "ya29.a0AVvZVsqP8VLrp2eWSdqwKjuTo6wTHPaxQ7UcNeS9O-0jRSw2NBo-n0LCLIA9wB0BUNwx2yqp3eTkjXTkSCjl0Pt4wYPK_7VZfG9Jc7_8zB3_De2ZyTRcccQPLqFVOH8GLncGoPrFXUTYy8qGD1J-O0pWjkZLN7YaCgYKAbISARMSFQGbdwaICYHkIWL6xFYLmRPLd-9sbg0166",
    refreshToken =
      "1//0eECMqj2OcEzUCgYIARAAGA4SNwF-L9Ir4VZZ0DJY1Sz3VJIl4wF41xCZjNvRS1jAQRZ8mvWelucFxoZ5cejyM0BQEM5TFxdR2nk"
  )
  val gaJob = new GaJob(
    orgId = 1L,
    jobId = 1,
    jobType = JobType.Ga4,
    syncMode = SyncMode.FullSync,
    sourceId = 1L,
    lastSuccessfulSync = System.currentTimeMillis(),
    syncIntervalInMn = 0,
    lastSyncStatus = JobStatus.Synced,
    currentSyncStatus = JobStatus.Synced,
    destDatabaseName = "ga4_database",
    destTableName = "ga4_table",
    destinations = Seq(DataDestination.Clickhouse),
    viewId = "106555181",
    dateRanges = Array(GaDateRange(startDate = "2023-02-01", endDate = "today")),
    metrics = Array(
      GaMetric(expression = "ga:pageviews", alias = "ga_pageviews", dataType = "int64"),
      GaMetric(expression = "ga:timeOnPage", alias = "ga_timeOnPage", dataType = "float"),
      GaMetric(expression = "ga:entrances", alias = "ga_entrances", dataType = "int64"),
      GaMetric(expression = "ga:bounceRate", alias = "ga_bounceRate", dataType = "float"),
      GaMetric(expression = "ga:exitRate", alias = "ga_exitRate", dataType = "float"),
      GaMetric(
        expression = "ga:uniqueDimensionCombinations",
        alias = "ga_uniqueDimensionCombinations",
        dataType = "int64"
      )
    ),
    dimensions = Array(
      GaDimension(name = "ga:eventCategory", histogramBuckets = Array.empty),
      GaDimension(name = "ga:eventAction", histogramBuckets = Array.empty),
      GaDimension(name = "ga:eventLabel", histogramBuckets = Array.empty),
      GaDimension(name = "ga:pagePath", histogramBuckets = Array.empty),
      GaDimension(name = "ga:pageTitle", histogramBuckets = Array.empty),
      GaDimension(name = "ga:landingPagePath", histogramBuckets = Array.empty),
      GaDimension(name = "ga:pagePathLevel1", histogramBuckets = Array.empty),
      GaDimension(name = "ga:exitPagePath", histogramBuckets = Array.empty),
      GaDimension(name = "ga:screenName", histogramBuckets = Array.empty)
    )
  )

  val runnableJobFactory: RunnableJobFactory = injector.instance[RunnableJobFactory]
  val ssdbClient: SSDB = injector.instance[SSDB]
  val dbName: String = ZConfig.getString("schedule_service.db_name")
  val ssdbKVS: KVS[Long, Boolean] = SsdbKVS[Long, Boolean](dbName, ssdbClient)

//  test("Google Analytics worker full sync") {
//    val syncInfo = SyncInfo(1, gaJob, Some(googleSource))
//    var lastedJobProgress: JobProgress = null
//    val worker: Runnable = runnableJobFactory.create(syncInfo, (onProgress: JobProgress) => {
//        lastedJobProgress = onProgress
//        Future.Unit
//    })
//    worker.run()
//    println("lastedJobProgress", lastedJobProgress)
//    assert(lastedJobProgress.jobStatus == JobStatus.Synced)
//    assert(lastedJobProgress.totalSyncRecord > 0)
//  }
//
//  test("Google Analytics worker incremental sync & lastSyncedValue is empty") {
//    val syncInfo = SyncInfo(1, gaJob.copy(
//      syncMode = SyncMode.IncrementalSync,
//      lastSyncedValue = ""
//    ), Some(googleSource))
//    var lastedJobProgress: JobProgress = null
//    val worker: Runnable = runnableJobFactory.create(syncInfo, (onProgress: JobProgress) => {
//        lastedJobProgress = onProgress
//        Future.Unit
//    })
//    worker.run()
//    println("lastedJobProgress", lastedJobProgress)
//    assert(lastedJobProgress.jobStatus == JobStatus.Synced)
//    assert(lastedJobProgress.totalSyncRecord > 0)
//  }
//
//  test("Google Analytics worker incremental sync & lastSyncedValue is not empty") {
//    val syncInfo = SyncInfo(1, gaJob.copy(
//      syncMode = SyncMode.IncrementalSync,
//      lastSyncedValue = getYesterdayString()
//    ), Some(googleSource))
//    var lastedJobProgress: JobProgress = null
//    val worker: Runnable = runnableJobFactory.create(syncInfo, (onProgress: JobProgress) => {
//        lastedJobProgress = onProgress
//        Future.Unit
//    })
//    worker.run()
//    println("lastedJobProgress", lastedJobProgress)
//    assert(lastedJobProgress.jobStatus == JobStatus.Synced)
//    assert(lastedJobProgress.totalSyncRecord == 0)
//  }

  test("Google Analytics worker failed") {
    val syncInfo =
      SyncInfo(
        1,
        gaJob,
        Some(googleSource.copy(refreshToken = "invalid_token", accessToken = "invalid_token")),
        connection = connection
      )
    var lastedJobProgress: JobProgress = null
    val worker: Runnable = runnableJobFactory.create(
      syncInfo,
      (onProgress: JobProgress) => {
        lastedJobProgress = onProgress
        Future.Unit
      }
    )
    worker.run()
    println("lastedJobProgress", lastedJobProgress)
    assert(lastedJobProgress.jobStatus == JobStatus.Error)
    assert(lastedJobProgress.message != null)
  }

  private def getYesterdayString(): String = {
    val calendar = Calendar.getInstance()
    calendar.add(Calendar.DATE, -1)
    val gaDateFormat = new SimpleDateFormat("yyyy-MM-dd")
    gaDateFormat.format(calendar.getTime)
  }
}
