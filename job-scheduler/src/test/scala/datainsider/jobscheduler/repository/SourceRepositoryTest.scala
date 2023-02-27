package datainsider.jobscheduler.repository

import com.google.inject.name.Names
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import com.twitter.util.Await
import datainsider.client.module.{MockCaasClientModule, SchemaClientModule}
import datainsider.jobscheduler.domain.{DataSource, JdbcSource}
import datainsider.jobscheduler.domain.DatabaseType
import datainsider.jobscheduler.module.TestModule
import org.scalatest.BeforeAndAfterAll

class SourceRepositoryTest extends IntegrationTest with BeforeAndAfterAll {

  override protected def injector: Injector =
    TestInjector(TestModule, SchemaClientModule, MockCaasClientModule).newInstance()
  val repo: DataSourceRepository = injector.instance[DataSourceRepository]

  override def beforeAll(): Unit = {
    Await.result(injector.instance[SchemaManager](Names.named("source-schema")).ensureSchema())
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

  test("create data source") {
    val ds = createDataSource()
    val id = Await.result(repo.insert(1, "root", ds))
    assert(id != 0)
  }

  var ds: DataSource = null
  test("get datasource") {
    val sources = Await.result(repo.list(1, 0, 10, Seq(), None))
    assert(sources.nonEmpty)
    ds = sources.head
    println(ds)
  }

  test("get datasource by id") {
    assert(Await.result(repo.get(1, ds.getId)).isDefined)
  }

  test("get multi get datasource") {
    assert(Await.result(repo.multiGet(Seq(ds.getId))).nonEmpty)
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
    assert(Await.result(repo.update(1, newDs)))
  }

  test("multi list by username") {
    val sources = Await.result(repo.listByUsername(1, "root"))
    assert(sources.nonEmpty)
    assert(sources.size == 1)
  }

  test("delete ds") {
    assert(Await.result(repo.delete(1, ds.getId)))
  }

  test("test delete by username is unknown") {
    assert(await(repo.deleteByUsername(1, "unknown")) == false)
  }

  test("test delete by username") {
    val ownerId = "tvc12"
    val dataSources = Seq(createDataSource(), createDataSource())
    dataSources.foreach(ds => await(repo.insert(1, ownerId, ds)))
    assert(Await.result(repo.deleteByUsername(1, ownerId)))

    val sources = Await.result(repo.listByUsername(1, ownerId))
    assert(sources.isEmpty)
  }

}
