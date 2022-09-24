package datainsider.data_cook.service

import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import datainsider.client.module.MockCaasClientModule
import datainsider.data_cook.domain.Ids.{EtlJobId, ShareId, UserId}
import datainsider.data_cook.domain.MockData.{mockJob, mockListSharedEtlJobs}
import datainsider.data_cook.domain.request.EtlRequest.ListEtlJobsRequest
import datainsider.data_cook.domain.request.ShareRequest.{ListSharedUserRequest, RevokeShareRequest, ShareEtlToUsersRequest, UpdateShareRequest}
import datainsider.data_cook.domain.response.EtlJobResponse
import datainsider.data_cook.engine.DiTestInjector
import datainsider.data_cook.module.DataCookTestModule
import datainsider.data_cook.repository.{EtlJobRepository, ShareEtlJobRepository}
import datainsider.ingestion.domain.{PageResult, ResourceInfo}
import datainsider.ingestion.module.TestModule
import org.scalatest.BeforeAndAfterAll

/**
  * @author tvc12 - Thien Vi
  * @created 09/22/2021 - 2:16 PM
  */
class EtlShareServiceTest extends IntegrationTest with BeforeAndAfterAll{
  private lazy val shareService = injector.instance[EtlShareService]

  override protected val injector: Injector = DiTestInjector(DataCookTestModule, TestModule, MockCaasClientModule).newInstance()
  val etlJobRepo: EtlJobRepository = injector.instance[EtlJobRepository]

  var jobId: EtlJobId = 0
  var shareId = ""
  override def beforeAll(): Unit = {
    super.beforeAll()
    jobId = await(etlJobRepo.insert(mockJob))
  }

  override def afterAll(): Unit = {
    super.afterAll()
    await(etlJobRepo.delete(2, jobId))
    await(injector.instance[ShareEtlJobRepository].delete(shareId))
  }

  test("Share etl job") {
    val request = new MockShareEtlToUsersRequest(jobId, Map("test" -> Seq("edit")))
    val result = await(shareService.share(2, request))
    println(result)
    assert(result.getOrElse("test", false).equals(true))
  }

  test("List ETL Share with me") {
    val request = new MockListEtlJobsRequest

    val results: PageResult[EtlJobResponse] = await(shareService.listSharedEtlJobs(organizationId = 2, request))

    println(results.data)
    println(results.data)

    assert(results.total > 0)
    assert(results.data.head.id.equals(jobId))
  }

  test("List Shared User of etl") {
    val request = ListSharedUserRequest(id = jobId)
    val resourceInfo: ResourceInfo = await(shareService.listSharedUsers(organizationId = 2, request))

    assertResult(true)(resourceInfo != null)
    assertResult(true)(resourceInfo.owner.isDefined)
    assertResult(true)(resourceInfo.totalUserSharing == 1)
    assertResult(true)(resourceInfo.usersSharing.nonEmpty)

    shareId = resourceInfo.usersSharing.head.id
  }

  test("Update Share") {
    val request = UpdateShareRequest(jobId, Map(shareId -> Seq("view", "edit")))
    val results: Map[ShareId, Boolean] = await(shareService.update(organizationId = 2, request))

    println(results)
    assertResult(Map("test" -> true))(results)

  }
  test("Revoke Share") {
    val request = RevokeShareRequest(jobId, Seq("test", "123"))
    val results: Map[UserId, Boolean] = await(shareService.revoke(organizationId = 2, request))

    println(results)
    assertResult(Map("123" -> true, "test" -> true))(results)
  }
}

class MockShareEtlToUsersRequest(id: EtlJobId, userActions: Map[UserId, Seq[String]])
  extends ShareEtlToUsersRequest(id = id, userActions = userActions) {
  override def currentUsername: String = "hau_test"
}
