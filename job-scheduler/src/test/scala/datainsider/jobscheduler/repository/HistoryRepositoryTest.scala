package datainsider.jobscheduler.repository

import com.google.inject.name.Names
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import com.twitter.util.Await
import datainsider.client.module.{MockCaasClientModule, SchemaClientModule}
import datainsider.jobscheduler.domain.JobHistory
import datainsider.jobscheduler.domain.job.JobStatus
import datainsider.jobscheduler.module.TestModule
import datainsider.lakescheduler.module.LakeTestModule
import org.scalatest.BeforeAndAfterAll

class HistoryRepositoryTest extends IntegrationTest with BeforeAndAfterAll {

  override protected def injector: Injector =
    TestInjector(TestModule, LakeTestModule, SchemaClientModule, MockCaasClientModule).newInstance()
  val historyRepository: JobHistoryRepository = injector.instance[JobHistoryRepository]
  override def beforeAll(): Unit = {
    Await.result(injector.instance[SchemaManager](Names.named("history-schema")).ensureSchema())
  }

  var syncId: Long = -1
  var jobId: Long = 1
  val history: JobHistory =
    JobHistory(
      syncId = 0,
      jobId = jobId,
      jobName = "test",
      lastSyncTime = 1000,
      totalSyncedTime = 10000,
      JobStatus.Queued,
      totalRowsInserted = 1000,
      ""
    )
  test("create job history") {
    syncId = Await.result(historyRepository.insert(1, history))
  }

  test("test get history by id") {
    val queriedHistory: Option[JobHistory] = Await.result(historyRepository.get(syncId))
    assert(queriedHistory.isDefined)
  }

  test("get job history") {
    val histories = Await.result(historyRepository.get(1, 0, 10, Seq.empty, None))
    assert(histories.nonEmpty)
  }

  test("get with sync status job history") {
    val histories = Await.result(historyRepository.getWith(List(JobStatus.Queued), 0, 10))
    assert(histories.nonEmpty)
  }

  test("get queued history") {
    val histories = Await.result(historyRepository.getQueuedHistories(Seq(jobId)))
    assert(histories.nonEmpty)
  }

  test("update job history") {
    assert(Await.result(historyRepository.update(history.copy(syncId = syncId, syncStatus = JobStatus.Syncing))))
  }

  test("delete job history") {
    assert(Await.result(historyRepository.delete(id = syncId)))
  }

}
