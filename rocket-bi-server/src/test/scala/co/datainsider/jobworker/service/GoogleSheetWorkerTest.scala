package co.datainsider.jobworker.service

import co.datainsider.bi.util.ZConfig
import co.datainsider.caas.user_profile.util.JsonParser
import co.datainsider.jobworker.domain.job.GoogleSheetJob
import co.datainsider.jobworker.domain.{JobProgress, JobStatus}
import co.datainsider.jobworker.service.worker.GoogleSheetWorker
import co.datainsider.jobworker.util.{ClickhouseDbTestUtils, GoogleOAuthConfig}
import co.datainsider.schema.client.{MockSchemaClientService, SchemaClientService}
import com.google.inject.name.Names
import com.twitter.util.Future
import datainsider.client.domain.Implicits.{FutureEnhanceLike, ScalaFutureLike}
import education.x.commons.SsdbKVS
import org.nutz.ssdb4j.spi.SSDB
import org.scalatest.BeforeAndAfterAll

import scala.concurrent.ExecutionContext.Implicits.global

class GoogleSheetWorkerTest extends AbstractWorkerTest with BeforeAndAfterAll {

  val jdbcUrl: String = injector.instance[String](Names.named("clickhouse_jdbc_url"))
  val username: String = ZConfig.getString("test_db.clickhouse.username")
  val password: String = ZConfig.getString("test_db.clickhouse.password")
  val dbTestUtils: ClickhouseDbTestUtils = new ClickhouseDbTestUtils(jdbcUrl, username, password)
  val destDatabaseName: String = ZConfig.getString("fake_data.database.default.name", default = "database_test")
  val destTblName: String = ZConfig.getString("fake_data.table.student.name", default = "student")
  val googleOAuthConfig = GoogleOAuthConfig(
    clientId = ZConfig.getString("google.gg_client_id"),
    clientSecret = ZConfig.getString("google.gg_client_secret"),
    redirectUri = ZConfig.getString("google.redirect_uri"),
    serverEncodedUrl = ZConfig.getString("google.server_encoded_url")
  )

  override def beforeAll(): Unit = {
    dbTestUtils.createDatabase(destDatabaseName)
    dbTestUtils.createTable(destDatabaseName, destTblName)
  }

  override def afterAll(): Unit = {
    dbTestUtils.dropDatabase(destDatabaseName)
  }

  val schemaService: SchemaClientService = injector.instance[MockSchemaClientService]
  val ssdbClient: SSDB = injector.instance[SSDB]
  val ssdbKVS: SsdbKVS[Long, Boolean] = SsdbKVS[Long, Boolean]("test_worker", ssdbClient)

