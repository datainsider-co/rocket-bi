// fixme: this test is not working
//package co.datainsider.jobworker.service.readers
//
//import co.datainsider.bi.client.JdbcClient.Record
//import co.datainsider.jobworker.domain.JobStatus
//import co.datainsider.jobworker.domain.job.{FacebookAdsJob, FacebookAdsTimeRange, FacebookTableName}
//import co.datainsider.jobworker.domain.source.FacebookAdsSource
//import co.datainsider.jobworker.repository.reader.facebook_ads.FacebookAdsFactory
//import co.datainsider.bi.util.ZConfig
//import com.twitter.inject.Test
//import co.datainsider.schema.domain.column._
//
//import java.sql.{Date, Timestamp}
//import java.text.SimpleDateFormat
//import scala.language.postfixOps
//
//class FacebookAdsReaderTest extends Test {
//
//  val appSecret = ZConfig.getString("facebook_ads.app_secret")
//  val appId = ZConfig.getString("facebook_ads.app_id")
//  val facebookAdsFactory = new FacebookAdsFactory(appSecret, appId)
//
//  val job = FacebookAdsJob(
//    orgId = 1,
//    jobId = 1,
//    sourceId = 0,
//    lastSuccessfulSync = 0,
//    syncIntervalInMn = 0,
//    lastSyncStatus = JobStatus.Error,
//    currentSyncStatus = JobStatus.Error,
//    destDatabaseName = "",
//    destTableName = "",
//    destinations = Seq(),
//    tableName = FacebookTableName.Ad,
//    accountId = "act_569792280183702",
//    timeRange = Some(FacebookAdsTimeRange(since = "2021-07-03", until = "2021-07-03"))
//  )
//
//  val source = FacebookAdsSource(
//    id = -1,
//    displayName = "test",
//    accessToken =
//      "EAATfsNsedB0BAFvX3QUpmVuDAmZCeVZBZCpTOBETKC2JqraWkZBh41cArdVqDsJ0oIZCRboreMRAMfVCo6PCqsKCZBP4UQpBqgK9dszEfqtNlzYP8OprFiDWPjYuqcZARWEp8R0TdG69Gci8JjvWWzAtSpxZC6ziyZCP4OjpTk8fLjVpPAGiE0HLJegZAQZCxRuMOMZD"
//  )
//
//  test("test get campaign record") {
//    val fbAdsJob = job.copy(tableName = FacebookTableName.Campaign)
//    val reader = facebookAdsFactory.create(source, fbAdsJob)
//    val columns = Seq(StringColumn("source_campaign", "source_campaign", None))
//    while (reader.hasNext()) {
//      val record: Seq[Record] = reader.next(columns)
//      ensureRecordSchema(columns, record)
//    }
//  }
//  test("test get campaign record with array") {
//    val fbAdsJob = job.copy(tableName = FacebookTableName.Campaign)
//    val reader = facebookAdsFactory.create(source, fbAdsJob)
//    val columns = Seq(StringColumn("pacing_type", "pacing_type", None))
//    while (reader.hasNext()) {
//      val record = reader.next(columns)
//      ensureRecordSchema(columns, record)
//    }
//  }
//  test("test get adset record") {
//    val fbAdsJob = job.copy(tableName = FacebookTableName.AdSet)
//    val reader = facebookAdsFactory.create(source, fbAdsJob)
//    val columns = Seq(
//      StringColumn("app_id", "app_id", None),
//      StringColumn("nonexit", "nonexist", None),
//      StringColumn("ad_name", "ad_name", None)
//    )
//    while (reader.hasNext()) {
//      val record = reader.next(columns)
//      assert(record(2) == null)
//      ensureRecordSchema(columns, record)
//    }
//  }
//  test("test get ad record") {
//    val reader = facebookAdsFactory.create(source, job.copy(tableName = FacebookTableName.Ad))
//    val columns = Seq(
//      DateTimeColumn("created_time", "created_time", None),
//      Int64Column("account_id", "account_id", None),
//      StringColumn("campaign", "campaign", None),
//      Int32Column("bid_amount", "bid_amount", None),
//      StringColumn("name", "name", None),
//      StringColumn("nonexit", "nonexist", None)
//    )
//    while (reader.hasNext()) {
//      val record = reader.next(columns)
//      ensureRecordSchema(columns, record)
//      assert(record(5) == null)
//    }
//  }
//
//  test("test get ad insight record") {
//
//    val reader = facebookAdsFactory.create(source, job.copy(tableName = FacebookTableName.AdInsight))
//    val columns = reader.detectTableSchema().columns
//
//    while (reader.hasNext()) {
//      val records = reader.next(columns)
//      records.foreach(record => ensureRecordSchema(columns, record.asInstanceOf[Seq[Record]]))
//    }
////    assert(reader.getLastSyncValue().get.equals("2020-12-28"))
//  }
//
//  test("test get adset insight record") {
//    val reader = facebookAdsFactory.create(source, job.copy(tableName = FacebookTableName.AdSetInsight))
//
//    val columns = reader.detectTableSchema().columns
//
//    while (reader.hasNext()) {
//      val records = reader.next(columns)
//      records.foreach(record => ensureRecordSchema(columns, record.asInstanceOf[Seq[Record]]))
//    }
//  }
//
//  test("test get all fields of ad") {
//
//    val reader = facebookAdsFactory.create(source, job.copy(tableName = FacebookTableName.Ad))
//    val columns = reader.detectTableSchema().columns
//
//    while (reader.hasNext()) {
//      val record = reader.next(columns)
//      ensureRecordSchema(columns, record)
//    }
//  }
//  test("test get all fields of adset") {
//
//    val reader = facebookAdsFactory.create(source, job.copy(tableName = FacebookTableName.AdSet))
//    val columns = reader.detectTableSchema().columns
//
//    while (reader.hasNext()) {
//      val record = reader.next(columns)
//      ensureRecordSchema(columns, record)
//    }
//  }
//  test("test get all fields of campaign") {
//    val reader = facebookAdsFactory.create(source, job.copy(tableName = FacebookTableName.Campaign))
//    val columns = reader.detectTableSchema().columns
//
//    while (reader.hasNext()) {
//      val record = reader.next(columns)
//      ensureRecordSchema(columns, record)
//    }
//  }
//
//  test("test get all fields of ad insight") {
//    val reader = facebookAdsFactory.create(source, job.copy(tableName = FacebookTableName.AdInsight))
//    val columns = reader.detectTableSchema().columns
//    while (reader.hasNext()) {
//      val records = reader.next(columns)
//      records.foreach(record => ensureRecordSchema(columns, record.asInstanceOf[Seq[Record]]))
//    }
//  }
//
//  test("test get all fields of campaign insight") {
//    val reader = facebookAdsFactory.create(source, job.copy(tableName = FacebookTableName.CampaignInsight))
//    val columns = reader.detectTableSchema().columns
//    while (reader.hasNext()) {
//      val records = reader.next(columns)
//      records.foreach(record => ensureRecordSchema(columns, record.asInstanceOf[Seq[Record]]))
//    }
//  }
//
//  test("test get ad insight when time range is none") {
//    val dateFormat = new SimpleDateFormat("YYYY-MM-dd")
//    val currentDate = dateFormat.format(new Timestamp(System.currentTimeMillis()))
//    val reader = facebookAdsFactory.create(source, job.copy(tableName = FacebookTableName.AdInsight, timeRange = None))
//    val columns =
//      Seq(StringColumn("date_start", "date_start", None), DoubleColumn("impressions", "impressions", None))
//    while (reader.hasNext()) {
//      val records = reader.next(columns)
//      records.foreach(record => ensureRecordSchema(columns, record.asInstanceOf[Seq[Record]]))
//    }
//  }
//
//  test("test get ad Activity") {
//
//    val reader = facebookAdsFactory.create(
//      source,
//      job.copy(
//        tableName = FacebookTableName.Activity
//      )
//    )
//    val columns =
//      reader.detectTableSchema().columns
//    while (reader.hasNext()) {
//      val record = reader.next(columns)
//      ensureRecordSchema(columns, record)
//    }
//  }
//// fixme: vì không có đủ quyền {Vuong}
////  test("test get Ad Creative") {
////
////    val reader = facebookAdsFactory.create(
////      source,
////      job.copy(
////        tableName = FacebookTableName.AdCreative
////      )
////    )
////    val columns =
////      // Seq(StringColumn("account_id", "account_id", None))
////      reader.detectTableSchema().columns
////    while (Try(reader.hasNext()).getOrElse(true)) {
////      val record = reader.next(columns)
////      ensureRecordSchema(columns, record)
////    }
////
////  }
//
//  test("test get custom conversion") {
//    val reader = facebookAdsFactory.create(
//      source,
//      job.copy(
//        tableName = FacebookTableName.CustomConversions
//      )
//    )
//    val columns =
//      reader.detectTableSchema().columns
//    while (reader.hasNext()) {
//      val record = reader.next(columns)
//      ensureRecordSchema(columns, record)
//    }
//  }
//
//  test("test get ad image") {
//    val reader = facebookAdsFactory.create(
//      source,
//      job.copy(
//        tableName = FacebookTableName.AdImage
//      )
//    )
//    val columns =
//      reader.detectTableSchema().columns
//    while (reader.hasNext()) {
//      val record = reader.next(columns)
//      ensureRecordSchema(columns, record)
//    }
//  }
//
//  test("test get ad video") {
//    val reader = facebookAdsFactory.create(
//      source,
//      job.copy(
//        tableName = FacebookTableName.AdVideo
//      )
//    )
//    val columns =
//      reader.detectTableSchema().columns
//    while (reader.hasNext()) {
//      val record = reader.next(columns)
//      ensureRecordSchema(columns, record)
//    }
//  }
//
//  test("test get ad account") {
//    val reader = facebookAdsFactory.create(
//      source,
//      job.copy(
//        tableName = FacebookTableName.AdAccount
//      )
//    )
//    val columns =
//      reader.detectTableSchema().columns
//    while (reader.hasNext()) {
//      val record = reader.next(columns)
//      ensureRecordSchema(columns, record)
//    }
//  }
//
//  def ensureRecordSchema(columns: Seq[Column], records: Seq[Record]): Unit = {
//    //assert(columns.length == record.length)
//    records.foreach(record => {
//      record.zipAll(columns, null, null).map {
//        case (null, _) => assert(true)
//        case (_, null) => assert(false, "column is null")
//        case (null, null) =>
//          assert(false, "column and record is null")
//        case (record, column) =>
//          column match {
//            case _: Int32Column  => assert(record.isInstanceOf[Int])
//            case _: UInt32Column => assert(record.isInstanceOf[Int])
//            case _: DoubleColumn => assert(record.isInstanceOf[Double])
//            case _: StringColumn =>
//              assert(record.isInstanceOf[String])
//            case _: Int64Column => assert(record.isInstanceOf[Long])
//            case _: BoolColumn  => assert(record.isInstanceOf[Boolean])
//            case _: DateTimeColumn =>
//              assert(record.isInstanceOf[Timestamp])
//            case _: FloatColumn => assert(record.isInstanceOf[Float])
//            case _: DateColumn =>
//              assert(record.isInstanceOf[Date])
//            case _ => assert(false, "not support type")
//          }
//      }
//    })
//  }
//
//}
