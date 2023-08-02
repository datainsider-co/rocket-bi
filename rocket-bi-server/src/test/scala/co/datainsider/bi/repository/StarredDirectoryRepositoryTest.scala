package co.datainsider.bi.repository

import co.datainsider.bi.domain.Ids.DirectoryId
import co.datainsider.bi.module.{TestContainerModule, TestModule}
import co.datainsider.schema.module.MockSchemaClientModule
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}

class StarredDirectoryRepositoryTest extends IntegrationTest {
  override protected def injector: Injector =
    TestInjector(TestModule, MockSchemaClientModule, TestContainerModule).newInstance()
  private val repository = injector.instance[StarredDirectoryRepository]
  val username = "tvc12"
  val dirIds = Range(0, 10).map(index => index.toLong)
  val organizationId = 1L

  override def beforeAll(): Unit = {
    val schemaManager = injector.instance[SchemaManager]
    await(schemaManager.ensureSchema())
  }

  test("star 10 directories") {
    dirIds.foreach(id => {
      val isStar: Boolean = await(repository.star(organizationId = organizationId, username, id))
      assert(isStar)
    })
  }

  test("test list starred directories") {
    val starredDirs: Array[DirectoryId] = await(repository.list(organizationId, username, 0, 100))
    assert(starredDirs.size == dirIds.size)
    assert(starredDirs.toSet == dirIds.toSet)
  }

  test("test count starred directories") {
    val count: Int = await(repository.count(organizationId = organizationId, username))
    assert(count == dirIds.size)
  }

  test("unstar directories") {
    val isUnstar: Boolean = await(repository.unstar(organizationId = organizationId, username, dirIds.head))
    assert(isUnstar)
    val count: Int = await(repository.count(organizationId = organizationId, username))
    assert(count == 9)
  }

  test("test directory by username") {
    val isDeleted = await(repository.deleteByUsername(organizationId, username))
    assert(isDeleted)
    val count: Int = await(repository.count(organizationId = organizationId, username))
    assert(count == 0)
  }

  test("test delete by unknown username") {
    val isDeleted = await(repository.deleteByUsername(organizationId, "unknown"))
    assert(isDeleted == false)
  }

}
