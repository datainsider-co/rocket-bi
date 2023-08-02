package co.datainsider.datacook.service

import co.datainsider.bi.module.{TestContainerModule, TestModule}
import co.datainsider.caas.user_profile.controller.http.filter.parser.MockUserContext
import co.datainsider.caas.user_profile.domain.Implicits.FutureEnhanceLike
import co.datainsider.caas.user_profile.module.MockCaasClientModule
import co.datainsider.datacook.domain.Ids.EtlJobId
import co.datainsider.datacook.domain.MockData.mockJob
import co.datainsider.datacook.domain.request.etl._
import co.datainsider.datacook.domain.response.EtlJobResponse
import co.datainsider.datacook.engine.DiTestInjector
import co.datainsider.datacook.module.TestDataCookModule
import co.datainsider.schema.domain.PageResult
import co.datainsider.schema.module.{MockSchemaClientModule, SchemaModule}
import com.twitter.inject.{Injector, IntegrationTest}
import org.scalatest.BeforeAndAfterAll

/**
  * @author tvc12 - Thien Vi
  */
class TrashETLServiceTest extends IntegrationTest with BeforeAndAfterAll {

  override protected val injector: Injector =
    DiTestInjector(TestDataCookModule, TestModule, SchemaModule, MockCaasClientModule, TestContainerModule, MockSchemaClientModule).newInstance()
  private val etlService: ETLService = injector.instance[ETLService]
  private val trashService = injector.instance[TrashETLService]

  override def beforeAll(): Unit = {
    super.beforeAll()
    val etlJob = etlService.create(mockJob.copy(ownerId = "test")).syncGet()
    etlService.softDelete(etlJob.organizationId, etlJob.id)
  }

  var jobId: EtlJobId = 0
  test("List Trash of etl job") {
    val request = new ListEtlJobsRequest(request = MockUserContext.getLoggedInRequest(2L, "test"))

    val results: PageResult[EtlJobResponse] = await(trashService.listEtlJobs(organizationId = 2, request))

    val etlJob = results.data.head

    println(etlJob)

    assert(etlJob.displayName.equals(mockJob.displayName))
    assert(etlJob.scheduleTime.equals(mockJob.scheduleTime))
    jobId = etlJob.id
    println(jobId)
  }

  test("Hard delete etl job") {
    val etlJob: EtlJobResponse = await(trashService.hardDelete(organizationId = 2, jobId))

    assert(etlJob.displayName.equals(mockJob.displayName))
    assert(etlJob.scheduleTime.equals(mockJob.scheduleTime))
  }
  test("Restore etl job") {
    val etlJob = etlService.create(mockJob.copy(ownerId = "test")).syncGet()
    etlService.softDelete(etlJob.organizationId, etlJob.id)

    val etlJobResponse: EtlJobResponse = await(trashService.restore(organizationId = 2, etlJob.id))
    val result = await(etlService.get(2, etlJob.id))
    println(etlJob.id)

    assert(result.displayName.equals(mockJob.displayName))
    assert(result.scheduleTime.equals(mockJob.scheduleTime))

    etlService.softDelete(2, etlJob.id)
    trashService.hardDelete(2, etlJob.id)
  }
}
