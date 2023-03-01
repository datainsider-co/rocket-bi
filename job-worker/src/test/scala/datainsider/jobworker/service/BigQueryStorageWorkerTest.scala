package datainsider.jobworker.service

import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import com.twitter.util.Future
import datainsider.client.module.MockSchemaClientModule
import datainsider.client.service.{MockSchemaClientService, SchemaClientService}
import datainsider.jobworker.client.NativeJdbcClient
import datainsider.jobworker.domain._
import datainsider.jobworker.module.TestModule
import datainsider.jobworker.service.worker.BigQueryStorageWorker
import datainsider.jobworker.util.ZConfig
import education.x.commons.SsdbKVS
import org.nutz.ssdb4j.spi.SSDB

class BigQueryStorageWorkerTest extends IntegrationTest {

  override protected def injector: Injector = TestInjector(TestModule, MockSchemaClientModule).newInstance()

  override def beforeAll(): Unit = {
    ensureSchema(destinationSource)
  }
  val schemaService: SchemaClientService = injector.instance[MockSchemaClientService]
  val dataSource: GoogleServiceAccountSource = GoogleServiceAccountSource(
    orgId = 0L,
    id = 1L,
    displayName = "datasource",
    credential =
      "{\n  \"type\": \"service_account\",\n  \"project_id\": \"sincere-elixir-234203\",\n  \"private_key_id\": \"c0b291aee88523719487bfeaf80fc462b0c6d2ae\",\n  \"private_key\": \"-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDIZNIDaIsE1tfy\\n9ncjJDHfmVwG00K9EbXQ1dgxWd7k+68rEaoD/wwk4xb4DijycXbxRkAMO6O6XqIZ\\nyqS1ODHnWOJAQn95gmGpiNZdUI7yYFzWH076zptwUy/RGHHpnBM43VE6zG3AFQdA\\nZP5FMJh1ESfwo80eKzZCqZtjZUKDk7/C8/rUwDpbIWCayWu+2F1UUy/acCPIpiay\\n+tbh16QMc0iX6ohiEDExU3pt/Q3FBvsdLZtmUMNvUG8YrwPEmF7SF9GqVVM5TJj0\\n6o3tZ7oa/gvDqBxKrYUAkkfWtuCJZqQI1R6gJ2+TRFFyIYfD7VdIshuxNFrs8cWT\\nmPOO3HSzAgMBAAECggEANGjJ1EJfOWDHEbAL8JDiykvdmZte9PvQxVFoPV/3v4Nj\\niKwR/wGRN4R82Vs6sk2ige+RiKGAbJmbY4twEEUmKA9C/PNnS2wiBqjXB4iuGg3B\\nue5uRYILfREEjHcMM8Cx9klLmUkl2vqk7t568bWH6fYWsATm/GDoy/53uUMeZjKj\\nZpV7GaMWiJp7B4OgaibhkHdhnDoI6g46yHOPHJL8C9161K+QnHqJvIiqQNvUSi1v\\nFYBdFDqguGtAhWSUNB6EcjzMv5ZxqofUU461oxlQ2lo9qbqXZ0T1uba/8ara3dp5\\nf8k6TBxaFd30GHgLWnPIJHCV+zyZE0iklxahVvpHAQKBgQDvqzkqfMrkaSvc1H9i\\n5eq5xnkUZoszih+fZaEuMw7/RIur8DOm3aYygIvXgF5z+nFr0qrvo8dYJhYmpqZm\\n5zoRDyNOxEeEvEPuQt2BRjp/6ma122miBe2Ckty5OuQJxie8we6CiJMUtwRWvA1V\\nrJmqniDfM2HmdgJbJd4VfnW3YQKBgQDWDHweM8fto1JcflGQMvjQq4e//djLJG4z\\nUqHlJBaZcmOokkpeJB7dTtMgEVCeXJIx/OmCpc39ffs9YiAgtS4kaGzowVLpLdoG\\nOzxoc5L4iXFl+oWOIqGV1cZhQd497cNN4dWNQXrPzfh/PtRF43uLU4KuuSsb/I4n\\n0aHjar0okwKBgQDNmpf6CQCNnmPQmEOH9jG9mbR5edblKhMizS7O0WKGPqmLoQ7O\\nkctn+7r77tYYrLrsgte9qUT0LAhItCKAmNDJnbDue5fXGSM1nQslQbgh0Fa4oDgo\\nlOlCYPcVuJ20fNfOKJiSRtPWq4L/XWgbHWzeX7VXhV7xND+lLgEtc0VNQQKBgQDF\\nZSIZYDtiBZnwvnVNfBRFq8o23kzNmj0ei3fNryhAPmN1k+ONSdZE1WqSSiWExW31\\nN33JBEshGMtXYmSqhSuWW88EHzTs4WINGReuY9cH6QhwuUXtPDazzT9zdaEUj23r\\nJvcfm2E8voAKKNDt2smWRV9g7la5KoGWaxbWeRsUjQKBgBcTpn53wOreMb1VHdZj\\n9LkG7rU4pXQKm0tggBJzcO0146pEte7EvmGOywvTzlmBBUv3nyFJTmyy/OJzFIRL\\nhBIxiP2LA5wqkhbp5swDK5+mWs/ipM8o/nZ3VxEsJZtGSsb6MYRhPvCqMhh7hsU6\\nneOkbQWtUJgSnQEGtheXCBRy\\n-----END PRIVATE KEY-----\\n\",\n  \"client_email\": \"test-big-query@sincere-elixir-234203.iam.gserviceaccount.com\",\n  \"client_id\": \"104124452508200046364\",\n  \"auth_uri\": \"https://accounts.google.com/o/oauth2/auth\",\n  \"token_uri\": \"https://oauth2.googleapis.com/token\",\n  \"auth_provider_x509_cert_url\": \"https://www.googleapis.com/oauth2/v1/certs\",\n  \"client_x509_cert_url\": \"https://www.googleapis.com/robot/v1/metadata/x509/test-big-query%40sincere-elixir-234203.iam.gserviceaccount.com\"\n}"
  )

