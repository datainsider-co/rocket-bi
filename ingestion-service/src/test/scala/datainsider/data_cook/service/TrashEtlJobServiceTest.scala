package datainsider.data_cook.service

import com.google.inject.name.Names
import com.twitter.inject.{Injector, IntegrationTest}
import datainsider.analytics.module.SqlScriptModule.readSqlScript
import datainsider.client.module.MockCaasClientModule
import datainsider.data_cook.domain.Ids.EtlJobId
import datainsider.data_cook.domain.MockData.mockJob
import datainsider.data_cook.domain.response.EtlJobResponse
import datainsider.data_cook.engine.DiTestInjector
import datainsider.data_cook.module.DataCookTestModule
import datainsider.ingestion.domain.PageResult
import datainsider.ingestion.module.TestModule
import datainsider.ingestion.util.Implicits.FutureEnhance
import org.scalatest.BeforeAndAfterAll

/**
  * @author tvc12 - Thien Vi
  * */
class TrashEtlJobServiceTest extends IntegrationTest with BeforeAndAfterAll {
  private lazy val trashJobService = injector.instance[TrashEtlJobService]

  override protected val injector: Injector = DiTestInjector(DataCookTestModule, TestModule, MockCaasClientModule).newInstance()
  val etlJobService: EtlJobService = injector.instance[EtlJobService]

  override def beforeAll(): Unit = {
    super.beforeAll()
    val etlJob = etlJobService.create(mockJob.copy(ownerId = "test")).syncGet()
    etlJobService.softDelete(etlJob.organizationId, etlJob.id)
  }

  var jobId: EtlJobId = 0
  test("List Trash of etl job") {
    val request = new MockListEtlJobsRequest

    val results: PageResult[EtlJobResponse] = await(trashJobService.listEtlJobs(organizationId = 2, request))

    val etlJob = results.data.head

    println(etlJob)

    assert(etlJob.displayName.equals(mockJob.displayName))
    assert(etlJob.scheduleTime.equals(mockJob.scheduleTime))
    jobId = etlJob.id
    println(jobId)
  }

  test("Hard delete etl job") {
    val etlJob: EtlJobResponse = await(trashJobService.hardDelete(organizationId = 2, jobId))

    assert(etlJob.displayName.equals(mockJob.displayName))
    assert(etlJob.scheduleTime.equals(mockJob.scheduleTime))
  }
  test("Restore etl job") {
    val etlJob = etlJobService.create(mockJob.copy(ownerId = "test")).syncGet()
    etlJobService.softDelete(etlJob.organizationId, etlJob.id)

    val etlJobResponse: EtlJobResponse = await(trashJobService.restore(organizationId = 2, etlJob.id))
    val result = await(etlJobService.get(2, etlJob.id))
    println(etlJob.id)

    assert(result.displayName.equals(mockJob.displayName))
    assert(result.scheduleTime.equals(mockJob.scheduleTime))

    etlJobService.softDelete(2, etlJob.id)
    trashJobService.hardDelete(2, etlJob.id)
  }
}
