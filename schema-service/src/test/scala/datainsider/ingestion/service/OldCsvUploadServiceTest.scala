//package datainsider.ingestion.service
//
//import com.google.inject.name.Names
//import com.twitter.inject.app.TestInjector
//import com.twitter.inject.{Injector, IntegrationTest}
//import com.twitter.util.Await
//import datainsider.analytics.module.TrackingModule
//import datainsider.client.module.MockCaasClientModule
//import datainsider.client.util.{JdbcClient, JsonParser}
//import datainsider.ingestion.controller.http.requests.DeleteDBRequest
//import datainsider.ingestion.domain._
//import datainsider.ingestion.module.{MainModule, ShareModule, TestModule}
//import datainsider.ingestion.util.ClickHouseUtils
//import datainsider.module.MockHadoopFileClientModule
//import org.scalatest.BeforeAndAfterAll
//
//class OldCsvUploadServiceTest extends IntegrationTest with BeforeAndAfterAll {
//  override val injector: Injector = TestInjector(
//    MainModule,
//    MockCaasClientModule,
//    ShareModule,
//    TrackingModule,
//    MockHadoopFileClientModule
//  ).newInstance()
//
//  val schemaService: SchemaService = injector.instance[SchemaService]
//  val csvService: OldCsvUploadService = injector.instance[OldCsvUploadService]
//  val jdbcClient: JdbcClient = injector.instance[JdbcClient](Names.named("clickhouse"))
//  val testDb = "org1_test_upload_csv"
//  val orgId = 1L
//
//  override def beforeAll(): Unit = {
//    super.beforeAll()
//    val dbName = ClickHouseUtils.buildDatabaseName(1L, testDb.drop(5))
//    Await.result(schemaService.ensureDatabaseCreated(1L, dbName))
//  }
//
//  override def afterAll(): Unit = {
//    super.afterAll()
//    Await.result(schemaService.deleteDatabase(orgId, DeleteDBRequest(testDb)))
//  }
//
//  val fileName = "baby_names.csv"
//  val expectedRowCount = 10
//  val csvSetting: CsvSetting = CsvSetting(includeHeader = false, addBatchInfo = false)
//
//  val csvData: String = s"""1992-01-02,2007,KINGS,11.9,1996-04-06 23:59:59
//                   |1992-01-03,2007,SUFFOLK,6.1,1996-03-06 00:00:00
//                   |1992-01-03,2007,MONROE,6.2,1996-08-06 01:00:00
//                   |1992-01-06,2007,ERIE,9.4,1996-08-05 00:01:00
//                   |1992-01-07,2007,ULSTER,5.5,1996-08-04 00:02:00
//                   |1992-01-08,2007,WESTCHESTER,24.3,1993-08-06 00:00:00
//                   |1992-01-09,2007,BRONX,13.5,1996-08-02 00:02:00
//                   |1992-01-11,2007,NEW YORK,55.0,1996-08-06 10:00:00
//                   |1992-01-20,2007,NASSAU,15.9,1996-01-06 05:00:00
//                   |1992-02-01,2007,ERIE,6.5,1996-02-06 01:00:00""".stripMargin
//
//  var columns: Seq[Column] = Nil
//  test("test preview schema") {
//    val previewReq = DetectCsvSchemaRequest(csvData, None, csvSetting)
//    val previewResp = Await.result(csvService.preview(previewReq))
//
//    assert(previewResp != null)
//    assert(previewResp.records.length == expectedRowCount)
//
//    columns = previewResp.schema.columns
//  }
//
//  var tableSchema: TableSchema = null
//  var csvInfo: CsvUploadInfo = null
//  test("test register csv") {
////    val schema: TableSchema = TableSchema(
////      dbName = testDb,
////      name = "baby_names2",
////      displayName = "Baby Names",
////      organizationId = 1,
////      columns = columns
////    )
//
//    val schemaJson =
//      s"""
//         |{
//         |  "name" : "baby_names",
//         |  "db_name" : "org1_test_upload_csv",
//         |  "organization_id" : 1,
//         |  "display_name" : "Baby Names",
//         |  "columns" : [ {
//         |    "class_name" : "date",
//         |    "name" : "_c0",
//         |    "display_name" : "_c0",
//         |    "description" : null,
//         |    "timezone" : null,
//         |    "input_as_timestamp" : false,
//         |    "input_timezone" : null,
//         |    "input_formats" : [ "yyyy-MM-dd" ],
//         |    "default_value" : null,
//         |    "is_nullable" : true,
//         |    "default_expr" : null,
//         |    "default_expression" : null
//         |  }, {
//         |    "class_name" : "int32",
//         |    "name" : "_c1",
//         |    "display_name" : "_c1",
//         |    "description" : null,
//         |    "default_value" : null,
//         |    "is_nullable" : true,
//         |    "default_expr" : null,
//         |    "default_expression" : null
//         |  }, {
//         |    "class_name" : "string",
//         |    "name" : "_c2",
//         |    "display_name" : "_c2",
//         |    "description" : null,
//         |    "default_value" : null,
//         |    "is_nullable" : true,
//         |    "default_expr" : null,
//         |    "default_expression" : null
//         |  }, {
//         |    "class_name" : "double",
//         |    "name" : "_c3",
//         |    "display_name" : "_c3",
//         |    "description" : null,
//         |    "default_value" : null,
//         |    "is_nullable" : true,
//         |    "default_expr" : null,
//         |    "default_expression" : null
//         |  }, {
//         |    "class_name" : "datetime",
//         |    "name" : "_c4",
//         |    "display_name" : "_c4",
//         |    "description" : null,
//         |    "timezone" : null,
//         |    "input_as_timestamp" : false,
//         |    "input_timezone" : null,
//         |    "input_formats" : [ "yyyy-MM-dd HH:mm:ss" ],
//         |    "default_value" : null,
//         |    "is_nullable" : true,
//         |    "default_expr" : null,
//         |    "default_expression" : null
//         |  } ],
//         |  "engine" : null,
//         |  "primary_keys" : [ ],
//         |  "partition_by" : [ ],
//         |  "order_bys" : [ ],
//         |  "query" : null,
//         |  "table_type" : null,
//         |  "temporary" : false
//         |}
//         |""".stripMargin
//
//    tableSchema = JsonParser.fromJson[TableSchema](schemaJson)
//    println(tableSchema)
//
//    val registerResp: CsvUploadInfo =
//      Await.result(csvService.register(OldCsvRegisterRequest(fileName, 10, tableSchema, csvSetting)))
//
//    assert(registerResp != null)
//    csvInfo = registerResp
//  }
//
//  test("test upload csv data") {
//    val uploadReq = OldCsvUploadRequest(csvInfo.id, 10, csvData, isEnd = true)
//    val uploadResp: OldCsvUploadResponse = Await.result(csvService.uploadBatch(uploadReq))
//    assert(uploadResp != null)
//    Thread.sleep(3000)
//
//    val countQuery = s"select count(*) from $testDb.${tableSchema.name}"
//    val rowInserted = jdbcClient.executeQuery(countQuery)(rs => {
//      if (rs.next()) rs.getInt(1)
//      else 0
//    })
//    assert(rowInserted == expectedRowCount)
//  }
//}
