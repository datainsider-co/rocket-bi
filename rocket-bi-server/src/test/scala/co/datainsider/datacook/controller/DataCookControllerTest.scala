package co.datainsider.datacook.controller

import co.datainsider.bi.TestServer
import co.datainsider.bi.domain.query.TableField
import co.datainsider.bi.engine.mysql.MysqlConnection
import co.datainsider.datacook.domain.Ids.EtlJobId
import co.datainsider.datacook.domain.MockData
import co.datainsider.datacook.domain.operator.{ExpressionFieldConfiguration, FieldType, NormalFieldConfiguration}
import co.datainsider.datacook.domain.persist.{MySQLJdbcPersistConfiguration, PersistentType}
import co.datainsider.datacook.domain.request.etl._
import co.datainsider.datacook.domain.response._
import co.datainsider.datacook.pipeline.operator.OperatorService.getDbName
import co.datainsider.schema.domain.PageResult
import com.twitter.finagle.http.{Response, Status}
import com.twitter.finatra.http.EmbeddedHttpServer
import com.twitter.inject.server.FeatureTest
import datainsider.client.domain.scheduler.{ScheduleMonthly, ScheduleOnce}
import datainsider.client.util.{JsonParser, ZConfig}

/**
  * @author tvc12 - Thien Vi
  * @created 09/20/2021 - 4:26 PM
  */
class DataCookControllerTest extends FeatureTest {
  override val server = new EmbeddedHttpServer(new TestServer)

  var jobId: EtlJobId = 0
  test("Create ETL") {
    val request = CreateEtlJobRequest(
      displayName = "Test create etl",
      operators = Array(MockData.mockOperator),
      scheduleTime = Some(ScheduleOnce(System.currentTimeMillis()))
    )
    val response: Response =
      server.httpPost("/data_cook/create", postBody = JsonParser.toJson(request), andExpect = Status.Ok)
    assertResult(true)(response != null)
    assertResult(true)(response.contentString != null)
    val result = JsonParser.fromJson[EtlJobResponse](response.contentString)
    assertResult(true)(result != null)
    jobId = result.id
  }

  test("List My ETL") {
    val request = ListEtlJobsRequest(from = 0, size = 100)
    val response: Response =
      server.httpPost("/data_cook/my_etl", postBody = JsonParser.toJson(request), andExpect = Status.Ok)
    assertResult(true)(response != null)
    assertResult(true)(response.contentString != null)
    val result = JsonParser.fromJson[PageResult[EtlJobResponse]](response.contentString)

    assertResult(true)(result.total > 0)
    assertResult(true)(result.data.nonEmpty)
  }
  test("List Share ETL with me") {
    val request = ListEtlJobsRequest(from = 0, size = 100)
    val response: Response =
      server.httpPost("/data_cook/shared", postBody = JsonParser.toJson(request), andExpect = Status.Ok)
    assertResult(true)(response != null)
    assertResult(true)(response.contentString != null)
    val result = JsonParser.fromJson[PageResult[EtlJobResponse]](response.contentString)

    assertResult(true)(result.total == 0)
    assertResult(true)(result.data.isEmpty)
  }

  test("Get ETL") {
    val response: Response = server.httpGet(s"/data_cook/$jobId", andExpect = Status.Ok)
    assertResult(true)(response != null)
    assertResult(true)(response.contentString != null)
    val result = JsonParser.fromJson[EtlJobResponse](response.contentString)

    assertResult(true)(result != null)
  }

  test("List ETL History") {
    val request = ListEtlJobsRequest(from = 0, size = 100)
    val response: Response =
      server.httpPost("/data_cook/history", postBody = JsonParser.toJson(request), andExpect = Status.Ok)
    assertResult(true)(response != null)
    assertResult(true)(response.contentString != null)
    val result = JsonParser.fromJson[PageResult[EtlJobHistoryResponse]](response.contentString)

    assertResult(true)(result.total >= 0)
  }

  test("Soft Delete ETL") {
    val response: Response = server.httpDelete(s"/data_cook/$jobId", andExpect = Status.Ok)
    assertResult(true)(response != null)
    assertResult(true)(response.contentString != null)
    val result = JsonParser.fromJson[EtlJobResponse](response.contentString)

    assertResult(true)(result != null)
  }

