/*
package datainsider.jobscheduler.controller

import com.twitter.finatra.http.EmbeddedHttpServer
import com.twitter.finatra.thrift.ThriftClient
import com.twitter.inject.server.FeatureTest
import datainsider.jobscheduler.TestServer
import com.twitter.finagle.http.Status
import datainsider.jobscheduler.domain.DatabaseType
import datainsider.jobscheduler.domain.Ids.SourceId
import datainsider.jobscheduler.domain.request.CreateJdbcSourceRequest
import datainsider.jobscheduler.service.DataSourceService
import datainsider.jobscheduler.util.Implicits.FutureEnhance

class JobControllerTest extends FeatureTest {

  override protected def server = new EmbeddedHttpServer(twitterServer = new TestServer)

  val dataSourceService: DataSourceService = injector.instance[DataSourceService]

  var id: SourceId = 0


  test("test preview") {
    val request = CreateJdbcSourceRequest("test", DatabaseType.Oracle, "Oracle-db-test.cp163tfqt4gc.ap-southeast-1.rds.amazonaws.com", "1521/ORCL", "admin", "datainsider")
    val datasource = dataSourceService.create(request).sync()
    id = datasource.getId
    val r = server.httpPost(
      path = "/job/preview?from=0&size=5",
      postBody = s"""
          |{
          | "class_name": "create_jdbc_job_request",
          |	"data_source_id": $id,
          |	"database_name": "test",
          |	"table_name": "person"
          |}
          |""".stripMargin,
      andExpect = Status.Ok,
      headers = Map("Access-Token" -> "job$cheduler@datainsider.co")
    )
    val response = r.getContentString()
    println(response)
    assert(
      response.equals(
        "[[\"ID\",\"NAME\",\"AGE\"],[\"1\",\"hello\",\"123\"],[\"2\",\"world\",\"234\"]," +
          "[\"3\",\"one\",\"345\"],[\"4\",\"two\",\"2\"],[\"5\",\"three\",\"5\"]]"
      )
    )
  }

  test("test preview wrong database") {
    val r = server.httpPost(
      path = "/job/preview?from=0&size=5",
      postBody = s"""
           |{
           | "class_name": "create_jdbc_job_request",
           |	"data_source_id": $id,
           |	"database_name": "wrong_test",
           |	"table_name": "person"
           |}
           |""".stripMargin,
      andExpect = Status.Ok,
      headers = Map("Access-Token" -> "job$cheduler@datainsider.co")
    )
    val response = r.getContentString()
    assert(response.equals("[]"))
  }

  test("test not found datasource") {
    val r = server.httpPost(
      path = "/job/preview?from=0&size=5",
      postBody = s"""
           |{
           | "class_name": "create_jdbc_job_request",
           |	"data_source_id": 9999,
           |	"database_name": "wrong_job_scheduler_schema",
           |	"table_name": "job"
           |}
           |""".stripMargin,
      andExpect = Status.NotFound,
      headers = Map("Access-Token" -> "job$cheduler@datainsider.co")
    )
    val response = r.getContentString()
    assert(response.equals("{\"errors\":[\"Not found datasource\"]}"))
  }

  /*test("Lack of class_name") {
    val r = server.httpPost(
      path = "/job/preview?from=0&size=5",
      postBody = s"""
           |{
           |	"data_source_id": $id,
           |	"database_name": "wrong_job_scheduler_schema",
           |	"table_name": "job"
           |}
           |""".stripMargin,
      andExpect = Status.InternalServerError,
      headers = Map("Access-Token" -> "job$cheduler@datainsider.co")
    )
    val response = r.getContentString()
    val resultExpected = "{\"success\":false," +
      "\"error\":{" +
      "\"code\":500," +
      "\"reason\":\"internal_error\"," +
      "\"message\":\"Missing type id when trying to resolve subtype of [simple type, class datainsider.jobscheduler.domain.request.CreateJobRequest]" +
      ": missing type id property 'class_name'\\n at [Source: (com.twitter.io.BufInputStream); line: 6, column: 1]\"" +
      "}" +
      "}"
    assert(response.equals(resultExpected))
  }*/ // TODO: unknown error "Too many connections"
}
*/
