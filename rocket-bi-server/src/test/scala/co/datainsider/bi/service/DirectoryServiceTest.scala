package co.datainsider.bi.service

import co.datainsider.bi.domain.Directory
import co.datainsider.bi.domain.request.{CreateDirectoryRequest, GetRootDirectoryRequest, ListDirectoriesRequest}
import co.datainsider.bi.module.{TestContainerModule, TestModule}
import co.datainsider.bi.repository.SchemaManager
import co.datainsider.caas.user_profile.controller.http.filter.parser.MockUserContext
import co.datainsider.schema.module.MockSchemaClientModule
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}

class DirectoryServiceTest extends IntegrationTest {
  override protected def injector: Injector =
    TestInjector(TestModule, MockSchemaClientModule, TestContainerModule).newInstance()
  private val directoryService = injector.instance[DirectoryService]
  private val deletedDirectoryService = injector.instance[DeletedDirectoryService]
  private val fromUsername = "tvc12"
  private val toUsername = "tvc13"
  private val orgId = 1L
  private var newDir: Directory = _
  override def beforeAll(): Unit = {
    super.beforeAll()
    val schemaManager = injector.instance[SchemaManager]
    await(schemaManager.ensureSchema())
  }

  private def getCreateDirectoryRequest(): CreateDirectoryRequest = {
    val baseRequest = MockUserContext.getLoggedInRequest(orgId, fromUsername)
    val parentDir: Directory = await(directoryService.getRootDir(GetRootDirectoryRequest(baseRequest)))
    CreateDirectoryRequest(
      name = "test",
      parentId = parentDir.id,
      request = baseRequest
    )
  }

  test("create directory") {
    val request = getCreateDirectoryRequest()
    newDir = await(directoryService.create(request))
    assert(newDir.name == request.name)
    assert(newDir.parentId == request.parentId)
    assert(newDir.ownerId == fromUsername)
    assert(newDir.creatorId == fromUsername)
  }

  test("transfer directory") {
    val isSuccess = await(directoryService.transferData(orgId, fromUsername, toUsername))
    assert(isSuccess)

    val listToUserRequest = ListDirectoriesRequest(
      request = MockUserContext.getLoggedInRequest(orgId, toUsername)
    )
    val toDirs: Array[Directory] = await(directoryService.list(listToUserRequest))
//    assert(toDirs.length == 3)
    toDirs.foreach { dir =>
//      assert(dir.ownerId == toUsername)
//      assert(dir.creatorId == toUsername)
    }
  }

  test("delete user data") {
    val isSuccess = await(directoryService.deleteUserData(orgId, toUsername))
    assert(isSuccess)
    val baseRequest = MockUserContext.getLoggedInRequest(orgId, toUsername)
    val listToUserRequest = ListDirectoriesRequest(request = baseRequest)
    val toDirs: Array[Directory] = await(directoryService.list(listToUserRequest))
//    assert(toDirs.length == 0)
    val deletedDir = await(deletedDirectoryService.listRootDirectories(ListDirectoriesRequest(request = baseRequest)))
//    assert(deletedDir.length == 0)
  }
}
