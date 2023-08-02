//package co.datainsider.schema.service
//
//import co.datainsider.bi.module.TestContainerModule
//import co.datainsider.caas.user_profile.module.MockCaasClientModule
//import co.datainsider.schema.domain.requests.{
//  GetResourceSharingInfoRequest,
//  MultiUpdateResourceSharingRequest,
//  RevokeDatabasePermissionsRequest,
//  ShareWithUserRequest
//}
//import co.datainsider.schema.module.{MockSchemaClientModule, SchemaTestModule}
//import co.datainsider.schema.repository.ShareRepository
//import com.twitter.inject.app.TestInjector
//import com.twitter.inject.{Injector, IntegrationTest}
//import datainsider.client.domain.Implicits.FutureEnhanceLike
//import org.scalatest.BeforeAndAfterAll
//
//class ShareServiceTest extends IntegrationTest with BeforeAndAfterAll {
//  override protected val injector: Injector =
//    TestInjector(SchemaTestModule, MockCaasClientModule, TestContainerModule, MockSchemaClientModule).newInstance()
//
//  val shareService: ShareService = injector.instance[ShareService]
//  val shareRepository: ShareRepository = injector.instance[ShareRepository]
//  val schemaService: SchemaService = injector.instance[SchemaService]
//
//  override def beforeAll(): Unit = {
//    super.beforeAll()
//    schemaService.ensureDatabaseCreated(1, "testdb").syncGet()
//  }
//
//  test("Test share database") {
//    val userAction = Map("trunghau" -> Seq("edit"))
//    val request = new MockShareWithUserRequest("testdb", userAction)
//    val result = shareService.share(1L, request).syncGet()
//    assert(result.getOrElse("trunghau", false).equals(true))
//  }
//
//  test("Test get share info") {
//    val request = GetResourceSharingInfoRequest("testdb")
//    val result = shareService.getInfo(1L, request).syncGet()
//    println(result)
//    assert(result.totalUserSharing.equals(1L))
//  }
//
//  test("Test update permissions") {
//    val shareInfo = shareRepository.getSharingInfos(1L, "database", "testdb", 0, 100).syncGet()
//    val request = MultiUpdateResourceSharingRequest("testdb", Map(shareInfo.data.head.id -> Seq("view", "edit")))
//    val result = shareService.multiUpdate(1L, request).syncGet()
//    println(result)
//    assert(result.getOrElse(shareInfo.data.head.id, true).equals(true))
//  }
//
//  test("Test remove permissions") {
//    val request = RevokeDatabasePermissionsRequest("testdb", Seq("trunghau", "test"))
//    val result = shareService.revokePermissions(1L, request).syncGet()
//    assert(result.getOrElse("trunghau", false).equals(true))
//  }
//
//  override def afterAll(): Unit = {
//    super.afterAll()
//    val shareInfo = shareRepository.getSharingInfos(1L, "database", "testdb", 0, 100).syncGet()
//    shareInfo.data.foreach(data => shareRepository.delete(data.id))
//  }
//}
//
//class MockShareWithUserRequest(dbName: String, userActions: Map[String, Seq[String]])
//    extends ShareWithUserRequest(dbName, userActions) {
//  override def currentUsername: String = "trunghau"
//}
