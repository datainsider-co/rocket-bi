import datainsider.client.domain.schema.column._
import datainsider.jobworker.client.JdbcClient
import datainsider.jobworker.domain.JobStatus
import datainsider.jobworker.domain.job.{FacebookAdsJob, FacebookAdsTimeRange, FacebookTableName}
import datainsider.jobworker.domain.source.FacebookAdsSource
import datainsider.jobworker.repository.reader.facebook_ads.FacebookAdsFactory
import datainsider.jobworker.util.ZConfig
import org.scalatest.FunSuite

import java.sql.{Date, Timestamp}
import java.text.SimpleDateFormat
import scala.language.postfixOps

class FacebookAdsReaderTest extends FunSuite {

  val appSecret = ZConfig.getString("facebook_ads.app_secret")
  val appId = ZConfig.getString("facebook_ads.app_id")
  val facebookAdsFactory = new FacebookAdsFactory(appSecret, appId)

  val job = FacebookAdsJob(
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
    accountId = "act_569792280183702",
    datePreset = Some("today"),
    timeRange = Some(FacebookAdsTimeRange(since = "2020-11-27", until = "2022-11-28"))
  )

  val source = FacebookAdsSource(
    id = -1,
    displayName = "test",
    accessToken =
      "EAATfsNsedB0BAFZCU7J7ZANJRZAoh8u1FvxZAUbmJ0EITrCWZC5KRdh4goCgOXuaURZCd2hT7u7iOYlfmR36CQ49MSp4ZAWZAIKjvgtllsaqrQZAwIYTx4jZB4onuL8ipEetYz9nnNRxdNVziZBymxQIwwbaSvZAlkenFKY6HPiTYzMvhPTUS0B5PedRBDfzxxKz4gBPsfnwaA8rvE6hIG8IZAidJZCYd5VyhC0jPJaXIIHciWknCiG2RkMa2ZA9RbcRKpXDcoZD"
  )

  test("test get campaign record") {
    val fbAdsJob = job.copy(tableName = FacebookTableName.Campaign)
    val reader = facebookAdsFactory.create(source, fbAdsJob)
    val columns = Seq(StringColumn("source_campaign", "source_campaign", None))
    while (reader.hasNext()) {

      val record = reader.next(columns)
      ensureRecordSchema(columns, record)
    }
  }
  test("test get campaign record with array") {
    val fbAdsJob = job.copy(tableName = FacebookTableName.Campaign)
    val reader = facebookAdsFactory.create(source, fbAdsJob)
    val columns = Seq(StringColumn("pacing_type", "pacing_type", None))
    while (reader.hasNext()) {
      val record = reader.next(columns)
      ensureRecordSchema(columns, record)
    }
  }
  test("test get adset record") {
    val fbAdsJob = job.copy(tableName = FacebookTableName.AdSet)
    val reader = facebookAdsFactory.create(source, fbAdsJob)
    val columns = Seq(
      StringColumn("app_id", "app_id", None),
      StringColumn("nonexit", "nonexist", None),
      StringColumn("ad_name", "ad_name", None)
    )
    while (reader.hasNext()) {
      val record = reader.next(columns)
      assert(record(2) == null)
      ensureRecordSchema(columns, record)
    }
  }
  test("test get ad record") {
    val reader = facebookAdsFactory.create(source, job.copy(tableName = FacebookTableName.Ad))
    val columns = Seq(
      DateTimeColumn("created_time", "created_time", None),
      Int64Column("account_id", "account_id", None),
      StringColumn("campaign", "campaign", None),
      Int32Column("bid_amount", "bid_amount", None),
      StringColumn("name", "name", None),
      StringColumn("nonexit", "nonexist", None)
    )
    while (reader.hasNext()) {
      val record = reader.next(columns)
      ensureRecordSchema(columns, record)
      assert(record(5) == null)
    }
  }