  test("List Trash") {
    val request = ListEtlJobsRequest(from = 0, size = 100)
    val response: Response =
      server.httpPost("/data_cook/trash", postBody = JsonParser.toJson(request), andExpect = Status.Ok)
    assertResult(true)(response != null)
    assertResult(true)(response.contentString != null)
    val result = JsonParser.fromJson[PageResult[EtlJobResponse]](response.contentString)

    assertResult(true)(result.total > 0)
    assertResult(true)(result.data.nonEmpty)
  }

  test("Restore ETL") {
    val response: Response = server.httpPost(s"/data_cook/trash/$jobId/restore", "{}", andExpect = Status.Ok)
    assertResult(true)(response != null)
    assertResult(true)(response.contentString != null)
    val result = JsonParser.fromJson[EtlJobResponse](response.contentString)

    assertResult(true)(result != null)
  }

  test("Edit ETL") {
    val request = UpdateEtlJobRequest(
      123,
      displayName = Some("Test edit etl"),
      operators = Some(Array(MockData.mockOperator)),
      Some(ScheduleMonthly(Set(1), 2, 0, 0, 0, System.currentTimeMillis()))
    )
    val response: Response =
      server.httpPut(s"/data_cook/$jobId", putBody = JsonParser.toJson(request), andExpect = Status.Ok)
    assertResult(true)(response != null)
    assertResult(true)(response.contentString != null)
    val result = JsonParser.fromJson[EtlJobResponse](response.contentString)

    assertResult(true)(result != null)
  }

  test("Soft Delete ETL again") {
    val response: Response = server.httpDelete(s"/data_cook/$jobId", andExpect = Status.Ok)
    assertResult(true)(response != null)
    assertResult(true)(response.contentString != null)
    val result = JsonParser.fromJson[EtlJobResponse](response.contentString)

    assertResult(true)(result != null)
  }

  test("Hard Delete ETL") {
    val response: Response = server.httpDelete(s"/data_cook/trash/$jobId", andExpect = Status.Ok)
    assertResult(true)(response != null)
    assertResult(true)(response.contentString != null)
    val result = JsonParser.fromJson[EtlJobResponse](response.contentString)

    assertResult(true)(result != null)
  }

  test("end preview etl job") {
    val request = EndPreviewEtlJobRequest(123)
    val response: Response = server.httpPost("/data_cook/456/end_preview", postBody = JsonParser.toJson(request), andExpect = Status.Ok)

//    val responseAsMap = JsonParser.fromJson[Map[String, Boolean]](response.contentString)
//    assertResult(true)(responseAsMap("data"))
  }

  test("Get database name") {
    val response: Response = server.httpGet("/data_cook/4/preview/database_name", andExpect = Status.Ok)

    val etlDatabaseResponse = JsonParser.fromJson[EtlDatabaseNameResponse](response.contentString)
    assertResult(true)(etlDatabaseResponse.databaseName != null)
    assertResult(getDbName(1, 4, "preview_etl"))(etlDatabaseResponse.databaseName)
  }

