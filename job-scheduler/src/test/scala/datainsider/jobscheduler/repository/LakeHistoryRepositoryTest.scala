package datainsider.jobscheduler.repository

import com.google.inject.name.Names
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import com.twitter.util.Await
import datainsider.client.module.{MockCaasClientModule, SchemaClientModule}
import datainsider.jobscheduler.domain.job.JobStatus
import datainsider.jobscheduler.module.TestModule
import datainsider.lakescheduler.domain.LakeJobHistory
import datainsider.lakescheduler.domain.job.LakeJobStatus
import datainsider.lakescheduler.module.LakeTestModule
import datainsider.lakescheduler.repository.LakeHistoryRepository
import org.scalatest.BeforeAndAfterAll

class LakeHistoryRepositoryTest extends IntegrationTest with BeforeAndAfterAll {
  override protected def injector: Injector = TestInjector(TestModule, LakeTestModule, SchemaClientModule, MockCaasClientModule).newInstance()
  val historyRepo: LakeHistoryRepository = injector.instance[LakeHistoryRepository]

  override def beforeAll(): Unit = {
    Await.result(injector.instance[SchemaManager](Names.named("lake-history-schema")).ensureSchema())
  }

  var runId: Long = -1
  val history: LakeJobHistory =
    LakeJobHistory(
      jobId = 1,
      jobName = "job",
      yarnAppId = "",
      startTime = System.currentTimeMillis(),
      updatedTime = System.currentTimeMillis(),
      endTime = System.currentTimeMillis(),
      jobStatus = LakeJobStatus.Queued,
      message = ""
    )
  test("create job history") {
    runId = Await.result(historyRepo.insert(1, history))
  }

  test("test get history by id") {
    val queriedHistory: Option[LakeJobHistory] = Await.result(historyRepo.get(runId))
    assert(queriedHistory.isDefined)
  }

  test("get job history") {
    val histories = Await.result(historyRepo.get(1, "", 0, 10, Seq.empty))
    assert(histories.nonEmpty)
  }

  test("get with sync status job history") {
    val histories = Await.result(historyRepo.getWith(List(JobStatus.Queued), 0, 10))
    assert(histories.nonEmpty)
  }

  test("update job history") {
    assert(Await.result(historyRepo.update(history.copy(runId = runId, jobStatus = LakeJobStatus.Running))))
  }

  test("delete job history") {
    assert(Await.result(historyRepo.delete(id = runId)))
  }
}
