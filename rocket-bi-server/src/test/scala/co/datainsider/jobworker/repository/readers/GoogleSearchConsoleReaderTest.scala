package co.datainsider.jobworker.repository.readers

import co.datainsider.bi.util.ZConfig
import co.datainsider.jobscheduler.domain.job.{DateRangeInfo, GoogleSearchConsoleType, SearchAnalyticsConfig}
import co.datainsider.jobworker.domain.job.GoogleSearchConsoleJob
import co.datainsider.jobworker.domain.source.GoogleSearchConsoleSource
import co.datainsider.jobworker.domain.{JobStatus, SyncMode}
import co.datainsider.jobworker.repository.reader.googlesearchconsole.SearchConsoleReaderFactory
import co.datainsider.jobworker.util.{DateTimeUtils, GoogleOAuthConfig}
import com.twitter.inject.Test
import org.scalatest.BeforeAndAfterAll

class GoogleSearchConsoleReaderTest extends Test with BeforeAndAfterAll {
  val batchSize = 20
  val yesterday = DateTimeUtils.formatDate(DateTimeUtils.getYesterday())
  val today = DateTimeUtils.formatDate(DateTimeUtils.getToday())

  val googleSource = GoogleSearchConsoleSource(
    orgId = 1L,
    id = 1L,
    displayName = "google source",
    refreshToken =
      "1//0eowrAanaOyunCgYIARAAGA4SNwF-L9Irq3rNT5dlxM9lSYUF-Bos0vWYcWJnLY7C-S81LcMw2VeghqNiBoRFqTmkGtbv_kc2THE",
    accessToken =
      "ya29.a0AfB_byA_Lb-XKRWY0EwMnv-mO4g-ZJ4j1CnmR9_rPJBVtWhCbMg9n1S7JWUz6UwrmEWswoX8vEqvhchQ1UWl60vxNnRZd6WNU-W5vVDYVsHR4V6gnzvVV39C7uMefi-c5ZH5cbBUKv6ieMenpCVgujqs9faMZATaU6kaCgYKASkSARASFQGOcNnCb96tICMsBKQ_wUF-YJ_lEw0170",
    creatorId = ""
  )

  val job = new GoogleSearchConsoleJob(
    orgId = 1L,
    jobId = 1,
    displayName = "job",
    creatorId = "",
    lastModified = System.currentTimeMillis(),
    syncMode = SyncMode.IncrementalSync,
    sourceId = 1L,
    lastSuccessfulSync = 0,
    syncIntervalInMn = 0,
    lastSyncStatus = JobStatus.Synced,
    currentSyncStatus = JobStatus.Synced,
    destDatabaseName = "tvc12",
    destTableName = "tvc12",
    destinations = Seq.empty,
    siteUrl = "https://www.rocket.bi/",
    tableType = GoogleSearchConsoleType.SearchAnalytics,
    dateRange = DateRangeInfo(
      fromDate = "last_7_days",
      toDate = "today"
    ),
    searchAnalyticsConfig = SearchAnalyticsConfig(
      `type` = "web",
      dataState = Some("final")
    )
  )
  val googleOAuthConfig = GoogleOAuthConfig(
    clientId = ZConfig.getString("google.gg_client_id"),
    clientSecret = ZConfig.getString("google.gg_client_secret"),
    redirectUri = ZConfig.getString("google.redirect_uri"),
    serverEncodedUrl = ZConfig.getString("google.server_encoded_url")
  )

  val factory = new SearchConsoleReaderFactory(
    googleOAuthConfig = googleOAuthConfig,
    applicationName = "datainsider",
    connTimeoutMs = 10000,
    readTimeoutMs = 10000
  )

