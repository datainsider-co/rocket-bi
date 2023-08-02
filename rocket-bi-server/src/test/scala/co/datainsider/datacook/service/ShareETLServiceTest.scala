package co.datainsider.datacook.service

import co.datainsider.bi.module.{TestContainerModule, TestModule}
import co.datainsider.caas.user_profile.controller.http.filter.parser.MockUserContext
import co.datainsider.caas.user_profile.module.MockCaasClientModule
import co.datainsider.datacook.domain.Ids.{EtlJobId, ShareId, UserId}
import co.datainsider.datacook.domain.MockData.mockJob
import co.datainsider.datacook.domain.request.etl.ListEtlJobsRequest
import co.datainsider.datacook.domain.request.share._
import co.datainsider.datacook.domain.response.EtlJobResponse
import co.datainsider.datacook.engine.DiTestInjector
import co.datainsider.datacook.module.{DataCookSqlScriptModule, TestDataCookModule}
import co.datainsider.datacook.repository.{ETLRepository, ShareETLRepository}
import co.datainsider.schema.domain.{PageResult, ResourceInfo}
import co.datainsider.schema.module.{MockSchemaClientModule, SchemaModule}
import com.twitter.inject.{Injector, IntegrationTest}
import org.scalatest.BeforeAndAfterAll

/**
  * @author tvc12 - Thien Vi
  * @created 09/22/2021 - 2:16 PM
  */
class ShareETLServiceTest extends IntegrationTest with BeforeAndAfterAll {
  private lazy val shareService = injector.instance[ShareETLService]

  override protected val injector: Injector =
    DiTestInjector(TestDataCookModule, TestContainerModule, TestModule, SchemaModule, MockCaasClientModule, MockSchemaClientModule).newInstance()
  val repository: ETLRepository = injector.instance[ETLRepository]

  var jobId: EtlJobId = 0
  var shareId = ""
  override def beforeAll(): Unit = {
    super.beforeAll()
    DataCookSqlScriptModule.singletonPostWarmupComplete(injector)
    jobId = await(repository.insert(mockJob))
  }

  override def afterAll(): Unit = {
    super.afterAll()
    await(repository.delete(2, jobId))
    await(injector.instance[ShareETLRepository].delete(shareId))
  }

  test("Share etl job") {
    val request = new MockShareEtlToUsersRequest(jobId, Map("test" -> Seq("edit")))
    val result = await(shareService.share(2, request))
    println(result)
    assert(result.getOrElse("test", false).equals(true))
  }

  test("List ETL Share with me") {
    val request = new ListEtlJobsRequest(request = MockUserContext.getLoggedInRequest(2L, "test"))

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
