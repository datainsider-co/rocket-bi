//package co.datainsider.jobworker.service.readers
//
//import co.datainsider.jobworker.domain.JobStatus
//import co.datainsider.jobworker.domain.job.ReportType.ReportType
//import co.datainsider.jobworker.domain.job.{ReportType, TikTokAdsEndPoint, TikTokAdsJob, TikTokReport}
//import co.datainsider.jobworker.domain.source.TikTokAdsSource
//import co.datainsider.jobworker.exception.CompletedReaderException
//import co.datainsider.jobworker.repository.reader.Reader
//import co.datainsider.jobworker.repository.reader.factory.TikTokAdsReaderFactory
//import co.datainsider.jobworker.repository.reader.tiktok.{TikTokClient, TikTokTimeRange}
//import co.datainsider.bi.util.ZConfig
//
//class TikTokReportReaderTest extends AbstractTestReader {
//
//  val job = TikTokAdsJob(
//    orgId = 1,
//    jobId = 1,
//    sourceId = 1,
//    lastSuccessfulSync = 0,
//    syncIntervalInMn = 0,
//    lastSyncStatus = JobStatus.Init,
//    currentSyncStatus = JobStatus.Init,
//    destDatabaseName = "test",
//    destTableName = "test",
//    destinations = Seq(),
//    advertiserId = "7174349799003717633",
//    tikTokEndPoint = TikTokAdsEndPoint.Report,
//    tikTokReport = None,
//    lastSyncedValue = None
//  )
//
//  val accessToken = "08ff10569e9df1ef6acd22fda27a4328214f2c75"
//  val tikTokTimeRange: TikTokTimeRange = TikTokTimeRange(start = "2020-12-08", end = "2021-01-19")
//  val report: TikTokReport = TikTokReport(
//    reportType = ReportType.AuctionBasicCampaignEngagement,
//    timeRange = tikTokTimeRange
//  )
//  val tiktokClient = new TikTokClient(ZConfig.getString("tiktok_ads.base_url"), accessToken)
//  val tikTokSource: TikTokAdsSource = TikTokAdsSource(id = 1, "tiktok_ads", accessToken)
//
//  test("test  tiktok report AuctionBasicAdData ") {
//
//    val reader = getReader(ReportType.AuctionBasicCampaignData)
//    val columns = reader.detectTableSchema().columns
//    var inLoop = true
//    while (reader.hasNext() && inLoop) {
//      try {
//        val record = reader.next(columns)
//        ensureRecords(columns, record)
//      } catch {
//        case e: CompletedReaderException => inLoop = false
//      }
//    }
//  }
//
//  test("test  tiktok report AuctionBasicAdEngagement ") {
//
//    val reader = getReader(ReportType.AuctionBasicAdEngagement)
//    val columns = reader.detectTableSchema().columns
//    var inLoop = true
//    while (reader.hasNext() && inLoop) {
//      try {
//        val record = reader.next(columns)
//        ensureRecords(columns, record)
//      } catch {
//        case e: CompletedReaderException => inLoop = false
//      }
//    }
//  }
//
//  test("test  tiktok report AuctionBasicAdInAppEvent ") {
//
//    val reader = getReader(ReportType.AuctionBasicAdInAppEvent)
//    val columns = reader.detectTableSchema().columns
//    var inLoop = true
//    while (reader.hasNext() && inLoop) {
//      try {
//        val record = reader.next(columns)
//        ensureRecords(columns, record)
//      } catch {
//        case e: CompletedReaderException => inLoop = false
//      }
//    }
//  }
//
//  test("test tiktok report AuctionBasicAdOnsiteEvent ") {
//
//    val reader = getReader(ReportType.AuctionBasicAdOnsiteEvent)
//    val columns = reader.detectTableSchema().columns
//    var inLoop = true
//    while (reader.hasNext() && inLoop) {
//      try {
//        val record = reader.next(columns)
//        ensureRecords(columns, record)
//      } catch {
//        case e: CompletedReaderException => inLoop = false
//      }
//    }
//  }
//
//
//  test("test tiktok report AuctionBasicAdPageEvent ") {
//
//    val reader = getReader(ReportType.AuctionBasicAdPageEvent)
//    val columns = reader.detectTableSchema().columns
//    var inLoop = true
//    while (reader.hasNext() && inLoop) {
//      try {
//        val record = reader.next(columns)
//        ensureRecords(columns, record)
//      } catch {
//        case e: CompletedReaderException => inLoop = false
//      }
//    }
//  }
//
//  test("test tiktok report AuctionBasicAdVideoPlay ") {
//
//    val reader = getReader(ReportType.AuctionBasicAdVideoPlay)
//    val columns = reader.detectTableSchema().columns
//    var inLoop = true
//    while (reader.hasNext() && inLoop) {
//      try {
//        val record = reader.next(columns)
//        ensureRecords(columns, record)
//      } catch {
//        case e: CompletedReaderException => inLoop = false
//      }
//    }
//  }
//
//  test("test tiktok report AuctionBasicAdgroupData") {
//    val reader = getReader(ReportType.AuctionBasicAdgroupData)
//    val columns = reader.detectTableSchema().columns
//    var inLoop = true
//    while (reader.hasNext() && inLoop) {
//      try {
//        val record = reader.next(columns)
//        ensureRecords(columns, record)
//      } catch {
//        case e: CompletedReaderException => inLoop = false
//      }
//    }
//  }
//
//  test("test tiktok report AuctionBasicAdgroupEngagement") {
//    val reader = getReader(ReportType.AuctionBasicAdgroupEngagement)
//    val columns = reader.detectTableSchema().columns
//    var inLoop = true
//    while (reader.hasNext() && inLoop) {
//      try {
//        val record = reader.next(columns)
//        ensureRecords(columns, record)
//      } catch {
//        case e: CompletedReaderException => inLoop = false
//      }
//    }
//  }
//
//  test("test tiktok report AuctionBasicAdgroupInAppEvent") {
//    val reader = getReader(ReportType.AuctionBasicAdgroupInAppEvent)
//    val columns = reader.detectTableSchema().columns
//    var inLoop = true
//    while (reader.hasNext() && inLoop) {
//      try {
//        val record = reader.next(columns)
//        ensureRecords(columns, record)
//      } catch {
//        case e: CompletedReaderException => inLoop = false
//      }
//    }
//  }
//
//  test("test tiktok report AuctionBasicCampaignData") {
//    val reader = getReader(ReportType.AuctionBasicCampaignData)
//    val columns = reader.detectTableSchema().columns
//    var inLoop = true
//    while (reader.hasNext() && inLoop) {
//      try {
//        val record = reader.next(columns)
//        ensureRecords(columns, record)
//      } catch {
//        case e: CompletedReaderException => inLoop = false
//      }
//    }
//  }
//
//  test("test tiktok report AuctionBasicCampaignEngagement") {
//    val reader = getReader(ReportType.AuctionBasicCampaignEngagement)
//    val columns = reader.detectTableSchema().columns
//    var inLoop = true
//    while (reader.hasNext() && inLoop) {
//      try {
//        val record = reader.next(columns)
//        ensureRecords(columns, record)
//      } catch {
//        case e: CompletedReaderException => inLoop = false
//      }
//    }
//  }
//
//  test("test tiktok report AuctionBasicCampaignInAppEvent") {
//    val reader = getReader(ReportType.AuctionBasicCampaignInAppEvent)
//    val columns = reader.detectTableSchema().columns
//    var inLoop = true
//    while (reader.hasNext() && inLoop) {
//      try {
//        val record = reader.next(columns)
//        ensureRecords(columns, record)
//      } catch {
//        case e: CompletedReaderException => inLoop = false
//      }
//    }
//  }
//
//  test("test tiktok report AuctionBasicCampaignOnsiteEvent") {
//    val reader = getReader(ReportType.AuctionBasicCampaignOnsiteEvent)
//    val columns = reader.detectTableSchema().columns
//    var inLoop = true
//    while (reader.hasNext() && inLoop) {
//      try {
//        val record = reader.next(columns)
//        ensureRecords(columns, record)
//      } catch {
//        case e: CompletedReaderException => inLoop = false
//      }
//    }
//  }
//
//  test("test tiktok report AuctionBasicCampaignPageEvent") {
//    val reader = getReader(ReportType.AuctionBasicCampaignPageEvent)
//    val columns = reader.detectTableSchema().columns
//    var inLoop = true
//    while (reader.hasNext() && inLoop) {
//      try {
//        val record = reader.next(columns)
//        ensureRecords(columns, record)
//      } catch {
//        case e: CompletedReaderException => inLoop = false
//      }
//    }
//  }
//
//  test("test tiktok report AuctionBasicCampaignVideoPlay") {
//    val reader = getReader(ReportType.AuctionBasicCampaignVideoPlay)
//    val columns = reader.detectTableSchema().columns
//    var inLoop = true
//    while (reader.hasNext() && inLoop) {
//      try {
//        val record = reader.next(columns)
//        ensureRecords(columns, record)
//      } catch {
//        case e: CompletedReaderException => inLoop = false
//      }
//    }
//  }
//
//  def getReader(reportType: ReportType): Reader = {
//    val reader = new TikTokAdsReaderFactory(ZConfig.getString("tiktok_ads.base_url"))
//      .create(tikTokSource, job.copy(tikTokReport = Some(report.copy(reportType = reportType))))
//    reader
//  }
//
//}
