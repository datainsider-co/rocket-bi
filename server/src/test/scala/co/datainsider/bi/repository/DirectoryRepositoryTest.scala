package co.datainsider.bi.repository

import co.datainsider.bi.domain.Ids.DirectoryId
import co.datainsider.bi.domain._
import co.datainsider.bi.domain.request.{CreateDirectoryRequest, ListDirectoriesRequest}
import co.datainsider.bi.module.{TestBIClientModule, TestCommonModule, TestContainerModule, TestModule}
import co.datainsider.caas.user_profile.controller.http.filter.parser.MockUserContext
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}

import java.util.concurrent.ThreadLocalRandom
import scala.util.Random

class DirectoryRepositoryTest extends IntegrationTest {
  override protected def injector: Injector =
    TestInjector(TestModule, TestBIClientModule, TestContainerModule, TestCommonModule).newInstance()
  private val directoryRepository = injector.instance[DirectoryRepository]

  private val ownerId = "root"
  private val orgId = 0

  override def beforeAll(): Unit = {
    val schemaManager = injector.instance[SchemaManager]
    await(schemaManager.ensureSchema())
  }

  var id = 0L
  val directory = new Directory(
    orgId = orgId,
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
    dashboardId = Some(1L)
  )

  private def createDirectory(): DirectoryId = {
    await(
      directoryRepository.create(
        orgId = orgId,
        request = new CreateDirectoryRequest(
          directory.name,
          parentId = directory.parentId,
          isRemoved = directory.isRemoved,
          directoryType = directory.directoryType,
          dashboardId = directory.dashboardId,
          data = directory.data,
          request = MockUserContext.getLoggedInRequest(0L, ownerId)
        ),
        ownerId = "root",
        creatorId = "root"
      )
    )
  }

  test("test create directory") {
    id = createDirectory()
    assert(id != 0)
  }

  test("test list directories") {
    val directories = {
      await(directoryRepository.list(orgId = orgId, ListDirectoriesRequest(dashboardIds = Seq(1))))
    }
    assert(directories.nonEmpty)
  }

  test("test count directories") {
    val directoriesCount =
      await(directoryRepository.count(orgId = orgId, request = ListDirectoriesRequest(dashboardIds = Seq(1))))
    assert(directoriesCount > 0)
  }

  test("test get directory success") {
    val savedDirectory: Option[Directory] = {
      await(directoryRepository.get(orgId = orgId, id))
    }
    assert(savedDirectory.isDefined)
    assert(savedDirectory.get.data == directory.data)
    assert(savedDirectory.get.name == directory.name)
    assert(savedDirectory.get.directoryType == directory.directoryType)
  }

  test("test update directory data") {
    val newDirectory = directory.copy(id = id, data = None)
    val isUpdated = await(directoryRepository.update(orgId = orgId, directory = newDirectory))

    assert(isUpdated)

    val directory2: Option[Directory] = await(directoryRepository.get(orgId = orgId, id = id))
    assert(directory2.isDefined)
    assert(directory2.get.data == newDirectory.data)
    assert(directory2.get.name == directory.name)
    assert(directory2.get.directoryType == directory.directoryType)
  }

  test("test delete directory") {
    val isDeleted = await(directoryRepository.delete(orgId = orgId, id = id))
    assert(isDeleted)
  }

  test("test multi delete directory with empty list") {
    val isDeleted = await(directoryRepository.multiDelete(orgId = orgId, ids = Array.empty))
    assert(isDeleted)
  }

  test("test multi delete directory with non-empty list") {
    val directoryIds = Array(createDirectory(), createDirectory(), createDirectory())
    val isDeleted = await(directoryRepository.multiDelete(orgId = orgId, ids = directoryIds))
    assert(isDeleted)
    directoryIds.foreach(id => {
      val directory: Option[Directory] = await(directoryRepository.get(orgId = orgId, id = id))
      assert(directory.isEmpty)
    })
  }

  test("test delete by owner") {
    val directoryIds = Array(createDirectory(), createDirectory(), createDirectory())
    val isDeleted = await(directoryRepository.deleteByOwnerId(orgId = orgId, username = ownerId))
    assert(isDeleted)
    directoryIds.foreach(id => {
      val directory: Option[Directory] = await(directoryRepository.get(orgId = orgId, id = id))
      assert(directory.isEmpty)
    })
  }

  test("test delete by owner id is unknown") {
    val isDeleted = await(directoryRepository.deleteByOwnerId(orgId = orgId, username = "unknown"))
    assert(isDeleted == false)
  }

  test("test multi restore directory with empty list") {
    val isRestored = await(directoryRepository.multiRestore(orgId = orgId, directories = Seq.empty))
    assert(isRestored == true)
  }

  test("test multi restore directory with non-empty list") {
    val directories = Seq(directory.copy(id = -1), directory.copy(id = -2), directory.copy(id = -3))
    val isRestoreSuccess = await(directoryRepository.multiRestore(orgId = orgId, directories = directories))
    assert(isRestoreSuccess)
    directories.foreach(deletedDirectory => {
      val directory: Option[Directory] = await(directoryRepository.get(orgId = orgId, id = deletedDirectory.id))
      assert(directory.isDefined)
      assert(directory.get.data == deletedDirectory.data)
      assert(directory.get.id == deletedDirectory.id)
      assert(directory.get.name == deletedDirectory.name)
      assert(directory.get.directoryType == deletedDirectory.directoryType)
      assert(directory.get.isRemoved == deletedDirectory.isRemoved)
      assert(!deletedDirectory.isRemoved)
      assert(directory.get.dashboardId == deletedDirectory.dashboardId)
      assert(directory.get.parentId == deletedDirectory.parentId)
      assert(directory.get.ownerId == deletedDirectory.ownerId)
      assert(directory.get.creatorId == deletedDirectory.creatorId)
      await(directoryRepository.delete(orgId = orgId, id = deletedDirectory.id))
    })
  }

  test("test update owner id") {
    val directoryIds = Array(createDirectory(), createDirectory(), createDirectory())
    val newOwnerId = "new_owner"
    val isUpdated =
      await(directoryRepository.updateOwnerId(orgId = orgId, fromUsername = ownerId, toUsername = newOwnerId))
    assert(isUpdated)
    directoryIds.foreach(id => {
      val directory: Option[Directory] = await(directoryRepository.get(orgId = orgId, id = id))
      assert(directory.isDefined)
      assert(directory.get.ownerId == newOwnerId)
      assert(directory.get.creatorId == ownerId)
    })
    await(directoryRepository.multiDelete(orgId = orgId, ids = directoryIds))
  }

  test("test update creator id") {
    val directoryIds = Array(createDirectory(), createDirectory(), createDirectory())
    val newCreatorId = "new_creator"
    val isUpdated =
      await(directoryRepository.updateCreatorId(orgId = orgId, fromUsername = ownerId, toUsername = newCreatorId))
    assert(isUpdated)
    directoryIds.foreach(id => {
      val directory: Option[Directory] = await(directoryRepository.get(orgId = orgId, id = id))
      assert(directory.isDefined)
      assert(directory.get.ownerId == ownerId)
      assert(directory.get.creatorId == newCreatorId)
    })
    await(directoryRepository.multiDelete(orgId = orgId, ids = directoryIds))
  }
}
