package co.datainsider.bi.repository

import co.datainsider.bi.domain.query.TableField
import co.datainsider.bi.module.TestModule
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}

/**
  * @author tvc12 - Thien Vi
  * @created 09/13/2021 - 8:14 PM
  */
class DashboardFieldRepositoryTest extends IntegrationTest {
  override protected def injector: Injector = TestInjector(TestModule).newInstance()

  private lazy val dashboardFieldRepository: DashboardFieldRepository = injector.instance[DashboardFieldRepository]
  private lazy val dashboardId = -100;
  private lazy val field = TableField("animal", "cats", "name", "String");
  private lazy val field2 = TableField("animal", "cats", "name1", "String");

  val schemaManager: SchemaManager = injector.instance[SchemaManager]

  override def beforeAll(): Unit = {
    await(schemaManager.ensureDatabase())
  }

  test("Multi add") {
    // remove all
    await(dashboardFieldRepository.deleteFields(dashboardId))
    // multi add
    await(dashboardFieldRepository.setFields(dashboardId, Seq(field, field2)))
    // check again
    val allFields = await(dashboardFieldRepository.getFields(dashboardId))
    assertResult(2)(allFields.size)
    println(allFields)
  }

  test("List all fields") {
    // remove all
    await(dashboardFieldRepository.deleteFields(dashboardId))
    //
    // insert fields
    await(dashboardFieldRepository.setFields(dashboardId, Seq(field)))
    // check
    val results = await(dashboardFieldRepository.getFields(dashboardId))
    assertResult(true)(results.nonEmpty)
    assertResult(1)(results.size)
    val currentField = results.head
    assertResult(currentField)(field)
    println(results)
  }


  test("Delete all fields") {
    // insert fields
    await(dashboardFieldRepository.setFields(dashboardId, Seq(field)))
    // remove all
    val result = await(dashboardFieldRepository.deleteFields(dashboardId))
    assertResult(true)(result)
    // check again
    val allFields = await(dashboardFieldRepository.getFields(dashboardId))
    assertResult(0)(allFields.size)
  }

  override def afterAll(): Unit = {
    // remove all
    await(dashboardFieldRepository.deleteFields(dashboardId))
  }
}
