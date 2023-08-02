package co.datainsider.jobscheduler.repository

import co.datainsider.bi.module.TestContainerModule
import co.datainsider.caas.user_profile.module.MockCaasClientModule
import co.datainsider.jobscheduler.domain.DatabaseType
import co.datainsider.jobscheduler.domain.source.{DataSource, JdbcSource}
import co.datainsider.jobscheduler.module.JobScheduleTestModule
import com.google.inject.name.Names
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import org.scalatest.BeforeAndAfterAll

class SourceRepositoryTest extends IntegrationTest with BeforeAndAfterAll {
  override protected def injector: Injector = TestInjector(JobScheduleTestModule, TestContainerModule, MockCaasClientModule).newInstance()

  val repo: DataSourceRepository = injector.instance[DataSourceRepository]
  var ds: DataSource = null

  override def beforeAll(): Unit = {
    await(injector.instance[SchemaManager](Names.named("source-schema")).ensureSchema())
  }
  test("create data source") {
    val ds = createDataSource()
    val id = await(repo.insert(1, "root", ds))
    assert(id != 0)
  }

  private def createDataSource(): DataSource = {
    JdbcSource(
      1,
      0,
      "jdbc data source",
      DatabaseType.MySql,
      "jdbc:mysql://127.0.0.1:3306/",
      "root",
      "123456",
      "root",
      System.currentTimeMillis()
    )
  }
  test("get datasource") {
    val sources = await(repo.list(1, 0, 10, Seq(), None))
    assert(sources.nonEmpty)
    ds = sources.head
    println(ds)
  }

  test("get datasource by id") {
    assert(await(repo.get(1, ds.getId)).isDefined)
  }

  test("get multi get datasource") {
    assert(await(repo.multiGet(Seq(ds.getId))).nonEmpty)
  }

  test("update ds") {
    val newDs = JdbcSource(
      1,
      ds.getId,
      "another data source",
      DatabaseType.MySql,
      "jdbc:mysql://127.0.0.1:3306/",
      "another_user",
      "some_pa$$word",
      "root",
      System.currentTimeMillis()
    )
    assert(await(repo.update(1, newDs)))
  }

  test("multi list by username") {
    val sources = await(repo.listByUsername(1, "root"))
    assert(sources.nonEmpty)
  }

  test("delete ds") {
    assert(await(repo.delete(1, ds.getId)))
  }

  test("test delete by username is unknown") {
    assert(await(repo.deleteByUsername(1, "unknown")) == false)
  }

  test("test delete by username") {
    val ownerId = "tvc12"
    val dataSources = Seq(createDataSource(), createDataSource())
    dataSources.foreach(ds => await(repo.insert(1, ownerId, ds)))
    assert(await(repo.deleteByUsername(1, ownerId)))

    val sources = await(repo.listByUsername(1, ownerId))
    assert(sources.isEmpty)
  }

}