  val destinationSource: JdbcSource = JdbcSource(
    orgId = 0,
    id = 2,
    displayName = "clickhouse datasource",
    databaseType = DatabaseType.Clickhouse,
    jdbcUrl = ZConfig.getString("database_test.clickhouse.url"),
    username = ZConfig.getString("database_test.clickhouse.username"),
    password = ZConfig.getString("database_test.clickhouse.password")
  )

  val job: BigQueryStorageJob = BigQueryStorageJob(
    1,
    jobId = 1,
    sourceId = 1L,
    displayName = "bigquery storage job",
    lastSyncStatus = JobStatus.Init,
    lastSuccessfulSync = 0L,
    syncIntervalInMn = 1,
    incrementalColumn = None,
    destinations = Seq(DataDestination.Clickhouse),
    lastSyncedValue = "0",
    jobType = JobType.Bigquery,
    currentSyncStatus = JobStatus.Init,
    projectName = "bigquery-public-data",
    datasetName = "usa_names",
    tableName = "usa_1910_current",
    selectedColumns = Seq("name", "number", "state", "year"),
    rowRestrictions = "state = \"OH\" and name = \"Alice\"",
    destDatabaseName = "bigquery_storage",
    destTableName = "usa_names"
  )

  private def ensureSchema(destinationSource: JdbcSource): Unit = {
    val client: NativeJdbcClient =
      NativeJdbcClient(destinationSource.jdbcUrl, destinationSource.username, destinationSource.password)
    val createDatabaseQuery = s"create database if not exists ${job.destDatabaseName}"
    client.executeUpdate(createDatabaseQuery)

    val createTableQuery =
      s"""
         |create table if not exists ${job.destDatabaseName}.${job.destTableName} (
         |state String,
         |year Int64,
         |name String,
         |number Int64
         |) ENGINE = MergeTree() ORDER BY (year)
         |""".stripMargin
    client.executeUpdate(createTableQuery)
  }

  def onProgress(progress: JobProgress): Future[Unit] = {
    Future.Unit
  }

  val ssdbClient: SSDB = injector.instance[SSDB]
  val ssdbKVS: SsdbKVS[Long, Boolean] = SsdbKVS[Long, Boolean]("test_worker", ssdbClient)
  ssdbKVS.add(1, true).synchronized()

  test("test google bigquery storage worker") {
    val worker = new BigQueryStorageWorker(dataSource, schemaService, ssdbKVS)
    worker.run(job, 1, onProgress)
  }
}
