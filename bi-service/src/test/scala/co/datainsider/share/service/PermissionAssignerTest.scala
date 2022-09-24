//package co.datainsider.share.service
//
//import co.datainsider.bi.domain.{Directory, DirectoryType}
//import co.datainsider.bi.domain.request.{CreateDirectoryRequest, DeleteDirectoryRequest, GetRootDirectoryRequest}
//import co.datainsider.bi.repository.{DirectoryRepository, SchemaManager}
//import co.datainsider.bi.service.DirectoryService
//import co.datainsider.share.controller.request.ShareWithUserRequest
//import com.twitter.inject.{Injector, IntegrationTest}
//import com.twitter.inject.app.TestInjector
//import datainsider.client.domain.Implicits.FutureEnhanceLike
//import datainsider.client.domain.user.UserInfo
//import datainsider.client.filter.LoggedInRequest
//import org.scalatest.BeforeAndAfterAll
//import co.datainsider.share.service.Permissions.{buildPermissions, copyPermissionsToResourceId}
//
//import scala.collection.mutable.ArrayBuffer
//
//class PermissionAssignerTest extends IntegrationTest with BeforeAndAfterAll {
//  override protected def injector: Injector = TestInjector(TestApp.modules).newInstance()
//
//  val schemaManager: SchemaManager = injector.instance[SchemaManager]
//  val directoryPermissionAssigner: DirectoryPermissionAssigner = injector.instance[DirectoryPermissionAssigner]
//  val shareService: ShareService = injector.instance[ShareService]
//  val directoryService: DirectoryService = injector.instance[DirectoryService]
//  val directoryRepo: DirectoryRepository = injector.instance[DirectoryRepository]
//  var rootDirId = 0
//  val dirIds = ArrayBuffer.empty[Int]
//
//  override def beforeAll(): Unit = {
//    schemaManager.ensureDatabase().syncGet()
//    val rootDir = directoryService.getRootDir(request = new MockGetRootDirectoryRequest()).syncGet()
//    val sub1Dir: Directory = directoryService
//      .create(request = new MockCreateDirectoryRequest("sub1", rootDir.id, DirectoryType.Directory))
//      .syncGet()
//    dirIds += directoryService
//      .create(request = new MockCreateDirectoryRequest("sub2", rootDir.id, DirectoryType.Dashboard))
//      .syncGet()
//      .id
//      .toInt
//    dirIds += directoryService
//      .create(request = new MockCreateDirectoryRequest("sub1_1", sub1Dir.id, DirectoryType.Dashboard))
//      .syncGet()
//      .id
//      .toInt
//    dirIds += directoryService
//      .create(request = new MockCreateDirectoryRequest("sub1_2", sub1Dir.id, DirectoryType.Dashboard))
//      .syncGet()
//      .id
//      .toInt
//    rootDirId = rootDir.id.toInt
//    dirIds += sub1Dir.id.toInt
//  }
//
//  test("Share with users") {
//    val results = shareService.share(
//      1L,
//      request = ShareWithUserRequest(
//        DirectoryType.Dashboard.toString,
//        rootDirId.toString,
//        Map("parents" -> Seq("view", "edit"))
//      )
//    )
//    println("share with user:")
//    results.onSuccess(r => println(r))
//  }
//
//  test("Get childrenIds") {
//    println(dirIds)
//    val result = directoryService.listChildrenIds(rootDirId).syncGet()
//    println(result)
//  }
//
//  test("Assign permission") {
//    val result = directoryPermissionAssigner
//      .assign(1L, rootDirId.toString, Map("hau test" -> Seq("view", "edit")))
//      .syncGet()
//    assert(result.getOrElse("hau test", true))
//    println(s"assign result: $result")
//  }
//
//  override def afterAll(): Unit = {
//    dirIds.foreach(id => directoryRepo.delete(id))
//  }
//}
//
//class MockGetRootDirectoryRequest() extends GetRootDirectoryRequest with LoggedInRequest {
//  override def currentUser: UserInfo = UserInfo("test", Seq(), true, 123, null, Set())
//
//  override def currentOrganizationId: Option[Long] = Some(1L)
//}
//
//class MockCreateDirectoryRequest(dirName: String, parentdirId: Long, dirType: DirectoryType.DirectoryType)
//    extends CreateDirectoryRequest(
//      name = dirName,
//      parentId = parentdirId,
//      isRemoved = true,
//      directoryType = dirType
//    )
//    with LoggedInRequest {
//  override def currentUser: UserInfo = UserInfo("test", Seq(), true, 123, null, Set())
//
//  override def currentOrganizationId: Option[Long] = Some(1L)
//}
