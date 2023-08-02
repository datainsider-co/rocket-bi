package co.datainsider.jobscheduler.repository

import co.datainsider.bi.module.TestContainerModule
import co.datainsider.caas.user_profile.module.MockCaasClientModule
import co.datainsider.jobscheduler.domain.JobHistory
import co.datainsider.jobscheduler.domain.job.JobStatus
import co.datainsider.jobscheduler.module.JobScheduleTestModule
import com.google.inject.name.Names
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import org.scalatest.BeforeAndAfterAll

class HistoryRepositoryTest extends IntegrationTest with BeforeAndAfterAll {
  override protected def injector: Injector = TestInjector(JobScheduleTestModule, TestContainerModule, MockCaasClientModule).newInstance()

  val historyRepository: JobHistoryRepository = injector.instance[JobHistoryRepository]
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
  var syncId: Long = -1
  var jobId: Long = 1

  override def beforeAll(): Unit = {
    await(injector.instance[SchemaManager](Names.named("history-schema")).ensureSchema())
  }

  test("create job history") {
    syncId = await(historyRepository.insert(1, history))
  }

  test("test get history by id") {
    val queriedHistory: Option[JobHistory] = await(historyRepository.get(syncId))
    assert(queriedHistory.isDefined)
  }

  test("get job history") {
    val histories = await(historyRepository.get(1, 0, 10, Seq.empty, None))
    assert(histories.nonEmpty)
  }

  test("get with sync status job history") {
    val histories = await(historyRepository.getWith(List(JobStatus.Queued), 0, 10))
    assert(histories.nonEmpty)
  }

  test("get queued history") {
    val histories = await(historyRepository.getQueuedHistories(Seq(history.jobId)))
    assert(histories.nonEmpty)
  }

  test("update job history") {
    assert(await(historyRepository.update(history.copy(syncId = syncId, syncStatus = JobStatus.Syncing))))
  }

  test("delete job history") {
    assert(await(historyRepository.delete(id = syncId)))
  }

}
