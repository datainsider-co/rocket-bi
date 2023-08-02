package co.datainsider.datacook.service

import co.datainsider.bi.module.{TestContainerModule, TestModule}
import co.datainsider.caas.user_profile.controller.http.filter.parser.MockUserContext
import co.datainsider.caas.user_profile.module.MockCaasClientModule
import co.datainsider.datacook.domain.EtlJob
import co.datainsider.datacook.domain.Ids.EtlJobId
import co.datainsider.datacook.domain.MockData._
import co.datainsider.datacook.domain.request.etl._
import co.datainsider.datacook.domain.response.EtlJobResponse
import co.datainsider.datacook.engine.DiTestInjector
import co.datainsider.datacook.module.{DataCookSqlScriptModule, TestDataCookModule}
import co.datainsider.schema.domain.PageResult
import co.datainsider.schema.module.{MockSchemaClientModule, SchemaModule}
import com.fasterxml.jackson.databind.node.JsonNodeFactory
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import datainsider.client.domain.scheduler.{NoneSchedule, ScheduleOnce}
import org.scalatest.BeforeAndAfterAll

/**
  * @author tvc12 - Thien Vi
  */
class ETLServiceTest extends IntegrationTest with BeforeAndAfterAll {
  override protected val injector: Injector = TestInjector(
    TestModule,
    TestContainerModule,
    SchemaModule,
    MockCaasClientModule,
    MockSchemaClientModule,
    TestDataCookModule
  ).create
  private val jobService = injector.instance[ETLService]
  private val orgId = 31L
  private val baseRequest = MockUserContext.getLoggedInRequest(orgId, "tvc12")
  var jobId: Long = 0L

  override def beforeAll(): Unit = {
    super.beforeAll()
    DataCookSqlScriptModule.singletonPostWarmupComplete(injector)
  }

  override def afterAll(): Unit = {
    super.afterAll()
    val trashService = injector.instance[TrashETLService]
    await(trashService.hardDelete(orgId, jobId))
  }

  test("Create etl job") {
    val request = new CreateEtlJobRequest(
      displayName = mockEtlJob.displayName,
      mockEtlJob.operators,
      Some(NoneSchedule()),
      request = baseRequest
    )

    val etlJob: EtlJobResponse = await(jobService.create(orgId, request))

    println(s"Create etl job:: ${etlJob}")

    assert(etlJob.displayName.equals(mockEtlJob.displayName))
    assert(etlJob.scheduleTime.equals(NoneSchedule()))
    jobId = etlJob.id
  }

  test("List etl job") {
    val request = ListEtlJobsRequest(keyword = mockEtlJob.displayName, request = baseRequest)

    val results: PageResult[EtlJobResponse] = await(jobService.listEtlJobs(orgId, request))
    println(s"List etl job size:: ${results.total}")
    assert(results.data.nonEmpty)
    assert(results.data.exists(_.displayName.equals(mockEtlJob.displayName)))
    val etlJob = results.data.find(_.displayName.equals(mockEtlJob.displayName)).get

    assert(etlJob.displayName.equals(mockEtlJob.displayName))
    assert(etlJob.scheduleTime.equals(NoneSchedule()))
    assert(etlJob.id.equals(jobId))
  }

  test("List etl shared job") {
    val request = ListEtlJobsRequest(keyword = mockEtlJob.displayName, request = baseRequest)

    val results: PageResult[EtlJobResponse] = await(jobService.listSharedEtlJobs(orgId, request))
    assert(results.data.isEmpty)
  }

  test("Update etl job") {
    val node = JsonNodeFactory.instance.objectNode()
    node.put("username", "1234")
    val request = UpdateEtlJobRequest(
      id = jobId,
      displayName = Some("Hello"),
      operators = Some(Array(mockOperator)),
      scheduleTime = Some(NoneSchedule()),
      extraData = Some(node),
      request = baseRequest
    )

    val etlJob: EtlJobResponse = await(jobService.update(orgId, request))

    println(s"Update etl job:: ${etlJob}")

    assert(etlJob.displayName.equals(request.displayName.get))
    assert(etlJob.scheduleTime.equals(request.scheduleTime.get))
    assert(etlJob.id.equals(jobId))
  }

  test("Get next job") {
    val job = await(jobService.getJob(orgId, jobId))
    println(s"run time: ${System.currentTimeMillis() - job.nextExecuteTime}")
    val etlJob: Option[EtlJob] = await(jobService.getNextJob)
    println(etlJob.orNull)
  }

  test("Get etl job") {

    val etlJob: EtlJobResponse = await(jobService.get(orgId, jobId))

    println(s"Get etl job ${etlJob}")

    assert(etlJob.displayName.equals("Hello"))
    assert(etlJob.scheduleTime.equals(NoneSchedule()))
    assert(etlJob.id.equals(jobId))
  }

  test("Soft Delete etl job") {

    val etlJob: EtlJobResponse = await(jobService.softDelete(orgId, jobId))

    println(etlJob.extraData)

    assert(etlJob.displayName.equals("Hello"))
    assert(etlJob.scheduleTime.equals(NoneSchedule()))
    assert(etlJob.id.equals(jobId))
  }
}
