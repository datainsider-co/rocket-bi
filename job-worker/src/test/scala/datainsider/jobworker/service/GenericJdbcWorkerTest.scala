package datainsider.jobworker.service

import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import com.twitter.util.Future
import datainsider.client.module.MockSchemaClientModule
import datainsider.client.service.{MockSchemaClientService, SchemaClientService}
import datainsider.jobworker.domain._
import datainsider.jobworker.module.TestModule
import datainsider.jobworker.service.worker.GenericJdbcWorker
import education.x.commons.SsdbKVS
import org.nutz.ssdb4j.spi.SSDB

class GenericJdbcWorkerTest extends IntegrationTest {

  override protected def injector: Injector = TestInjector(TestModule, MockSchemaClientModule).newInstance()
  val schemaService: SchemaClientService = injector.instance[MockSchemaClientService]
  val ssdbClient: SSDB = injector.instance[SSDB]
  val ssdbKVS: SsdbKVS[Long, Boolean] = SsdbKVS[Long, Boolean]("test_worker", ssdbClient)

  test("test generic jdbc worker") {
    val job: GenericJdbcJob = GenericJdbcJob(
      1,
      jobId = 1,
      sourceId = 1,
      jobType = JobType.Jdbc,
      lastSyncStatus = JobStatus.Init,
      currentSyncStatus = JobStatus.Init,
      lastSuccessfulSync = 0L,
      syncIntervalInMn = 1,
      databaseName = "caas",
      tableName = "user",
      destDatabaseName = "hau_db",
      destTableName = "test_table",
      destinations = Seq(DataDestination.Clickhouse),
      incrementalColumn = None,
      query = None,
      lastSyncedValue = "0",
      maxFetchSize = 1000
    )
    val source: JdbcSource = JdbcSource(
      1,
      1,
      displayName = "local MySql",
      databaseType = DatabaseType.MySql,
      jdbcUrl = "jdbc:mysql://di-mysql:3306",
      username = "root",
      password = "di@2020!"
    )

    val syncId = 1
    ssdbKVS.add(syncId, true)
    val worker: GenericJdbcWorker = new GenericJdbcWorker(source, schemaService, ssdbKVS)
    val progress = worker.run(job, syncId, onProgress)
    println(progress)
  }

  def onProgress(progress: JobProgress): Future[Unit] = {
    Future.Unit
  }
}
