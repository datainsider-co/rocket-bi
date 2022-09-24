/*
package co.datainsider.client

import co.datainsider.bi.client.NativeJDbcClient
import co.datainsider.bi.domain.Ids.WidgetId
import co.datainsider.bi.domain._
import co.datainsider.bi.domain.request.{CreateDashboardRequest, CreateDirectoryRequest, ListDirectoriesRequest}
import co.datainsider.bi.module.BIServiceModule.{shareInfoFields, tblShareInfoName}
import co.datainsider.bi.module.TestModule.{shareInfoFieldsTest, tblShareInfoNameTest}
import co.datainsider.bi.repository.{MySqlDashboardRepository, MySqlDirectoryRepository, MySqlSchemaManager}
import co.datainsider.bi.util.ZConfig
import com.twitter.inject.Logging
import com.twitter.util.Await
import org.scalatest.{BeforeAndAfterAll, FunSuite}

class MySqlRepositoryTest extends FunSuite with Logging with BeforeAndAfterAll {
  val jdbcUrl: String = ZConfig.getString("database.mysql.url")
  val user: String = ZConfig.getString("database.mysql.user")
  val password: String = ZConfig.getString("database.mysql.password")
  val client: NativeJDbcClient = NativeJDbcClient(jdbcUrl, user, password)

  val dbName = ZConfig.getString("database_schema_testing.database.name")
  val tblDirectoryName = ZConfig.getString("database_schema_testing.table.directory.name")
  val tblDashboardName = ZConfig.getString("database_schema_testing.table.dashboard.name")
  val tblTableRelationship: String = ZConfig.getString("database_schema_testing.table.table_relationship.name")
  val tblPermissionToken: String = ZConfig.getString("database_schema_testing.table.permission_token.name")
  val tblDashboardLinkSharingToken: String =
    ZConfig.getString("database_schema_testing.table.object_sharing_token.name")
  val tblGeolocation: String = ZConfig.getString("database_schema_testing.table.geolocation.name")

  val dashboardFields = ZConfig.getStringList("database_schema_testing.table.dashboard.fields").toSet
  val directoryFields = ZConfig.getStringList("database_schema_testing.table.directory.fields").toSet
  val tableRelationshipFields: Set[String] =
    ZConfig.getStringList("database_schema_testing.table.table_relationship.fields").toSet
  val permissionTokenFields: Set[String] =
    ZConfig.getStringList("database_schema_testing.table.permission_token.fields").toSet
  val dashboardLinkSharingTokenFields: Set[String] =
    ZConfig.getStringList("database_schema_testing.table.object_sharing_token.fields").toSet
  val geolocationFields: Set[String] = ZConfig.getStringList("database_schema_testing.table.geolocation.fields").toSet

  val schemaManager = new MySqlSchemaManager(
    client,
    dbName,
    tblDashboardName,
    tblDirectoryName,
    tblPermissionToken,
    tblDashboardLinkSharingToken,
    dashboardFields,
    directoryFields,
    permissionTokenFields,
    dashboardLinkSharingTokenFields,
    tblGeolocation,
    geolocationFields,
    tblShareInfoNameTest,
    shareInfoFieldsTest
  )

  override def beforeAll(): Unit = {
    client.executeUpdate(s"drop database if exists $dbName;")
    schemaManager.ensureDatabase()
  }

  override def afterAll(): Unit = {
    client.executeUpdate(s"drop database $dbName;")
  }

  test("test CRUD dashboard repository ") {
    val dashboardRepo = new MySqlDashboardRepository(client, dbName, tblDashboardName)
    val arrWidgets: Array[Widget] = Array[Widget]()
    val widgetPositions: Map[WidgetId, Position] = Map(1L -> Position(2, 3, 4, 5), 2L -> Position(3, 2, 6, 7))
    val request = CreateDashboardRequest("one", -1, None, Some(arrWidgets), Some(widgetPositions))
    debug(request)

    val createdId = Await.result(dashboardRepo.create(request, "admin", "creator"))

    val dashboardFromDb = Await.result(dashboardRepo.get(createdId)).get
    assert(dashboardFromDb != null)
    debug(dashboardFromDb)
    assert(dashboardFromDb.name == request.name)

    val newName: String = "renamed"
    assert(Await.result(dashboardRepo.rename(createdId, newName)))
    assert(client.executeQuery(s"select * from $dbName.$tblDashboardName where id = ?;", createdId)(rs => {
      if (rs.next) rs.getString("name")
    }) == newName)

    assert(Await.result(dashboardRepo.delete(createdId)))
    assert(client.executeQuery(s"select count(*) from $dbName.$tblDashboardName where id = ?;", createdId)(rs => {
      if (rs.next) rs.getInt("count(*)")
    }) == 0)
  }

  test("test CRUD directory repository") {
    val directoryRepo: MySqlDirectoryRepository = new MySqlDirectoryRepository(client, dbName, tblDirectoryName)
    val id = 1
    val dir = CreateDirectoryRequest("one", 0, isRemoved = true, directoryType = ResourceType.Directory)
    val dirChild = CreateDirectoryRequest("two", id, isRemoved = false, directoryType = ResourceType.Dashboard)

    //    assert(Await.result(directoryRepo.create(dir)))
    //    assert(Await.result(directoryRepo.create(dirChild)))

    //    assert(Await.result(directoryRepo.list(ListDirectoryRequest(id, "name", Order.ASC)))(0).id.equals(dirChild.id))

//    val newName = "renamed"
//    assert(Await.result(directoryRepo.renameTypeDirectory(id, newName)))
//    assert(client.executeQuery(s"select name from $dbName.$tblDirectoryName where id = ?;", id)(rs => {
//      if (rs.next()) rs.getString("name")
//    }) == newName)
//
//    assert(Await.result(directoryRepo.deleteTypeDirectory(id)))
//    assert(client.executeQuery(s"select count(*) from $dbName.$tblDirectoryName where id = ?;", id)(rs => {
//      if (rs.next) rs.getInt("count(*)")
//    }) == 0)
//
//    assert(!Await.result(directoryRepo.renameTypeDirectory(id, newName)))
//    assert(!Await.result(directoryRepo.deleteTypeDirectory(id)))

  }

}
*/
