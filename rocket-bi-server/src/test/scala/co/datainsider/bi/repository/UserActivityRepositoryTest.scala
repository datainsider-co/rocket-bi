package co.datainsider.bi.repository

import co.datainsider.bi.module.{TestContainerModule, TestModule}
import co.datainsider.bi.util.tracker.{ActionType, ResourceType, UserActivityEvent}
import co.datainsider.caas.user_profile.domain.Implicits.FutureEnhanceLike
import co.datainsider.schema.module.MockSchemaClientModule
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}

class UserActivityRepositoryTest extends IntegrationTest {
  override protected def injector: Injector =
    TestInjector(TestModule, MockSchemaClientModule, TestContainerModule).newInstance()

  private val userActivityRepository = injector.instance[UserActivityRepository]

  private val orgId = 0

  test("test insert activities") {
    val numRowInserted: Int = userActivityRepository
      .insert(
        Seq(
          UserActivityEvent(
            timestamp = System.currentTimeMillis(),
            orgId = orgId,
            username = "root",
            actionName = "CreateDashboardRequest",
            actionType = ActionType.Create,
            resourceType = ResourceType.Dashboard,
            resourceId = "1",
            remoteHost = "127.0.0.1",
            remoteAddress = "localhost",
            method = "POST",
            path = "/api/dashboard/create",
            param = "",
            statusCode = 200,
            requestSize = 100,
            requestContent = "{\"name\": \"new dashboard\"}",
            responseSize = 110,
            responseContent = "{\"id\": 0, \"name\": \"new dashboard\"}",
            execTimeMs = 50,
            message = "create new dashboard with name \"new dashboard\""
          )
        )
      )
      .syncGet()

    assert(numRowInserted > 0)
  }

  test("test count user activities") {
    val total: Long = userActivityRepository
      .count(
        orgId = orgId,
        startTime = Some(System.currentTimeMillis() - 100000),
        endTime = Some(System.currentTimeMillis() + 100000),
        usernames = Seq("root"),
        actionNames = Seq("CreateDashboardRequest"),
        actionTypes = Seq(ActionType.Create),
        resourceTypes = Seq(ResourceType.Dashboard),
        statusCodes = Seq(200)
      )
      .syncGet()

    assert(total > 0)
  }

  test("test list user activities") {
    val activities: Seq[UserActivityEvent] = userActivityRepository
      .list(
        orgId = orgId,
        startTime = Some(System.currentTimeMillis() - 100000),
        endTime = Some(System.currentTimeMillis() + 100000),
        usernames = Seq("root"),
        actionNames = Seq("CreateDashboardRequest"),
        actionTypes = Seq(ActionType.Create),
        resourceTypes = Seq(ResourceType.Dashboard),
        statusCodes = Seq(200),
        from = 0,
        size = 10
      )
      .syncGet()

    assert(activities.nonEmpty)
  }

}