  /**
    * comment out this test because refresh token can be expired in the future
    * all test cases are passed
    */

//  test("[Incremental] init reader success") {
//    val reader: Reader = factory.create(googleSource, job)
//    assert(reader != null)
//    println("reader:mode::", reader.isIncrementalMode())
//    val table: TableSchema = reader.detectTableSchema()
//    println("table:columns", table.columns.size, table.columns.map(_.name).mkString(","))
//    assert(table != null)
//    assert(table.columns.nonEmpty)
//    assert(reader.isIncrementalMode() == true)
//  }
//
//  test("[Incremental][SearchAnalytics] read data success") {
//    val reader: Reader = factory.create(googleSource, job)
//    val table: TableSchema = reader.detectTableSchema()
//    var isRunning = true
//
//    do {
//      val records: Seq[Record] = reader.next(columns = table.columns)
//      println("records:", records.size)
//      if (records.isEmpty) {
//        isRunning = false
//      }
//    } while (isRunning)
//    val yesterday = DateTimeUtils.getYesterday()
//    println("last sync value", reader.getLastSyncValue())
//    assert(reader.getLastSyncValue() === Some(DateTimeUtils.formatDate(yesterday)))
//  }
//
//  test("[Incremental][SearchAnalytics] read data in yesterday") {
//    val newJob = job.copy(
//      dateRange = DateRangeInfo(
//        fromDate = "yesterday",
//        toDate = "today"
//      )
//    )
//    val reader = factory.create(googleSource, newJob)
//    val records = reader.next(reader.detectTableSchema().columns)
//    println("records:", records.size)
//    println("last sync value", reader.getLastSyncValue())
//    assert(reader.getLastSyncValue() === Some(DateTimeUtils.formatDate(DateTimeUtils.getYesterday())))
//  }
//
//  test("[Incremental][SearchAnalytics] read data in yesterday has lastSyncValue") {
//    val newJob = job.copy(
//      dateRange = DateRangeInfo(
//        fromDate = "yesterday",
//        toDate = "today"
//      ),
//      lastSyncedValue = Some(yesterday)
//    )
//    val reader = factory.create(googleSource, newJob)
//    assertThrows[CompletedReaderException](reader.next(reader.detectTableSchema().columns))
//    assert(reader.getLastSyncValue() === Some(yesterday))
//  }
//
//  test("[Incremental][SearchAppearance] read data success") {
//    val newJob = job.copy(tableType = GoogleSearchConsoleType.SearchAppearance)
//    val reader: Reader = factory.create(googleSource, newJob)
//    val table: TableSchema = reader.detectTableSchema()
//    var isRunning = true
//
//    do {
//      try {
//        val records: Seq[Record] = reader.next(columns = table.columns)
//        println("records:", records.size)
//      } catch {
//        case _: Throwable => isRunning = false
//      }
//    } while (isRunning)
//    println("last sync value", reader.getLastSyncValue())
//    assert(reader.getLastSyncValue() === Some(yesterday))
//  }
//
//  test("[Incremental][SearchAppearance] read data in yesterday") {
//    val newJob = job.copy(
//      tableType = GoogleSearchConsoleType.SearchAppearance,
//      dateRange = DateRangeInfo(
//        fromDate = "yesterday",
//        toDate = "today"
//      )
//    )
//    val reader = factory.create(googleSource, newJob)
//    assertThrows[CompletedReaderException](reader.next(reader.detectTableSchema().columns))
//    println("last sync value", reader.getLastSyncValue())
//    assert(reader.getLastSyncValue() === Some(yesterday))
//  }
//
//  test("[Incremental][SearchAppearance] read data in yesterday has lastSyncValue") {
//    val newJob = job.copy(
//      tableType = GoogleSearchConsoleType.SearchAppearance,
//      dateRange = DateRangeInfo(
//        fromDate = "yesterday",
//        toDate = "today"
//      ),
//      lastSyncedValue = Some(yesterday)
//    )
//    val reader = factory.create(googleSource, newJob)
//    assertThrows[CompletedReaderException](reader.next(reader.detectTableSchema().columns))
//    assert(reader.getLastSyncValue() === Some(yesterday))
//  }
//
//  test("[FullSync][SearchAnalytics] read data success") {
//    val newJob = job.copy(syncMode = SyncMode.FullSync)
//    val reader: Reader = factory.create(googleSource, newJob)
//    val table: TableSchema = reader.detectTableSchema()
//    var isRunning = true
//
//    val records: Seq[Record] = reader.next(columns = table.columns)
//    println("records:", records.size)
//    println("last sync value", reader.getLastSyncValue())
//    assert(reader.getLastSyncValue() === Some(today))
//  }
//
//  test("[FullSync][SearchAnalytics] read data in yesterday") {
//    val newJob = job.copy(
//      syncMode = SyncMode.FullSync,
//      dateRange = DateRangeInfo(
//        fromDate = "yesterday",
//        toDate = "today"
//      )
//    )
//    val reader = factory.create(googleSource, newJob)
//    val records = reader.next(reader.detectTableSchema().columns)
//    println("records:", records.size)
//    println("last sync value", reader.getLastSyncValue())
//    assert(reader.getLastSyncValue() === Some(today))
//  }
//
//  test("[FullSync][SearchAnalytics] read data has lastSyncValue") {
//    val newJob = job.copy(
//      syncMode = SyncMode.FullSync,
//      dateRange = DateRangeInfo(
//        fromDate = "last_7_days",
//        toDate = "today"
//      ),
//      lastSyncedValue = Some(yesterday)
//    )
//    val reader = factory.create(googleSource, newJob)
//    val records = reader.next(reader.detectTableSchema().columns)
//    println("records:", records.size)
//    println("last sync value", reader.getLastSyncValue())
//    assert(reader.getLastSyncValue() === Some(today))
//  }
//
//  test("[FullSync][SearchAppearance] read data success") {
//    val newJob = job.copy(
//      syncMode = SyncMode.FullSync,
//      tableType = GoogleSearchConsoleType.SearchAppearance
//    )
//    val reader: Reader = factory.create(googleSource, newJob)
//    val table: TableSchema = reader.detectTableSchema()
//    val records: Seq[Record] = reader.next(columns = table.columns)
//    println("records:", records.size)
//    println("last sync value", reader.getLastSyncValue())
//    assert(reader.getLastSyncValue() === Some(today))
//  }
//
//  test("[FullSync][SearchAppearance] read data in yesterday") {
//    val newJob = job.copy(
//      syncMode = SyncMode.FullSync,
//      tableType = GoogleSearchConsoleType.SearchAppearance,
//      dateRange = DateRangeInfo(
//        fromDate = "yesterday",
//        toDate = "today"
//      )
//    )
//    val reader = factory.create(googleSource, newJob)
//    val records = reader.next(reader.detectTableSchema().columns)
//    println("records:", records.size)
//    println("last sync value", reader.getLastSyncValue())
//    assert(reader.getLastSyncValue() === Some(today))
//  }
//
//  test("[FullSync][SearchAppearance] read data in yesterday has lastSyncValue") {
//    val newJob = job.copy(
//      syncMode = SyncMode.FullSync,
//      tableType = GoogleSearchConsoleType.SearchAppearance,
//      dateRange = DateRangeInfo(
//        fromDate = "last_7_days",
//        toDate = "today"
//      ),
//      lastSyncedValue = Some(yesterday)
//    )
//    val reader = factory.create(googleSource, newJob)
//    val records = reader.next(reader.detectTableSchema().columns)
//    println("records:", records.size)
//    println("last sync value", reader.getLastSyncValue())
//    assert(reader.getLastSyncValue() === Some(today))
//  }

}