  test("test get ad insight record") {

    val reader = facebookAdsFactory.create(source, job.copy(tableName = FacebookTableName.AdInsight))
    val columns = Seq(
      StringColumn("app_id", "app_id", None),
      StringColumn("nonexit", "nonexist", None),
      StringColumn("ad_name", "ad_name", None)
    )

    while (reader.hasNext()) {
      val record = reader.next(columns)
      ensureRecordSchema(columns, record)
      assert(record(1) == null)
    }
  }

  test("test get adset insight record") {
    val reader = facebookAdsFactory.create(source, job.copy(tableName = FacebookTableName.AdSetInsight))

    val columns = Seq(
      StringColumn("impressions", "impressions", None),
      StringColumn("nonexit", "nonexist", None),
      StringColumn("body_asset", "body_asset", None),
      StringColumn("cost_per_ad_click", "cost_per_ad_click", None)
    )

    while (reader.hasNext()) {
      val record = reader.next(columns)
      ensureRecordSchema(columns, record)
      assert(record(1) == null)
    }
  }

  test("test get all fields of ad") {

    val reader = facebookAdsFactory.create(source, job.copy(tableName = FacebookTableName.Ad))
    val columns = reader.detectTableSchema().columns

    while (reader.hasNext()) {
      val record = reader.next(columns)
      ensureRecordSchema(columns, record)
    }
  }
  test("test get all fields of adset") {

    val reader = facebookAdsFactory.create(source, job.copy(tableName = FacebookTableName.AdSet))
    val columns = reader.detectTableSchema().columns

    while (reader.hasNext()) {
      val record = reader.next(columns)
      ensureRecordSchema(columns, record)
    }
  }
  test("test get all fields of campaign") {

    val reader = facebookAdsFactory.create(source, job.copy(tableName = FacebookTableName.Campaign))
    val columns = reader.detectTableSchema().columns

    while (reader.hasNext()) {
      val record = reader.next(columns)
      ensureRecordSchema(columns, record)
    }
  }
  test("test get all fields of ad insight") {

    val reader = facebookAdsFactory.create(source, job.copy(tableName = FacebookTableName.AdInsight))
    val columns = reader.detectTableSchema().columns

    while (reader.hasNext()) {
      val record = reader.next(columns)
      ensureRecordSchema(columns, record)
    }
  }

  test("test get all fields of adset insight") {

    val reader = facebookAdsFactory.create(source, job.copy(tableName = FacebookTableName.AdSetInsight))
    val columns = reader.detectTableSchema().columns

    while (reader.hasNext()) {
      val record = reader.next(columns)
      ensureRecordSchema(columns, record)
    }
  }

  test("test get all fields of campaign insight") {

    val reader = facebookAdsFactory.create(source, job.copy(tableName = FacebookTableName.CampaignInsight))
    val columns = reader.detectTableSchema().columns

    while (reader.hasNext()) {
      val record = reader.next(columns)
      ensureRecordSchema(columns, record)
    }
  }

  test("test get all fields of account insight") {

    val reader = facebookAdsFactory.create(source, job.copy(tableName = FacebookTableName.AccountInsight))
    val columns = reader.detectTableSchema().columns

    while (reader.hasNext()) {
      val record = reader.next(columns)
      ensureRecordSchema(columns, record)
    }
  }

  test("test get ad insight when time range is none") {
    val dateFormat = new SimpleDateFormat("YYYY-MM-dd")
    val currentDate = dateFormat.format(new Timestamp(System.currentTimeMillis()))
    val reader = facebookAdsFactory.create(source, job.copy(tableName = FacebookTableName.AdInsight, timeRange = None))
    val columns =
      Seq(StringColumn("date_start", "date_start", None), DoubleColumn("impressions", "impressions", None))
    while (reader.hasNext()) {
      val record = reader.next(columns)
      assert(record.head.equals(currentDate))
      ensureRecordSchema(columns, record)
    }
  }

  test("test get ad insight when date preset is none") {

    val reader = facebookAdsFactory.create(
      source,
      job.copy(
        tableName = FacebookTableName.AdInsight,
        datePreset = None
      )
    )
    val columns =
      Seq(StringColumn("date_start", "date_start", None), DoubleColumn("impressions", "impressions", None))
    while (reader.hasNext()) {
      val record = reader.next(columns)
      assert(record(0).equals(job.timeRange.get.since))
      ensureRecordSchema(columns, record)
    }
  }

