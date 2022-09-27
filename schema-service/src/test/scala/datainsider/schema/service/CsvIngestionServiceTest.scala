package datainsider.schema.service

import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import datainsider.client.filter.MockUserContext
import datainsider.client.module.MockCaasClientModule
import datainsider.schema.domain._
import datainsider.schema.module.{MockHadoopFileClientModule, TestModule}

import java.io.{BufferedReader, File, FileReader}
import scala.collection.mutable.ArrayBuffer

class CsvIngestionServiceTest extends IntegrationTest {

  override val injector: Injector =
    TestInjector(TestModule, MockCaasClientModule, MockHadoopFileClientModule).newInstance()
  val csvIngestionService: CsvIngestionService = injector.instance[CsvIngestionService]

  val file = new File(getClass.getClassLoader.getResource("datasets/ExportFile-Keap.csv").getPath)
  val reader = new BufferedReader(new FileReader(file))
  val csvSetting: CsvSetting = CsvSetting(includeHeader = true)

  val batchSize = 1000
  val host = "http://localhost:8489"
  val apiKey = "c2c09332-14a1-4eb1-8964-2d85b2a561c8"
  val dbName = "csv_ingestion"
  val tblName = "failed_csv12"

  var csvSchema: TableSchema = null
  test("test detect schema") {
    val sampleLines = ArrayBuffer.empty[String]
    for (_ <- 0 until 100) {
      val line = reader.readLine()
      sampleLines += line
    }
    val request = DetectCsvSchemaRequest(
      sample = sampleLines.mkString("\n"),
      schema = None,
      csvSetting = csvSetting
    )

    val csvSchemaResponse: CsvSchemaResponse = await(csvIngestionService.detectSchema(request))
    csvSchema = csvSchemaResponse.schema
    println(csvSchema)
  }

  test("test register schema") {
    val tableSchema = csvSchema.copy(dbName = dbName, name = tblName)
    val registerCsvSchemaRequest = RegisterCsvSchemaRequest(tableSchema, MockUserContext.getLoggedInRequest(0L, "root"))
    val registerResponse = await(csvIngestionService.registerSchema(registerCsvSchemaRequest))
    println(registerResponse)
  }

  test("test ingest csv") {
    val t1 = System.currentTimeMillis()

    val csvData = ArrayBuffer.empty[String]

    def ingestData(): Unit = {
      val ingestRequest = IngestCsvRequest(dbName, tblName, csvSetting, csvData.mkString("\n"), MockUserContext.getLoggedInRequest(0L, "root"))
      val ingestResponse = await(csvIngestionService.ingestCsv(ingestRequest))
      val begin = System.currentTimeMillis()
      println(s" time: ${System.currentTimeMillis() - begin} ms")
      csvData.clear()
      println(ingestResponse)
    }

    var line: String = null
    var count = 0
    do {
      line = reader.readLine()
      if (line != null) csvData += line
      count += 1

      if (count % batchSize == 0) {
        ingestData()
      }

    } while (line != null)
    reader.close()

    ingestData()

    println(s"ingestion time: ${System.currentTimeMillis() - t1}")

  }

}
