package co.datainsider.jobworker.service

import co.datainsider.bi.util.ZConfig
import co.datainsider.jobworker.domain.source.HubspotSource
import co.datainsider.jobworker.domain._
import co.datainsider.jobworker.service.hubspot.HubspotWorker
import co.datainsider.jobworker.service.hubspot.client.HubspotReader
import co.datainsider.jobworker.util.ClickhouseDbTestUtils
import co.datainsider.schema.client.SchemaClientService
import com.google.inject.name.Names
import com.twitter.util.Future

class HubspotWorkerTest extends AbstractWorkerTest {

  private val hubspotSource = HubspotSource(0, "", "pat-na1-5a7c134c-9be6-48d0-aa44-e1d37c591e76")
  private val hubspotJob = HubspotJob(
    orgId = 0,
    syncMode = SyncMode.FullSync,
    subType = HubspotObjectType.Contact,
    sourceId = 0,
    lastSuccessfulSync = 0,
    syncIntervalInMn = 0,
    lastSyncStatus = JobStatus.Init,
    currentSyncStatus = JobStatus.Init,
    destDatabaseName = "hubspot_data",
    destTableName = "contacts",
    destinations = Seq.empty
  )
  val jdbcUrl: String = injector.instance[String](Names.named("clickhouse_jdbc_url"))
  val username: String = ZConfig.getString("test_db.clickhouse.username")
  val password: String = ZConfig.getString("test_db.clickhouse.password")
  val dbTestUtils: ClickhouseDbTestUtils = new ClickhouseDbTestUtils(jdbcUrl, username, password)
  val destDatabaseName: String = hubspotJob.destDatabaseName

  val schemaService: SchemaClientService = injector.instance[SchemaClientService]

  override def beforeAll(): Unit = {
    dbTestUtils.createDatabase(destDatabaseName)
  }

  override def afterAll(): Unit = {
    dbTestUtils.dropDatabase(destDatabaseName)
  }
  def onProgress(progress: JobProgress): Future[Unit] = {
    println(progress)
    Future.Unit
  }

  test("test sync") {
    val reader = new HubspotReader(hubspotSource.apiKey, hubspotJob)
    val tableSchema = reader.getSchema
    dbTestUtils.createTable(tableSchema)

    val hubspotWorker = HubspotWorker(hubspotSource, schemaService, engine, connection)
    hubspotWorker.run(hubspotJob, 0, onProgress)

    val clickhouseClient = dbTestUtils.getClient()
    val countQuery = s"select count(*) from ${tableSchema.dbName}.${tableSchema.name}"

    clickhouseClient.executeQuery(countQuery)(rs =>
      if (rs.next()) {
        println(rs.getString(1))
        val count = rs.getLong(1)
        assert(count > 0)
      } else {
        println("error")
        fail()
      }
    )
  }

}
