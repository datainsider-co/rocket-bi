package datainsider.ingestion.repository

import com.twitter.inject.{Injector, IntegrationTest, Test}
import com.twitter.inject.app.TestInjector
import com.twitter.util.Await
import datainsider.analytics.module.TrackingModule
import datainsider.client.module.MockCaasClientModule
import datainsider.ingestion.domain._
import datainsider.ingestion.module.MainModule
import datainsider.module.MockHadoopFileClientModule
import education.x.commons.SsdbKVS
import org.nutz.ssdb4j.spi.SSDB

import scala.concurrent.{ExecutionContext, ExecutionContextExecutor}

class CsvInfoRepositoryTest extends IntegrationTest {

  override val injector: Injector =
    TestInjector(MainModule, MockCaasClientModule, TrackingModule, MockHadoopFileClientModule)
      .newInstance()
  val client: SSDB = injector.instance[SSDB]
  implicit val ec: ExecutionContextExecutor = ExecutionContext.global

  private val dbKVS = SsdbKVS[String, CsvUploadInfo](s"di.csv_upload_info", client)
  val csvInfoRepository = new SsdbCsvRepository(dbKVS)
  test("put csv upload info") {
    val columns = Seq(
      Int32Column("id", "id"),
      StringColumn("name", "name"),
      DoubleColumn("height", "height"),
      UInt64Column("age", "age"),
      DateTimeColumn("dob", "dob"),
      BoolColumn("is_dead", "is_dead")
    )
    val tableSchema: TableSchema = TableSchema("", "", 1, "", columns)
    val csvSetting: CsvSetting = CsvSetting(delimiter = ",", includeHeader = true)
    val csvInfo = CsvUploadInfo(
      id = "covid_2021.csv",
      batchSize = 1000,
      schema = tableSchema,
      csvSetting = csvSetting,
      10000,
      Seq(4, 7, 9),
      isDone = false
    )

    val test = Await.result(csvInfoRepository.put(csvInfo))
    assert(test)
  }

  test("get csv upload info") {
    val csv = Await.result(csvInfoRepository.get("covid_2021.csv"))
    assert(csv.isDefined)
    println(csv.get)
  }
}