  test("test get ad insight when date time range is none") {

    val reader = facebookAdsFactory.create(
      source,
      job.copy(
        tableName = FacebookTableName.AdInsight,
        datePreset = None
      )
    )
    val columns =
      Seq(StringColumn("date_start", "date_start", None), DoubleColumn("impressions", "impressions", None))
    while (reader.hasNext()) {
      val record = reader.next(columns)
      assert(record(0).equals(job.timeRange.get.since))
      ensureRecordSchema(columns, record)
    }
  }

  test("test get ad Activity") {

    val reader = facebookAdsFactory.create(
      source,
      job.copy(
        tableName = FacebookTableName.Activity
      )
    )
    val columns =
      reader.detectTableSchema().columns
    while (reader.hasNext()) {
      val record = reader.next(columns)
      ensureRecordSchema(columns, record)
    }
  }
// fixme: vì không có đủ quyền {Vuong}
//  test("test get Ad Creative") {
//
//    val reader = facebookAdsFactory.create(
//      source,
//      job.copy(
//        tableName = FacebookTableName.AdCreative
//      )
//    )
//    val columns =
//      // Seq(StringColumn("account_id", "account_id", None))
//      reader.detectTableSchema().columns
//    while (Try(reader.hasNext()).getOrElse(true)) {
//      val record = reader.next(columns)
//      ensureRecordSchema(columns, record)
//    }
//
//  }

  test("test get custom conversion") {
    val reader = facebookAdsFactory.create(
      source,
      job.copy(
        tableName = FacebookTableName.CustomConversions
      )
    )
    val columns =
      reader.detectTableSchema().columns
    while (reader.hasNext()) {
      val record = reader.next(columns)
      ensureRecordSchema(columns, record)
    }
  }

  test("test get ad image") {
    val reader = facebookAdsFactory.create(
      source,
      job.copy(
        tableName = FacebookTableName.AdImage
      )
    )
    val columns =
      reader.detectTableSchema().columns
    while (reader.hasNext()) {
      val record = reader.next(columns)
      ensureRecordSchema(columns, record)
    }
  }

  test("test get ad video") {
    val reader = facebookAdsFactory.create(
      source,
      job.copy(
        tableName = FacebookTableName.AdVideo
      )
    )
    val columns =
      reader.detectTableSchema().columns
    while (reader.hasNext()) {
      val record = reader.next(columns)
      ensureRecordSchema(columns, record)
    }
  }

  test("test get ad account") {
    val reader = facebookAdsFactory.create(
      source,
      job.copy(
        tableName = FacebookTableName.AdAccount
      )
    )
    val columns =
      reader.detectTableSchema().columns
    while (reader.hasNext()) {
      val record = reader.next(columns)
      ensureRecordSchema(columns, record)
    }
  }
  def ensureRecordSchema(columns: Seq[Column], record: JdbcClient.Record): Unit = {
    assert(columns.length == record.length)
    for (i <- 0 until columns.length) {

      columns(i) match {
        case _: Int32Column  => assert(record(i).isInstanceOf[Int] || record(i) == null)
        case _: UInt32Column => assert(record(i).isInstanceOf[Int] || record(i) == null)
        case _: DoubleColumn => assert(record(i).isInstanceOf[Double] || record(i) == null)
        case _: StringColumn =>
          assert(record(i).isInstanceOf[String] || record(i) == null)
        case _: Int64Column => assert(record(i).isInstanceOf[Long] || record(i) == null)
        case _: BoolColumn  => assert(record(i).isInstanceOf[Boolean] || record(i) == null)
        case _: DateTimeColumn =>
          assert(record(i).isInstanceOf[Timestamp] || record(i) == null)
        case _: FloatColumn => assert(record(i).isInstanceOf[Float] || record(i) == null)
        case _: DateColumn =>
          assert(record(i).isInstanceOf[Date] || record(i) == null)
        case _ =>
          assert(record(i) == null)
      }

    }

  }

}
