package datainsider.jobworker.service

import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import com.twitter.util.Future
import datainsider.client.module.MockSchemaClientModule
import datainsider.client.service.{MockSchemaClientService, SchemaClientService}
import datainsider.client.util.JsonParser
import datainsider.jobworker.domain._
import datainsider.jobworker.domain.job.{GaDateRange, GaDimension, GaJob, GaMetric}
import datainsider.jobworker.module.TestModule
import datainsider.jobworker.service.worker.GaWorker
import datainsider.jobworker.util.ZConfig
import education.x.commons.SsdbKVS
import org.nutz.ssdb4j.spi.SSDB

/**
  * Created by phg on 4/1/21.
 **/
class GaWorkerTest extends IntegrationTest {

  override protected def injector: Injector = TestInjector(TestModule, MockSchemaClientModule).newInstance()
  val schemaService: SchemaClientService = injector.instance[MockSchemaClientService]

  val mockDatabaseName: String = ZConfig.getString("fake_data.database.default.name", default = "database_test")
  val ssdbKVS: SsdbKVS[Long, Boolean] = SsdbKVS[Long, Boolean]("test_worker", injector.instance[SSDB])

  val job: GaJob = GaJob(
    1,
    jobId = 2,
    sourceId = 0L,
    lastSuccessfulSync = 0L,
    syncIntervalInMn = 0,
    lastSyncStatus = JobStatus.Init,
    currentSyncStatus = JobStatus.Queued,
    destDatabaseName = mockDatabaseName,
    destTableName = "tbl",
    destinations = Seq.empty,
    viewId = "ga:266810312",
    dateRanges = Array(GaDateRange(startDate = "2021-01-01", endDate = "today")),
    metrics = Array(
      GaMetric(expression = "ga:sessions", alias = "sessions", dataType = "int32"),
      GaMetric(expression = "ga:users", alias = "users", dataType = "int32")
    ),
    dimensions = Array(
      GaDimension(name = "ga:source", histogramBuckets = Array()),
      GaDimension(name = "ga:medium", histogramBuckets = Array())
    ),
    sorts = Seq("-ga:sessions"), // minus sign (-) for DESCENDING order
    accessToken =
      "ya29.a0AVA9y1slmqxkBjH9fTwzoNxqjWMoLsAUTEpR_tV30sx4EOZprjf_4pBvw95iHgN81XT9UL3yY3P8Eg5ALYIYYsneLNYuQOUgaK_pc1rmVqTHZqrxCJNu5IThgbGq_g6GSEmX-PEpds4wLpyp-sIDe9j4lW5waCgYKATASAQASFQE65dr8xUevrobXe04sXT8uFxnIaA0163",
    refreshToken =
      "1//0gJ0EQUhDd-BKCgYIARAAGBASNwF-L9IrxrzAheEQGTPu20Og5fIL6wne1-g6ORXm_p43NOMADsZ1gKvc6cR1VBnhiJkd6uuiazU"
  )

  val worker: GaWorker = GaWorker(
    schemaService,
    ssdbKVS = ssdbKVS,
    300000,
    300000
  )

  test("Test connect") {
    assert(worker.testConnection(job))
  }

  test("Google Analytics worker") {
    val finalProgress: JobProgress = worker.run(job, 1, onProgress)
    println(s"finalProgress ${finalProgress}")
    assert(finalProgress.jobStatus == JobStatus.Synced)
  }

  def onProgress(progress: JobProgress): Future[Unit] = {
    println(s"onProgress:: ${progress}")
    Future.Unit
  }
}
