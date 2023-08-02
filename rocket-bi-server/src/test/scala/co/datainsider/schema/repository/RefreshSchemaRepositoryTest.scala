package co.datainsider.schema.repository

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.module.TestContainerModule
import co.datainsider.schema.domain.RefreshSchemaHistory
import co.datainsider.schema.service.{RefreshSchemaStage, StageStatus}
import com.google.inject.name.Names
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}

/**
  * created 2023-06-01 12:03 PM
  *
  * @author tvc12 - Thien Vi
  */
class RefreshSchemaRepositoryTest extends IntegrationTest {
  override protected def injector: Injector = TestInjector(TestContainerModule).create
  val client = injector.instance[JdbcClient](Names.named("mysql"))
  val repository = new RefreshSchemaHistoryRepositoryImpl(client)
  val orgId = 1L
  var id = 1L

  test("Ensure schema should be successful") {
    await(repository.ensureSchema())
  }

  test("Insert history success") {
    val history = new RefreshSchemaHistory(
      orgId = orgId,
      id = 1,
      status = StageStatus.Terminated,
      isFirstRun = true,
      stages = Seq.empty
    )
    val newHistory = await(repository.insert(orgId, history))
    assert(newHistory.orgId == orgId)
    assert(newHistory.stages == Seq.empty)
    assert(newHistory.status == StageStatus.Terminated)
    assert(newHistory.isFirstRun == true)
    id = newHistory.id
  }

  test("Update history success") {
    val oldHistory = new RefreshSchemaHistory(
      orgId = orgId,
      id = id,
      isFirstRun = false,
      stages = Seq(RefreshSchemaStage(orgId = 1, name = "test", status = StageStatus.Running))
    )
    val newHistory = await(repository.update(orgId, oldHistory))
    assert(newHistory.orgId == orgId)
    assert(newHistory.stages == oldHistory.stages)
    assert(newHistory.status == oldHistory.status)
    assert(newHistory.isFirstRun == false)
  }

  test("get latest history success") {
    val history = await(repository.getLatestHistory(orgId))
    assert(history.isDefined)
    assert(history.get.orgId == orgId)
    assert(history.get.id == id)
    assert(history.get.status == StageStatus.Running)
  }

}
