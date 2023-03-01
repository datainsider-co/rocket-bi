package datainsider.data_cook.service

import com.fasterxml.jackson.databind.node.JsonNodeFactory
import com.twitter.inject.{Injector, IntegrationTest}
import datainsider.client.domain.scheduler.ScheduleOnce
import datainsider.client.filter.MockUserContext
import datainsider.client.module.MockCaasClientModule
import datainsider.data_cook.domain.EtlJob
import datainsider.data_cook.domain.Ids.EtlJobId
import datainsider.data_cook.domain.MockData._
import datainsider.data_cook.domain.request.EtlRequest.{CreateEtlJobRequest, ListEtlJobsRequest, UpdateEtlJobRequest}
import datainsider.data_cook.domain.response.EtlJobResponse
import datainsider.data_cook.engine.DiTestInjector
import datainsider.data_cook.module.{DataCookTestModule, MockDataCookSqlScriptModule}
import datainsider.ingestion.domain.PageResult
import datainsider.ingestion.module.TestModule
import org.scalatest.BeforeAndAfterAll

/**
  * @author tvc12 - Thien Vi
  * */
class EtlJobServiceTest extends IntegrationTest with BeforeAndAfterAll {
  private lazy val jobService = injector.instance[EtlJobService]

  override protected val injector: Injector = DiTestInjector(DataCookTestModule, TestModule, MockCaasClientModule, MockDataCookSqlScriptModule).newInstance()
  private val baseRequest = MockUserContext.getLoggedInRequest(1L, "test")

  override def afterAll(): Unit = {
    super.afterAll()
    val deletedJobService = injector.instance[TrashEtlJobService]
    deletedJobService.hardDelete(1, jobId)
  }

  var jobId: EtlJobId = 0
  val now: EtlJobId = System.currentTimeMillis()
  test("Create etl job") {
    val request = new CreateEtlJobRequest(displayName = mockEtlJob.displayName, mockEtlJob.operators, Some(ScheduleOnce(now)), request = baseRequest)

    val etlJob: EtlJobResponse = await(jobService.create(organizationId = 1, request))

    println(etlJob)

    assert(etlJob.displayName.equals(mockEtlJob.displayName))
    assert(etlJob.scheduleTime.equals(ScheduleOnce(now)))
    jobId = etlJob.id
  }

  test("List etl job") {
    val request = ListEtlJobsRequest(keyword = mockEtlJob.displayName, request = baseRequest)

    val results: PageResult[EtlJobResponse] = await(jobService.listEtlJobs(organizationId = 1, request))
    val etlJob = results.data.head

    println(etlJob)

    assert(etlJob.displayName.equals(mockEtlJob.displayName))
    assert(etlJob.scheduleTime.equals(ScheduleOnce(now)))
    assert(etlJob.id.equals(jobId))
  }

  test("List etl shared job") {
    val request = ListEtlJobsRequest(keyword = mockEtlJob.displayName, request = baseRequest)

    val results: PageResult[EtlJobResponse] = await(jobService.listSharedEtlJobs(organizationId = 1, request))
    assert(results.data.isEmpty)
  }

  test("Update etl job") {
    val node = JsonNodeFactory.instance.objectNode()
    node.put("username", "1234")
    val request = UpdateEtlJobRequest(
      id = jobId,
      displayName = Some("Hello"),
      operators = Some(Array(mockOperator)),
      scheduleTime = Some(ScheduleOnce(now)),
      extraData = Some(node)
    )

    val etlJob: EtlJobResponse = await(jobService.update(organizationId = 1, request))

    println(etlJob)

    assert(etlJob.displayName.equals(request.displayName.get))
    assert(etlJob.scheduleTime.equals(request.scheduleTime.get))
    assert(etlJob.id.equals(jobId))
  }


  test("Get next job") {
    val job = await(jobService.getJob(1, jobId))
    println(s"run time: ${System.currentTimeMillis() - job.nextExecuteTime}")
    val etlJob: Option[EtlJob] = await(jobService.getNextJob)
    println(etlJob.orNull)
  }

  test("Get etl job") {

    val etlJob: EtlJobResponse = await(jobService.get(organizationId = 1, jobId))

    println(etlJob)

    assert(etlJob.displayName.equals("Hello"))
    assert(etlJob.scheduleTime.equals(ScheduleOnce(now)))
    assert(etlJob.id.equals(jobId))
  }

  test("Soft Delete etl job") {

    val etlJob: EtlJobResponse = await(jobService.softDelete(organizationId = 1, jobId))

    println(etlJob.extraData)

    assert(etlJob.displayName.equals("Hello"))
    assert(etlJob.scheduleTime.equals(ScheduleOnce(now)))
    assert(etlJob.id.equals(jobId))
  }
}