  test("Fields & ExtraFields To Query") {
    val request = ViewQueryRequest(
      4,
      Array(
        NormalFieldConfiguration(
          "Name as number 16",
          field = TableField("test", "animal", "id", "")
        ),
        NormalFieldConfiguration(
          "Name as number 16",
          field = TableField("test", "animal", "name", ""),
          asType = Some(FieldType.Int16)
        )
      ),
      Array(
        ExpressionFieldConfiguration("name_lower_case", "Name To Lower case", "lower(name)")
      )
    )
    val response: Response =
      server.httpPost("/data_cook/4/view_query", JsonParser.toJson(request), andExpect = Status.Ok)

    val queryResponse = JsonParser.fromJson[EtlQueryResponse](response.contentString)
    assertResult(4)(queryResponse.id)
    assertResult(queryResponse.query.trim)(
      """select tbl_d796e7.id as `Name as number 16`, cast(tbl_d796e7.name as Nullable(Int16)) as `Name as number 16`, lower(name) as `Name To Lower case`
        |from test.animal tbl_d796e7""".stripMargin
    )
  }

//  test("List Oracle database") {
//    val host: String = ZConfig.getString("data_cook.jdbc_test.oracle.host")
//    val port: Int = ZConfig.getInt("data_cook.jdbc_test.oracle.port")
//    val serviceName: String = ZConfig.getString("data_cook.jdbc_test.oracle.service_name")
//    val username: String = ZConfig.getString("data_cook.jdbc_test.oracle.username")
//    val password: String = ZConfig.getString("data_cook.jdbc_test.oracle.password")
//    val dbname: String = ZConfig.getString("data_cook.jdbc_test.oracle.dbname")
//    val request = ListThirdPartyDatabaseRequest(
//      OracleJdbcPersistConfiguration(
//        host,
//        port,
//        serviceName,
//        username,
//        password,
//        databaseName = dbname,
//        tableName = "",
//        persistType = PersistentType.Append
//      )
//    )
//    val response: Response =
//      server.httpPost("/data_cook/third_party/database/list", JsonParser.toJson(request), andExpect = Status.Ok)
//  }
  test("List Mysql database") {
    val mysqlSource = injector.instance[MysqlConnection]
    val dbname: String = ZConfig.getString("data_cook.jdbc_test.mysql.dbname")
    val request = ListThirdPartyDatabaseRequest(
      MySQLJdbcPersistConfiguration(
        mysqlSource.host,
        mysqlSource.port,
        mysqlSource.username,
        mysqlSource.password,
        databaseName = dbname,
        tableName = "",
        persistType = PersistentType.Append
      )
    )
    val response: Response =
      server.httpPost("/data_cook/third_party/database/list", JsonParser.toJson(request), andExpect = Status.Ok)
  }

//  test("List Oracle Table") {
//    val host: String = ZConfig.getString("data_cook.jdbc_test.oracle.host")
//    val port: Int = ZConfig.getInt("data_cook.jdbc_test.oracle.port")
//    val serviceName: String = ZConfig.getString("data_cook.jdbc_test.oracle.service_name")
//    val username: String = ZConfig.getString("data_cook.jdbc_test.oracle.username")
//    val password: String = ZConfig.getString("data_cook.jdbc_test.oracle.password")
//    val dbname: String = ZConfig.getString("data_cook.jdbc_test.oracle.dbname")
//    val request = ListThirdPartyTableRequest(
//      OracleJdbcPersistConfiguration(
//        host,
//        port,
//        serviceName,
//        username,
//        password,
//        databaseName = dbname,
//        tableName = "",
//        persistType = PersistentType.Append
//      ),
//      dbname
//    )
//    val response: Response =
//      server.httpPost("/data_cook/third_party/table/list", JsonParser.toJson(request), andExpect = Status.Ok)
//  }
  test("List Mysql Table") {
    val mysqlSource = injector.instance[MysqlConnection]
    val dbname: String = ZConfig.getString("data_cook.jdbc_test.mysql.dbname")
    val request = ListThirdPartyTableRequest(
      MySQLJdbcPersistConfiguration(
        mysqlSource.host,
        mysqlSource.port,
        mysqlSource.username,
        mysqlSource.password,
        databaseName = dbname,
        tableName = "",
        persistType = PersistentType.Append
      ),
      dbname
    )
    val response: Response =
      server.httpPost("/data_cook/third_party/database/list", JsonParser.toJson(request), andExpect = Status.Ok)
  }

  test("Create ETL 2") {
    val request = CreateEtlJobRequest(
      displayName = "Test create etl",
      operators = Array(MockData.mockOperator),
      scheduleTime = Some(ScheduleOnce(System.currentTimeMillis()))
    )
    val response: Response =
      server.httpPost("/data_cook/create", postBody = JsonParser.toJson(request), andExpect = Status.Ok)
    assertResult(true)(response != null)
    assertResult(true)(response.contentString != null)
    val result = JsonParser.fromJson[EtlJobResponse](response.contentString)
    assertResult(true)(result != null)
    jobId = result.id
  }

  test("Force run job") {
    val request = ForceRunRequest(id = jobId, atTime = System.currentTimeMillis())
    val response = server.httpPut(s"/data_cook/${jobId}/force_run", JsonParser.toJson(request), andExpect = Status.Ok)
    assertResult(true)(response != null)
  }

  test("Cancel job") {
    val response = server.httpPut(s"/data_cook/${jobId}/kill", "{}", andExpect = Status.Ok)
    assertResult(true)(response != null)
  }

  test("Migrate Data") {
    val response = server.httpPost("/data_cook/migrate", """
        |{
        | "admin_secret_key": "12345678"
        |}
        |""".stripMargin, andExpect = Status.Ok)
    assertResult(true)(response != null)
  }
}
