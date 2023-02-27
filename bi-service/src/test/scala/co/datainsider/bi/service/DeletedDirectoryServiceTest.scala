package co.datainsider.bi.service

import co.datainsider.bi.domain.Directory
import co.datainsider.bi.domain.request.ListDirectoriesRequest
import co.datainsider.bi.module.TestModule
import co.datainsider.bi.repository.{DeletedDirectoryRepository, SchemaManager}
import co.datainsider.share.module.MockShareModule
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import datainsider.client.exception.NotFoundError
import datainsider.client.module.MockCaasClientModule

import java.util.concurrent.ThreadLocalRandom

class DeletedDirectoryServiceTest extends IntegrationTest {

  override protected def injector: Injector = TestInjector(TestModule, MockCaasClientModule, MockShareModule).newInstance()
  private val deletedDirectoryService = injector.instance[DeletedDirectoryService]
  private val repository = injector.instance[DeletedDirectoryRepository]
  private val username = "tvc12"
  private val orgId = 1L
  val rootDir1 = createFakeDirectory()
  val rootDir2 = createFakeDirectory()
  val parent1Root1 = createFakeDirectory().copy(parentId = rootDir1.id)
  val parent2Root1 = createFakeDirectory().copy(parentId = rootDir1.id)
  val parent3Root1 = createFakeDirectory().copy(parentId = rootDir1.id)

  val child1Parent1Root1 = createFakeDirectory().copy(parentId = parent1Root1.id)
  val child1Parent2Root1 = createFakeDirectory().copy(parentId = parent2Root1.id)
  val child1Parent3Root1 = createFakeDirectory().copy(parentId = parent3Root1.id)

  val parent1Root2 = createFakeDirectory().copy(parentId = rootDir2.id)
  val parent2Root2 = createFakeDirectory().copy(parentId = rootDir2.id)
  val parent3Root2 = createFakeDirectory().copy(parentId = rootDir2.id)
  val parent4Root2 = createFakeDirectory().copy(parentId = rootDir2.id)

  val child1Parent1Root2 = createFakeDirectory().copy(parentId = parent1Root2.id)
  val child2Parent1Root2 = createFakeDirectory().copy(parentId = parent1Root2.id)
  override def beforeAll(): Unit = {
    super.beforeAll()
    val schemaManager = injector.instance[SchemaManager]
    await(schemaManager.ensureDatabase())
  }

  private def createFakeDirectory(): Directory = {
    Directory(
      id = ThreadLocalRandom.current().nextLong(),
      name = "test",
      parentId = -1L,
      ownerId = username,
      creatorId = username,
      createdDate = System.currentTimeMillis()
    )
  }

  test("insert mock data") {
    val directories = Seq(
      rootDir1,
      rootDir2,
      parent1Root1,
      parent2Root1,
      parent3Root1,
      parent1Root2,
      parent2Root2,
      parent3Root2,
      parent4Root2,
      child1Parent1Root2,
      child2Parent1Root2,
      child1Parent1Root1,
      child1Parent2Root1,
      child1Parent3Root1
    )
    val isSuccess = await(repository.multiInsert(directories))
    assert(isSuccess)
  }

  test("list root directories") {
    val rootDirectories = await(deletedDirectoryService.listRootDirectories(ListDirectoriesRequest()))
    assert(rootDirectories.size == 2)
    assert(rootDirectories.forall(_.parentId == -1))
    assert(rootDirectories.forall(_.ownerId == username))
    assert(rootDirectories.map(_.id).toSet == Set(rootDir1.id, rootDir2.id))
  }

  test("list directories by parent id") {
    val childDirectories =
      await(deletedDirectoryService.listDirectories(ListDirectoriesRequest(parentId = Some(rootDir1.id))))
    assert(childDirectories.size == 3)
    assert(childDirectories.forall(_.parentId == rootDir1.id))
    assert(childDirectories.forall(_.ownerId == username))
    assert(childDirectories.map(_.id).toSet == Set(parent1Root1.id, parent2Root1.id, parent3Root1.id))
  }

  test("restore directory") {
    val isSuccess = await(deletedDirectoryService.restore(orgId, parent1Root2.id))
    assert(isSuccess)
    val childDirectories =
      await(deletedDirectoryService.listDirectories(ListDirectoriesRequest(parentId = Some(rootDir2.id))))
    assert(childDirectories.size == 3)
    assert(childDirectories.forall(_.parentId == rootDir2.id))
    assert(childDirectories.forall(_.ownerId == username))
    assert(childDirectories.map(_.id).toSet == Set(parent2Root2.id, parent3Root2.id, parent4Root2.id))
    assertFailedFuture[NotFoundError](deletedDirectoryService.getDirectory(orgId, child1Parent1Root2.id))
    assertFailedFuture[NotFoundError](deletedDirectoryService.getDirectory(orgId, child2Parent1Root2.id))
  }

  test("get directory not found") {
    assertFailedFuture[NotFoundError](deletedDirectoryService.getDirectory(orgId, -1213L))
  }

  test("get directory success") {
    val directory = await(deletedDirectoryService.getDirectory(orgId, child1Parent1Root1.id))
    assert(directory.id == child1Parent1Root1.id)
    assert(directory.name == child1Parent1Root1.name)
    assert(directory.parentId == child1Parent1Root1.parentId)
    assert(directory.ownerId == child1Parent1Root1.ownerId)
  }

  test("delete directory") {
    val isSuccess = await(deletedDirectoryService.permanentDeleteDirectory(orgId, rootDir1.id))
    assert(isSuccess)
    Seq(
      rootDir1,
      parent1Root1,
      parent2Root1,
      parent3Root1,
      child1Parent1Root1,
      child1Parent2Root1,
      child1Parent3Root1
    ).foreach { directory =>
      assertFailedFuture[NotFoundError](deletedDirectoryService.getDirectory(orgId, directory.id))
    }
  }
}
