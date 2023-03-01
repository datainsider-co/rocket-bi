package datainsider.jobworker.service

import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import datainsider.client.module.{MockCaasClientModule, SchemaClientModule}
import datainsider.jobworker.domain.Ids.SourceId
import datainsider.jobworker.domain.request._
import datainsider.jobworker.module.TestModule
import datainsider.jobworker.util.Implicits.FutureEnhance
import org.scalatest.BeforeAndAfter

class MetadataServiceTest extends IntegrationTest {
  override protected def injector: Injector =
    TestInjector(TestModule, SchemaClientModule, MockCaasClientModule).newInstance()
  injector.synchronized()

  val sourceService: MetadataService = injector.instance[MetadataService]

  test("List sql server databases") {
    val databaseNames = sourceService.listDatabase(new MockSuggestDatabaseRequest(sourceId = 2)).sync()
    assert(databaseNames.contains("dbo"))
  }

  test("List sql server tables") {
    val request: SuggestTableRequest = new MockSuggestTableRequest(2, "dbo")
    val tableNames = sourceService.listTable(request).sync()
    assert(tableNames.contains("spt_fallback_db"))
  }

  test("List sql server columns") {
    val request: SuggestColumnRequest = new MockSuggestColumnRequest(2, "dbo", "spt_fallback_db")
    val cols = sourceService.listColumn(request).sync()
    assert(cols.contains("name"))
  }

  test("List oracle databases") {
    val databaseNames = sourceService.listDatabase(new MockSuggestDatabaseRequest(sourceId = 1)).sync()
    assert(databaseNames.contains("TVC12"))
  }

  test("List oracle tables") {
    val request: SuggestTableRequest = new MockSuggestTableRequest(1, "TVC12")
    val tableNames = sourceService.listTable(request).sync()
    assert(tableNames.contains("STUDENT"))
  }

  test("List oracle columns") {
    val request: SuggestColumnRequest = new MockSuggestColumnRequest(1, "TVC12", "STUDENT")
    val cols = sourceService.listColumn(request).sync()
    assert(cols.contains("ID"))
    assert(cols.contains("BIRTHDAY"))
  }

  test("List postgres databases") {
    val databaseNames = sourceService.listDatabase(new MockSuggestDatabaseRequest(sourceId = 3)).sync()
    assert(databaseNames.contains("public"))
  }

  test("List postgres tables") {
    val request: SuggestTableRequest = new MockSuggestTableRequest(3, "information_schema")
    val tableNames = sourceService.listTable(request).sync()
    assert(tableNames.contains("sql_languages"))
  }

  test("List postgres columns") {
    val request: SuggestColumnRequest = new MockSuggestColumnRequest(3, "information_schema", "sql_languages")
    val cols = sourceService.listColumn(request).sync()
    assert(cols.contains("sql_language_source"))
  }

//  test("List redshift databases") {
//    val databaseNames = sourceService.listDatabase(new MockSuggestDatabaseRequest(sourceId = 4)).sync()
//    assert(databaseNames.contains("public"))
//  }
//
//  test("List redshift tables") {
//    val request: SuggestTableRequest = new MockSuggestTableRequest(4, "public")
//    val tableNames = sourceService.listTable(request).sync()
//    assert(tableNames.contains("pet"))
//  }
//
//  test("List redshift columns") {
//    val request: SuggestColumnRequest = new MockSuggestColumnRequest(4, "public", "pet")
//    val cols = sourceService.listColumn(request).sync()
//    assert(cols.contains("age"))
//  }
//
  test("List big query databases") {
    val extraData: String =
      """
        |{
        |		"location": "usa",
        |		"projectName": "bigquery-public-data"
        |}
        |""".stripMargin
    val databaseNames = sourceService.listDatabase(new MockSuggestDatabaseRequest(sourceId = 5, Some(extraData))).sync()
    assert(databaseNames.contains("usa_names"))
  }

  test("List big query tables") {
    val extraData: String =
      """
        |{
        |		"location": "usa",
        |		"projectName": "bigquery-public-data"
        |}
        |""".stripMargin
    val request: SuggestTableRequest = new MockSuggestTableRequest(5, "usa_names", Some(extraData))
    val tableNames = sourceService.listTable(request).sync()
    val expectedTableNames = Seq("usa_1910_2013", "usa_1910_current")
    expectedTableNames.foreach(expectedTableName => assert(tableNames.contains(expectedTableName)))
  }

  test("List bigquery columns") {
    val extraData: String =
      """
        |{
        |		"location": "usa",
        |		"projectName": "bigquery-public-data"
        |}
        |""".stripMargin
    val request: SuggestColumnRequest =
      new MockSuggestColumnRequest(5, "usa_names", "usa_1910_current", Some(extraData))
    val cols = sourceService.listColumn(request).sync()
    val expectedColumnNames = Seq("state", "gender", "year", "name", "number")
    expectedColumnNames.foreach(expectedColumnName => assert(cols.contains(expectedColumnName)))
  }

  test("List mongodb databases") {
    val databaseNames = sourceService.listDatabase(new MockSuggestDatabaseRequest(sourceId = 6)).sync()
    assert(databaseNames.contains("admin"))
  }

  test("List mongodb tables") {
    val request: SuggestTableRequest = new MockSuggestTableRequest(6, "highschool")
    val tableNames = sourceService.listTable(request).sync()
    assert(tableNames.contains("student"))
  }

  test("suggest mongodb schema") {
    val request: SuggestTableSchemaRequest = new MockSuggestTableSchemaRequest(6, "highschool", "student")
    val schema = sourceService.suggestTableSchema(request).sync()
    println(schema)
    assert(schema.columns.nonEmpty)
  }

}

class MockSuggestDatabaseRequest(sourceId: SourceId, extraData: Option[String] = None)
    extends SuggestDatabaseRequest(sourceId = sourceId, extraData = extraData) {
  override def currentOrganizationId: Option[SourceId] = Some(1)
}

class MockSuggestTableRequest(sourceId: SourceId, databaseName: String, extraData: Option[String] = None)
    extends SuggestTableRequest(sourceId = sourceId, databaseName = databaseName, extraData = extraData) {
  override def currentOrganizationId: Option[SourceId] = Some(1)
}

class MockSuggestColumnRequest(
    sourceId: SourceId,
    databaseName: String,
    tableName: String,
    extraData: Option[String] = None
) extends SuggestColumnRequest(
      sourceId = sourceId,
      databaseName = databaseName,
      tableName = tableName,
      extraData = extraData
    ) {
  override def currentOrganizationId: Option[SourceId] = Some(1)
}

class MockSuggestTableSchemaRequest(sourceId: SourceId, databaseName: String, tableName: String)
    extends SuggestTableSchemaRequest(sourceId = sourceId, databaseName = databaseName, tableName = tableName) {
  override def currentOrganizationId: Option[SourceId] = Some(1)
}
