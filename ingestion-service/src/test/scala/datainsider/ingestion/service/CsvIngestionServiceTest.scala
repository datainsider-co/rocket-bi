package datainsider.ingestion.service

import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import datainsider.client.module.MockCaasClientModule
import datainsider.client.util.{HttpClient, JsonParser}
import datainsider.ingestion.domain._
import datainsider.ingestion.module.TestModule
import datainsider.module.MockHadoopFileClientModule

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

    val a = HttpClient.post(s"$host/ingestion/csv/detect", JsonParser.toJson(request))
    println(a)

    //    val csvSchemaResponse: CsvSchemaResponse = Await.result(csvIngestionService.detectSchema(request))
    val csvSchemaResponse = JsonParser.fromJson[CsvSchemaResponse](a.data.toString)
    csvSchema = csvSchemaResponse.schema
    //    println(csvSchema)
  }

  test("test register schema") {
    val tableSchema = csvSchema.copy(dbName = dbName, name = tblName)
    //    val registerResponse = Await.result(
    //      csvIngestionService.registerSchema(RegisterCsvSchemaRequest(apiKey, tableSchema))
    //    )
    val a = HttpClient.post(
      s"$host/ingestion/csv/schema",
      JsonParser.toJson(RegisterCsvSchemaRequest(tableSchema))
    )
    println(a)
    //    println(registerResponse)
  }

  test("test ingest csv") {
    val t1 = System.currentTimeMillis()

    val csvData = ArrayBuffer.empty[String]

    def ingestData(): Unit = {
      val ingestRequest = IngestCsvRequest(dbName, tblName, csvSetting, csvData.mkString("\n"))
//      val ingestResponse = Await.result(csvIngestionService.ingestBatch(ingestRequest))
      val begin = System.currentTimeMillis()
      val a = HttpClient.post(s"$host/ingestion/csv", JsonParser.toJson(ingestRequest))
      println(a + s" time: ${System.currentTimeMillis() - begin} ms")
      csvData.clear()
//      println(ingestResponse)
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
