package co.datainsider.bi.repository

import co.datainsider.bi.domain._
import co.datainsider.bi.domain.request.CreateDirectoryRequest
import co.datainsider.bi.module.TestModule
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import datainsider.client.filter.MockUserContext

class DirectoryRepositoryTest extends IntegrationTest {
  override protected def injector: Injector = TestInjector(TestModule).newInstance()
  private val directoryRepository = injector.instance[DirectoryRepository]

  override def beforeAll(): Unit = {
    val schemaManager = injector.instance[SchemaManager]
    await(schemaManager.ensureDatabase())
  }

  var id = 0L
  val directory = new Directory(
    name = "new directory",
    creatorId = "root",
    ownerId = "root",
    createdDate = System.currentTimeMillis(),
    updatedDate = Some(System.currentTimeMillis()),
    data = Some(Map("data" -> 1)),
    parentId = -1,
    id = -1,
    isRemoved = false,
    directoryType = DirectoryType.FunnelAnalysis,
  )

  test("test create directory") {
    id = await(
      directoryRepository.create(
        new CreateDirectoryRequest(
          directory.name,
          parentId = directory.parentId,
          isRemoved = directory.isRemoved,
          directoryType = directory.directoryType,
          data = directory.data,
          request = MockUserContext.getLoggedInRequest(0L, "root")
        ),
        "root",
        "root"
      )
    )
    assert(id != 0)
  }

  test("test get directory success") {
    val savedDirectory: Option[Directory] = await(directoryRepository.get(id))
    assert(savedDirectory.isDefined)
    assert(savedDirectory.get.data == directory.data)
    assert(savedDirectory.get.name == directory.name)
    assert(savedDirectory.get.directoryType == directory.directoryType)
  }

  test("test update directory data") {
    val newDirectory = directory.copy(id = id, data = None)
    val isUpdated = await(directoryRepository.update(newDirectory))

    assert(isUpdated)

    val directory2: Option[Directory] = await(directoryRepository.get(id))
    assert(directory2.isDefined)
    assert(directory2.get.data == newDirectory.data)
    assert(directory2.get.name == directory.name)
    assert(directory2.get.directoryType == directory.directoryType)
  }

  test("test delete directory") {
    val isDeleted = await(directoryRepository.delete(id))
    assert(isDeleted)
  }

}
