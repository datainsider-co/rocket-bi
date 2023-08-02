package co.datainsider.jobworker.repository.readers

import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.util.{Using, ZConfig}
import co.datainsider.jobworker.domain.job.{GaDateRange, GaDimension, GaJob, GaMetric}
import co.datainsider.jobworker.domain.source.GaSource
import co.datainsider.jobworker.domain.{DataDestination, JobStatus, JobType, SyncMode}
import co.datainsider.jobworker.repository.reader.Reader
import co.datainsider.jobworker.repository.reader.factory.GaReaderFactory
import co.datainsider.jobworker.util.GoogleOAuthConfig
import com.twitter.inject.Test
import co.datainsider.schema.domain.column.{FloatColumn, Int64Column, StringColumn}
import datainsider.client.util.JsonParser
import org.scalatest.BeforeAndAfterAll

import java.text.SimpleDateFormat
import java.util.Calendar

class GaReaderTest extends Test with BeforeAndAfterAll {
  val batchSize = 20
  // can get access-token & refresh token in https://developers.google.com/oauthplayground
  val googleSource = GaSource(
    orgId = 1L,
    id = 1L,
    displayName = "google source",
    accessToken = "ya29.a0Ael9sCNmhA4-aaIYyi4K3amMPcNj79K2UrxGyjcDuE3cYRGiG61a48VQnnySylL6mxW6wt2ZjmU0TcObYNUL-0SwjW_xCif5dMNKhhWk2KRPk7IYq1S7e59KPAqWuBXAQGZkGHvAztdw79VJUeAlWmrJMq9OaCgYKAbQSARESFQF4udJhvjt_Pa_WIpYyHcvpVqh6OA0163",
    refreshToken = "1//04lpb9hywTVN-CgYIARAAGAQSNwF-L9IrB16aXNlNFMZ-OIAFAj6WoZKkK2mV4SJdd3HCEzG1icHWF78gF_EMf1_MEd5cn_igsRk"
  )
  val gaJob = new GaJob(
    orgId = 1L,
    jobId = 1,
    jobType = JobType.Ga4,
    syncMode = SyncMode.IncrementalSync,
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
      GaMetric(expression = "ga:uniqueDimensionCombinations", alias = "ga_uniqueDimensionCombinations", dataType = "int64"),
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
      GaDimension(name = "ga:screenName", histogramBuckets = Array.empty),
    )
  )

  val googleOAuthConfig = GoogleOAuthConfig(
    clientId = ZConfig.getString("google.gg_client_id"),
    clientSecret = ZConfig.getString("google.gg_client_secret"),
    redirectUri = ZConfig.getString("google.redirect_uri"),
    serverEncodedUrl = ZConfig.getString("google.server_encoded_url")
  )

  val gaFactory = new GaReaderFactory(
    googleOAuthConfig,
    "datainsider",
    connTimeoutMs = 300000,
    readTimeoutMs = 300000,
    batchSize = 100000
  )
  lazy val reader: Reader = gaFactory.create(googleSource, gaJob)
  // fixme: comment test-case because don't have access to google analytics


