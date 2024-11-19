package co.datainsider.bi.repository

import co.datainsider.bi.domain.Directory
import co.datainsider.bi.domain.request.ListDirectoriesRequest
import co.datainsider.bi.module.{TestBIClientModule, TestCommonModule, TestContainerModule, TestModule}
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}

import java.util.concurrent.ThreadLocalRandom
import scala.collection.mutable.ArrayBuffer

class DeletedDirectoryRepositoryTest extends IntegrationTest {
  override protected def injector: Injector =
    TestInjector(TestModule, TestBIClientModule, TestContainerModule, TestCommonModule).newInstance()
  private val deletedDirectoryRepository = injector.instance[DeletedDirectoryRepository]
  val username = "tvc12"
  val organizationId = 1L

  private val createdDirIds = ArrayBuffer.empty[Long]

  override def beforeAll(): Unit = {
    val schemaManager = injector.instance[SchemaManager]
    await(schemaManager.ensureSchema())
  }

  private def createFakeDirectory(): Directory = {
    Directory(
      orgId = organizationId,
      id = ThreadLocalRandom.current().nextLong(),
      name = "test",
      parentId = -1L,
      ownerId = username,
      creatorId = username,
      createdDate = System.currentTimeMillis()
    )
  }

  test("insert directory") {
    val directory = createFakeDirectory()
    val isSuccess: Boolean = await(deletedDirectoryRepository.insert(organizationId, directory))
    assert(isSuccess)
    createdDirIds += directory.id
  }

  test("multi insert directories") {
    val directories = Range(0, 10).map(_ => createFakeDirectory())
    val isSuccess: Boolean = await(deletedDirectoryRepository.multiInsert(organizationId, directories))
    assert(isSuccess)
    createdDirIds ++= directories.map(_.id)
  }

  test("test list deleted directories") {
    val directories: Array[Directory] = await(
      deletedDirectoryRepository.list(
        orgId = organizationId,
        request = ListDirectoriesRequest(
          ownerId = Some(username)
        )
      )
    )
    assert(directories.map(_.id).toSet.intersect(createdDirIds.toSet).size == createdDirIds.size)
  }

  test("test isExist") {
    val isExist: Boolean = await(deletedDirectoryRepository.isExist(organizationId, createdDirIds.head))
    assert(isExist)
  }

  test("get deleted directory") {
    val directory: Option[Directory] = await(deletedDirectoryRepository.get(organizationId, createdDirIds.head))
    assert(directory.isDefined)
    assert(directory.get.id == createdDirIds.head)
  }

  test("test delete by directory id") {
    val isDeleted = await(deletedDirectoryRepository.delete(organizationId, createdDirIds.head))
    assert(isDeleted)
    val directory: Option[Directory] = await(deletedDirectoryRepository.get(organizationId, createdDirIds.head))
    assert(directory.isEmpty)
    createdDirIds -= createdDirIds.head
  }

  test("multi delete directories") {
    val isDeleted = await(deletedDirectoryRepository.multiDelete(organizationId, createdDirIds))
    assert(isDeleted)
    val directories: Array[Directory] = await(
      deletedDirectoryRepository.list(
        organizationId,
        ListDirectoriesRequest(
          ownerId = Some(username)
        )
      )
    )
    val isExists = await(deletedDirectoryRepository.isExist(organizationId, createdDirIds.head))
    assert(!isExists)
  }

  test("test delete by username") {
    val fakeDirectories = Range(0, 10).map(_ => createFakeDirectory())
    val isSuccess: Boolean = await(deletedDirectoryRepository.multiInsert(organizationId, fakeDirectories))
    assert(isSuccess)
    val isDeleted = await(deletedDirectoryRepository.deleteByOwnerId(organizationId, username))
    assert(isDeleted)
    val directories: Array[Directory] = await(
      deletedDirectoryRepository.list(
        organizationId,
        ListDirectoriesRequest(
          ownerId = Some(username)
        )
      )
    )
    assert(directories.isEmpty)
  }

  test("get sub directories") {
    val parentDir = createFakeDirectory()
    val childDir = createFakeDirectory().copy(parentId = parentDir.id)
    val childDir2 = createFakeDirectory().copy(parentId = parentDir.id)
    val isSuccess: Boolean =
      await(deletedDirectoryRepository.multiInsert(organizationId, Seq(parentDir, childDir, childDir2)))
    assert(isSuccess)
    val subDirectories: Array[Directory] =
      await(deletedDirectoryRepository.getSubDirectories(organizationId, parentDir.id))
    assert(subDirectories.size == 2)
    assert(subDirectories.map(_.id).toSet == Set(childDir.id, childDir2.id))
  }

}
