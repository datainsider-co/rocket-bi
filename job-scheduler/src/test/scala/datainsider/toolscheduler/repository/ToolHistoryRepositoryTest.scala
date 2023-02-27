package datainsider.toolscheduler.repository

import com.twitter.inject.{Injector, IntegrationTest}
import com.twitter.inject.app.TestInjector
import datainsider.client.domain.Implicits.FutureEnhanceLike
import datainsider.client.module.{MockCaasClientModule, MockSchemaClientModule}
import datainsider.jobscheduler.module.TestModule
import datainsider.toolscheduler.domain.{ToolJobHistory, ToolJobStatus, ToolJobType}
import datainsider.toolscheduler.module.ToolTestModule
import datainsider.toolscheduler.repository.ToolHistoryRepository

class ToolHistoryRepositoryTest extends IntegrationTest {
  override protected def injector: Injector =
    TestInjector(TestModule, ToolTestModule, MockCaasClientModule, MockSchemaClientModule).newInstance()

  private val toolHistoryRepository = injector.instance[ToolHistoryRepository]

  val orgId = 0L
  var runId = 0L

  private val history = ToolJobHistory(
    orgId = orgId,
    jobId = 1,
    jobName = "job_history",
    jobType = ToolJobType.DataVerification,
    jobStatus = ToolJobStatus.Init,
    jobData = Map("job_data" -> "some job data"),
    historyData = Map("history_data" -> "some history data"),
    beginAt = 0L,
    endAt = 1L,
    message = "some message"
  )

  test("test create history") {
    val createdId = toolHistoryRepository.create(history).syncGet
    assert(createdId != 0)

    runId = createdId
  }

  test("test list histories") {
    val histories = toolHistoryRepository.list(orgId, "", 0, 10, Seq.empty).syncGet()
    assert(histories.nonEmpty)
  }

  test("test count histories") {
    val total = toolHistoryRepository.count(orgId, "").syncGet()
    assert(total > 0)
  }

  test("test update history") {
    val updatedOk = toolHistoryRepository
      .update(history.copy(runId = runId, jobStatus = ToolJobStatus.Running, endAt = 100))
      .syncGet()
    assert(updatedOk)
  }

  test("test get updated history") {
    val history = toolHistoryRepository.get(orgId, runId).syncGet()
    assert(history.isDefined)
    assert(history.get.jobStatus == ToolJobStatus.Running)
    assert(history.get.endAt == 100)
  }

}
