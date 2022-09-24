package co.datainsider.bi.repository

import co.datainsider.bi.domain.query.event.{ActionType, ResourceType, UserActivityEvent}
import co.datainsider.bi.module.TestModule
import co.datainsider.query.DbTestUtils
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import datainsider.client.domain.Implicits.FutureEnhanceLike

class UserActivityRepositoryTest extends IntegrationTest {
  override protected def injector: Injector = TestInjector(TestModule).newInstance()

  private val userActivityRepository = injector.instance[UserActivityRepository]

  override def beforeAll(): Unit = {
    super.beforeAll()
    DbTestUtils.setupActivityTbl()
  }

  override def afterAll(): Unit = {
    super.afterAll()
    DbTestUtils.cleanUpActivityTbl()
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

    assert(total != 0)
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