//  test("detect schema success") {
//    val tableSchema = reader.detectTableSchema()
//    val expectedColumNames: Seq[String] = (gaJob.dimensions.map(_.name.replace(":", "_")) ++ gaJob.metrics.map(_.alias)).toSeq
//    val actualColumnNames: Seq[String] = tableSchema.columns.map(_.name)
//    assert(actualColumnNames.diff(expectedColumNames).isEmpty)
//    assert(tableSchema.dbName == gaJob.destDatabaseName)
//    assert(tableSchema.name == gaJob.destTableName)
//    println("Schema detected successfully")
//    println(s"columns size ${actualColumnNames.size}, columns name ${tableSchema.columns.mkString(",")}")
//  }
//
//  test("read data success") {
//    var counter = 0
//    if (reader.hasNext()) {
//      reader.next(
//        Seq(
//          Int64Column("pageviews", "pageviews"),
//          FloatColumn("bounceRate", "bounceRate"),
//          StringColumn("ga_screenName", "ga:screenName"),
//        )
//      )
//      counter += 1
//    }
//    assert(counter > 0)
//    println(s"Read data successfully, total event ${counter}")
//  }
//
//  test("read data with incremental & lastSyncedValue is empty") {
//    val incrementalJob = gaJob.copy(
//      syncMode = SyncMode.IncrementalSync,
//      lastSyncedValue = ""
//    )
//    Using(gaFactory.create(googleSource, incrementalJob)) {
//      reader => {
//        println(s"lastSyncedValue is ${reader.getLastSyncValue()}")
//        assert(reader.isIncrementalMode())
//        assert(reader.getLastSyncValue().nonEmpty)
//        assert(reader.getLastSyncValue().get == getYesterdayString())
//        if (reader.hasNext()) {
//          val data: Seq[Record] = reader.next(reader.detectTableSchema().columns)
//          assert(data.size > 0)
//        } else {
//          assert(false)
//        }
//      }
//    }
//  }
//
//  test("read data with incremental & lastSyncedValue is not empty") {
//    val incrementalJob = gaJob.copy(
//      syncMode = SyncMode.IncrementalSync,
//      lastSyncedValue = getYesterdayString()
//    )
//    Using(gaFactory.create(googleSource, incrementalJob)) {
//      reader => {
//        println(s"lastSyncedValue is ${reader.getLastSyncValue()}")
//        assert(reader.isIncrementalMode())
//        assert(reader.getLastSyncValue().nonEmpty)
//        assert(reader.getLastSyncValue().get == getYesterdayString())
//        println(s"reader.hasNext() ${reader.hasNext()}")
//        if (reader.hasNext()) {
//          val data: Seq[Record] = reader.next(reader.detectTableSchema().columns)
//          assert(data.nonEmpty)
//        }
//      }
//    }
//  }
//
//  private def getYesterdayString(): String = {
//    val calendar = Calendar.getInstance()
//    calendar.add(Calendar.DATE, -1)
//    val gaDateFormat = new SimpleDateFormat("yyyy-MM-dd")
//    gaDateFormat.format(calendar.getTime)
//  }
//
////  test("read all data") {
////    var counter = 0
////    while (reader.hasNext()) {
////      val data = reader.next(
////        Seq(
////          Int64Column("pageviews", "pageviews"),
////          FloatColumn("bounceRate", "bounceRate"),
////          StringColumn("ga_screenName", "ga:screenName"),
////        )
////      )
////      assert(data.size > 0)
////      counter += 1
////    }
////    assert(counter > 0)
////  }
//
//  test("test ga reader") {
//    val sourceAsJsonString: String = """{"class_name":"ga_source","org_id":0,"id":53,"display_name":"ThienVi's Google Analytics","refresh_token":"1//0e-tjfSRtYfNUCgYIARAAGA4SNwF-L9IrqyxXG0foS0QFEvU28iQ3pHpiy3l0dzs8MCv0ojEWIppaxFwi8mJD_Z42NiOtpeaxysg","access_token":"ya29.a0AVvZVsqieoSxcN6QJMNlsTWLw8Kls1xkbrTLKavVcUXCooU772To474-xehP4uBCqHBKVM-GXHFvkuLroZoNT0a5nk7WfJ5xVbeiHPOhTOvXGSLTeXewrcBqx2sVMK-y1061OtBhwFeLM-MipJEq_04qTORM5cUaCgYKAUcSARASFQGbdwaIf1QVlkCqDHPWcN3c2vyg0w0166","creator_id":"up-8eb77f50-a88d-4f77-8093-873fd1366a80","last_modify":1678243638346}"""
//    val jobAsJsonString: String = """{"class_name":"ga_job","org_id":0,"job_id":1434,"display_name":"Thien Vi's Job (table: site_content)","job_type":"Google_Analytics","creator_id":"up-8eb77f50-a88d-4f77-8093-873fd1366a80","last_modified":1678421550767,"sync_mode":"IncrementalSync","source_id":53,"last_successful_sync":1678421550747,"sync_interval_in_mn":60,"next_run_time":99999999999999,"last_sync_status":"Error","current_sync_status":"Error","schedule_time":{"class_name":"schedule_once","start_time":1678421115672},"dest_database_name":"tvc12_landing_page","dest_table_name":"site_content","destinations":["Clickhouse"],"view_id":"266810312","date_ranges":[{"start_date":"2023-02-08","end_date":"yesterday"}],"metrics":[{"expression":"ga:pageviews","alias":"ga_pageviews","data_type":"int64"},{"expression":"ga:timeOnPage","alias":"ga_timeOnPage","data_type":"float"},{"expression":"ga:entrances","alias":"ga_entrances","data_type":"int64"},{"expression":"ga:bounceRate","alias":"ga_bounceRate","data_type":"float"},{"expression":"ga:exitRate","alias":"ga_exitRate","data_type":"float"},{"expression":"ga:uniqueDimensionCombinations","alias":"ga_uniqueDimensionCombinations","data_type":"int64"}],"dimensions":[{"name":"ga:pagePath"},{"name":"ga:pageTitle"},{"name":"ga:pagePathLevel1"},{"name":"ga:landingPagePath"},{"name":"ga:exitPagePath"},{"name":"ga:screenName"},{"name":"ga:appVersion"},{"name":"ga:eventCategory"},{"name":"ga:eventAction"},{"name":"ga:eventLabel"}],"sorts":[],"access_token":"","refresh_token":"","last_synced_value":"","property_id":"UA-228496131-1","table_name":""}"""
//    val source = JsonParser.fromJson[GaSource](sourceAsJsonString)
//    val job = JsonParser.fromJson[GaJob](jobAsJsonString)
//    val reader = gaFactory.create(source, job)
//    var counter = 0
//    if (reader.hasNext()) {
//      val data = reader.next(
//        Seq(
//          Int64Column("pageviews", "pageviews"),
//          FloatColumn("bounceRate", "bounceRate"),
//          StringColumn("ga_screenName", "ga:screenName"),
//        )
//      )
//      assert(data.size > 0)
//      counter += 1
//    }
//  }

  test("init reader error") {
    try {
      val reader = gaFactory.create(googleSource, gaJob.copy(viewId = "123"))
      assert(false)
    } catch {
      case ex: Throwable =>
        ex.printStackTrace()
        assert(true)
    }
  }
}
