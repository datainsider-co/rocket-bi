/*
package co.datainsider.client

import co.datainsider.bi.client.NativeJDbcClient
import co.datainsider.bi.module.TestModule.{shareInfoFieldsTest, tblShareInfoNameTest}
import co.datainsider.bi.repository.MySqlSchemaManager
import co.datainsider.bi.util.ZConfig
import com.twitter.util.Await
import org.scalatest.FunSuite

import scala.collection.mutable

class JdbcSchemaManagerTest extends FunSuite {

  test("test schema_manager directory table") {
    val jdbcUrl: String = ZConfig.getString("database.mysql.url")
    val user: String = ZConfig.getString("database.mysql.user")
    val password: String = ZConfig.getString("database.mysql.password")
    val client = NativeJDbcClient(jdbcUrl, user, password)

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

    assert(client.executeUpdate(s"drop database if exists $dbName;") >= 0)
    assert(Await.result(schemaManager.ensureDatabase()))

    assert(client.executeQuery(s"show databases like '$dbName';")(_.next()))
    assert(client.executeQuery(s"show tables from $dbName like '$tblDirectoryName';")(_.next()))
    assert(client.executeQuery(s"show tables from $dbName like '$tblDashboardName';")(_.next()))

    val directoryActualFields = mutable.Set[String]()
    client.executeQuery(s"desc $dbName.$tblDirectoryName;")(rs => {
      while (rs.next) directoryActualFields.add(rs.getString("Field"))
    })
    assert(directoryActualFields.equals(directoryFields))

    val dashboardActualFields = mutable.Set[String]()
    client.executeQuery(s"desc $dbName.$tblDashboardName;")(rs => {
      while (rs.next) dashboardActualFields.add(rs.getString("Field"))
    })
    assert(dashboardActualFields.equals(dashboardFields))

    assert(client.executeUpdate(s"drop table $dbName.$tblDirectoryName;") >= 0)
    assert(
      client.executeUpdate(
        s"create table $dbName.$tblDirectoryName(" +
          s"invalid_table VARCHAR(255)" +
          s") ENGINE=INNODB;"
      ) >= 0
    )
    assertResult(false)(Await.result(schemaManager.ensureDatabase()))

    assert(client.executeUpdate(s"drop database $dbName;") >= 0)

  }

}
*/
