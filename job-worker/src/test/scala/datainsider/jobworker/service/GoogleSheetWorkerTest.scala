package datainsider.jobworker.service

import com.twitter.inject.{Injector, IntegrationTest}
import com.twitter.inject.app.TestInjector
import com.twitter.util.Future
import datainsider.client.domain.Implicits.{FutureEnhanceLike, ScalaFutureLike}
import datainsider.client.domain.schema.TableSchema
import datainsider.client.domain.schema.column.{Column, DateColumn, FloatColumn, Int32Column, Int64Column, StringColumn}
import datainsider.client.module.{MockSchemaClientModule, SchemaClientModule}
import datainsider.client.service.{MockSchemaClientService, SchemaClientService}
import datainsider.jobworker.domain.{DatabaseType, GoogleSheetJob, JdbcSource, JobProgress, JobStatus}
import datainsider.jobworker.module.TestModule
import datainsider.jobworker.service.worker.GoogleSheetWorker
import datainsider.jobworker.util.{ClickhouseDbTestUtils, ZConfig}
import education.x.commons.SsdbKVS
import org.nutz.ssdb4j.spi.SSDB
import org.scalatest.BeforeAndAfterAll

import scala.concurrent.ExecutionContext.Implicits.global

class GoogleSheetWorkerTest extends IntegrationTest with BeforeAndAfterAll {

  val jdbcUrl: String = ZConfig.getString("database_test.clickhouse.url")
  val username: String = ZConfig.getString("database_test.clickhouse.username")
  val password: String = ZConfig.getString("database_test.clickhouse.password")
  val dbTestUtils: ClickhouseDbTestUtils = new ClickhouseDbTestUtils(jdbcUrl, username, password)
  val destDatabaseName: String = ZConfig.getString("fake_data.database.default.name", default = "database_test")
  val destTblName: String = ZConfig.getString("fake_data.table.student.name", default = "student")

  override def beforeAll(): Unit = {
    dbTestUtils.createDatabase(destDatabaseName)
    dbTestUtils.createTable(destDatabaseName, destTblName)
  }

  override def afterAll(): Unit = {
    dbTestUtils.dropDatabase(destDatabaseName)
  }

  override protected def injector: Injector = TestInjector(TestModule, MockSchemaClientModule).newInstance()
  val schemaService: SchemaClientService = injector.instance[MockSchemaClientService]
  val ssdbClient: SSDB = injector.instance[SSDB]
  val ssdbKVS: SsdbKVS[Long, Boolean] = SsdbKVS[Long, Boolean]("test_worker", ssdbClient)

  val job = GoogleSheetJob(
    1,
    jobId = 2,
    sourceId = 0L,
    lastSuccessfulSync = 0L,
    syncIntervalInMn = 0,
    lastSyncStatus = JobStatus.Init,
    currentSyncStatus = JobStatus.Queued,
    displayName = "test",
    destDatabaseName = destDatabaseName,
    destTableName = destTblName,
    destinations = Seq.empty,
    spreadSheetId = "1V0V9Fs8jhHedLYgNwE1X4pfT1zVSaG_xQW7cIPvxuAQ",
    sheetId = 1257025455,
    schema = TableSchema(
      name = destTblName,
      dbName = destDatabaseName,
      organizationId = 1,
      displayName = "student",
      columns = Seq(
        Int32Column("id", "Id"),
        StringColumn("name", "Name", isNullable = true),
        StringColumn("address", "Address", isNullable = true),
        Int64Column("age", "Age", isNullable = true),
        DateColumn("birthday", "Date of birth", isNullable = true),
        Int64Column("gender", "Gender"),
        FloatColumn("average_score", "Average score"),
        StringColumn("email", "Email")
      )
    ),
    includeHeader = true,
    refreshToken =
      "1//0ernD_65YgbT0CgYIARAAGA4SNwF-L9Ir_oIZZTv4iIUAiL-YsSVcKXNOjz7SP28PSFvXLLckILblezy3cX6v_veJTasCZbjJgKM",
    accessToken =
      "ya29.a0AVA9y1tZmu5qeswbhT08qnhCnB74Vdkle5WMKjF7e3TOem72B3lMGMIiMtu92XKNZJcrBYLzJ4xn2SWXv5jcg2HnxTFNg76mwukYq8rishlKBZx8XdoSQxbLNhEr1-8IEyITVqE_DPdP8adhtHGmwp9hj2W5aCgYKATASARISFQE65dr8RVeN08dF_jBPdbp6eSEn_g0163"
  )

  ssdbKVS.add(1, true).asTwitter.syncGet()
  val worker = new GoogleSheetWorker(schemaService = schemaService, ssdbKVS)

  test("google sheet worker") {
    val finalProgress = worker.run(job, 1, onProgress)
    assert(finalProgress.jobStatus == JobStatus.Synced)
  }

  def onProgress(progress: JobProgress): Future[Unit] = {
    println(progress)
    Future.Unit
  }
}
