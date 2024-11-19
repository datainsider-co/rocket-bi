package co.datainsider.bi.repository

import co.datainsider.bi.domain.ClickhouseConnection
import co.datainsider.bi.module.{TestBIClientModule, TestCommonModule, TestContainerModule, TestModule}
import co.datainsider.bi.util.Implicits.FutureEnhance
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}

class ConnectionRepositoryTest extends IntegrationTest {
  override protected def injector: Injector =
    TestInjector(TestModule, TestBIClientModule, TestContainerModule, TestCommonModule).newInstance()

  val orgId: Long = 0
  val connectionRepository: ConnectionRepository = injector.instance[ConnectionRepository]
  val schemaManager: SchemaManager = injector.instance[SchemaManager]

  override def beforeAll(): Unit = {
    super.beforeAll()
    schemaManager.ensureSchema()
  }

  test("test create connection") {
    val newSource = ClickhouseConnection(
      orgId = orgId,
      host = "https://clickhouse.cloud",
      username = "default",
      password = "",
      httpPort = 8123,
      tcpPort = 9000,
      clusterName = Some(""),
      useSsl = false,
      properties = Map.empty
    )
    val updateOK = connectionRepository.set(orgId, newSource).syncGet()
    assert(updateOK)
  }

  test("test get data source") {
    val source = connectionRepository.get(orgId).syncGet()
    assert(source.isDefined)
    assert(source.get.isInstanceOf[ClickhouseConnection])
    assert(source.get.asInstanceOf[ClickhouseConnection].host == "https://clickhouse.cloud")
  }

  test("test set connection") {
    val newSource = ClickhouseConnection(
      orgId = orgId,
      host = "https://192.168.1.1",
      username = "default",
      password = "",
      httpPort = 8123,
      tcpPort = 9000,
      clusterName = Some(""),
      useSsl = false,
      properties = Map.empty
    )
    val updatedOk = connectionRepository.set(orgId, newSource).syncGet()
    assert(updatedOk)

    val source = connectionRepository.get(orgId).syncGet()
    assert(source.isDefined)
    assert(source.get.isInstanceOf[ClickhouseConnection])
    assert(source.get.asInstanceOf[ClickhouseConnection].host == "https://192.168.1.1")
  }

  test("test delete data source") {
    val deleteOk: Boolean = connectionRepository.delete(orgId).syncGet()
    assert(deleteOk)

    val source = connectionRepository.get(orgId).syncGet()
    assert(source.isEmpty)
  }

}