  val job = JsonParser.fromJson[GoogleSheetJob]("""
        |{
        |  "access_token" : "ya29.a0AbVbY6NgJpiVAZqTq3IWfCr9MU9G23TAFG9RZ04g8g-ARy8GYmzFB6jOdHjh_lahoclJAiyAkPDQ3PqppIuz6bqhamcQ04lEFg_eywiD-6pyfZEzzRO03lerde5cLxwBWFRRe6N4cx8vXfuTJ_Jh2sILt_s2HxQaCgYKAVcSARISFQFWKvPl-RvzTB3J11Hugu1_ZzbrqQ0166",
        |  "sheet_id" : 544895106,
        |  "refresh_token" : "1//0e9VofJiFUOE_CgYIARAAGA4SNwF-L9IrzJHDL84aMZnBMHnJxcWP22i0XNz1NJ8X5wdJITdmOzMxs5cKpBr01zsClLcqRKWRjyg",
        |  "schema" : {
        |    "name" : "test_google_sheet_data",
        |    "db_name" : "database_test",
        |    "organization_id" : 0,
        |    "display_name" : "test_google_sheet_data",
        |    "columns" : [ {
        |      "class_name" : "string",
        |      "name" : "string",
        |      "display_name" : "string",
        |      "description" : null,
        |      "default_value" : null,
        |      "is_nullable" : true,
        |      "is_encrypted" : false,
        |      "default_expr" : null,
        |      "default_expression" : null
        |    }, {
        |      "class_name" : "string",
        |      "name" : "nullable_string",
        |      "display_name" : "nullable_string",
        |      "description" : null,
        |      "default_value" : null,
        |      "is_nullable" : true,
        |      "is_encrypted" : false,
        |      "default_expr" : null,
        |      "default_expression" : null
        |    }, {
        |      "class_name" : "int32",
        |      "name" : "int",
        |      "display_name" : "int",
        |      "description" : null,
        |      "default_value" : null,
        |      "is_nullable" : true,
        |      "is_encrypted" : false,
        |      "default_expr" : null,
        |      "default_expression" : null
        |    }, {
        |      "class_name" : "int32",
        |      "name" : "nullabe_int",
        |      "display_name" : "nullabe_int",
        |      "description" : null,
        |      "default_value" : null,
        |      "is_nullable" : true,
        |      "is_encrypted" : false,
        |      "default_expr" : null,
        |      "default_expression" : null
        |    }, {
        |      "class_name" : "double",
        |      "name" : "double",
        |      "display_name" : "double",
        |      "description" : null,
        |      "default_value" : null,
        |      "is_nullable" : true,
        |      "is_encrypted" : false,
        |      "default_expr" : null,
        |      "default_expression" : null
        |    }, {
        |      "class_name" : "double",
        |      "name" : "nullabe_double",
        |      "display_name" : "nullabe_double",
        |      "description" : null,
        |      "default_value" : null,
        |      "is_nullable" : true,
        |      "is_encrypted" : false,
        |      "default_expr" : null,
        |      "default_expression" : null
        |    }, {
        |      "class_name" : "datetime",
        |      "name" : "date",
        |      "display_name" : "date",
        |      "description" : null,
        |      "timezone" : null,
        |      "input_as_timestamp" : false,
        |      "input_timezone" : null,
        |      "input_formats" : [ "yyyy-MM-dd HH:mm:ss" ],
        |      "default_value" : null,
        |      "is_nullable" : true,
        |      "is_encrypted" : false,
        |      "default_expr" : null,
        |      "default_expression" : null
        |    }, {
        |      "class_name" : "datetime",
        |      "name" : "nullabe_date",
        |      "display_name" : "nullabe_date",
        |      "description" : null,
        |      "timezone" : null,
        |      "input_as_timestamp" : false,
        |      "input_timezone" : null,
        |      "input_formats" : [ "yyyy-MM-dd HH:mm:ss" ],
        |      "default_value" : null,
        |      "is_nullable" : true,
        |      "is_encrypted" : false,
        |      "default_expr" : null,
        |      "default_expression" : null
        |    }, {
        |      "class_name" : "bool",
        |      "name" : "bool",
        |      "display_name" : "bool",
        |      "description" : null,
        |      "default_value" : null,
        |      "is_nullable" : true,
        |      "is_encrypted" : false,
        |      "default_expr" : null,
        |      "default_expression" : null
        |}, {
        |      "class_name" : "bool",
        |      "name" : "nullable bool",
        |      "display_name" : "nullable bool",
        |      "description" : null,
        |      "default_value" : null,
        |      "is_nullable" : true,
        |      "is_encrypted" : false,
        |      "default_expr" : null,
        |      "default_expression" : null
        |}, {
        |      "class_name" : "string",
        |      "name" : "empty_col",
        |      "display_name" : "empty_col",
        |      "description" : null,
        |      "default_value" : null,
        |      "is_nullable" : true,
        |      "is_encrypted" : false,
        |      "default_expr" : null,
        |      "default_expression" : null
        |    } ],
        |    "engine" : null,
        |    "primary_keys" : [ ],
        |    "partition_by" : [ ],
        |    "order_bys" : [ ],
        |    "query" : null,
        |    "table_type" : "default",
        |    "table_status" : null,
        |    "ttl" : null,
        |    "expression_columns" : [ ],
        |    "calculated_columns" : [ ],
        |    "temporary" : false
        |  },
        |  "schedule_time" : "{\n  \"class_name\" : \"schedule_once\",\n  \"start_time\" : 1689059968000\n}",
        |  "include_header" : true,
        |  "spread_sheet_id" : "1Y-qG_Gl4cQd3o3IJTRpFCzBumjVdxVCLeZkMO3IIPUQ",
        |  "class_name" : "google_sheets_job",
        |  "dest_database_name" : "database_test",
        |  "dest_table_name" : "test_google_sheet_data",
        |  "destinations" : [ "Clickhouse" ]
        |} 
        |""".stripMargin)

  ssdbKVS.add(1, true).asTwitter.syncGet()
  val worker = new GoogleSheetWorker(
    schemaService = schemaService,
    ssdbKVS,
    googleOAuthConfig,
    engine = engine,
    connection = connection
  )

  test("test sync google sheet") {
    dbTestUtils.createTable(job.schema) // ensure schema
    val finalProgress = worker.run(job, 1, onProgress)
    assert(finalProgress.jobStatus == JobStatus.Synced)
    assert(finalProgress.totalSyncRecord > 0)
  }

  def onProgress(progress: JobProgress): Future[Unit] = {
    println(progress)
    Future.Unit
  }
}
