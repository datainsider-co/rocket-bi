package co.datainsider.bi.repository

import co.datainsider.bi.module.TestModule
import co.datainsider.query.DbTestUtils
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import datainsider.client.domain.Implicits.FutureEnhanceLike
import datainsider.tracker.{ActionType, ResourceType, UserActivityEvent}

class UserActivityRepositoryTest extends IntegrationTest {
  override protected def injector: Injector = TestInjector(TestModule).newInstance()

  private val userActivityRepository = injector.instance[UserActivityRepository]

  override def beforeAll(): Unit = {
    super.beforeAll()
    DbTestUtils.setupActivityTbl()
  }

  test("test insert activities") {
    val numRowInserted: Int = userActivityRepository
      .insert(
        Seq(
          UserActivityEvent(
            timestamp = System.currentTimeMillis(),
            orgId = 0,
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
            executionTime = 50,
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
        0,
        Some(System.currentTimeMillis() - 100000),
        Some(System.currentTimeMillis() + 100000),
        Seq("root"),
        Seq("CreateDashboardRequest"),
        Seq(ActionType.Create),
        Seq(ResourceType.Dashboard),
        Seq(200)
      )
      .syncGet()

    assert(total > 0)
  }

  test("test list user activities") {
    val activities: Seq[UserActivityEvent] = userActivityRepository
      .list(
        0,
        Some(System.currentTimeMillis() - 100000),
        Some(System.currentTimeMillis() + 100000),
        Seq("root"),
        Seq("CreateDashboardRequest"),
        Seq(ActionType.Create),
        Seq(ResourceType.Dashboard),
        Seq(200),
        0,
        10
      )
      .syncGet()

    assert(activities.nonEmpty)
  }

}
