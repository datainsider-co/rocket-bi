package datainsider.jobworker.repository.readers

import datainsider.client.domain.schema.column.DateTimeColumn
import datainsider.jobworker.domain.{
  BigQueryStorageJob,
  DataDestination,
  GoogleServiceAccountSource,
  JobStatus,
  JobType
}
import datainsider.jobworker.repository.reader.BigQueryStorageReader
import org.scalatest.FunSuite

import java.sql.Timestamp

class BigqueryStorageReaderTest extends FunSuite {
  val dataSource: GoogleServiceAccountSource = GoogleServiceAccountSource(
    orgId = 0L,
    id = 1L,
    displayName = "datasource",
    credential =
      """{
        |  "type": "service_account",
        |  "project_id": "skillful-coil-317808",
        |  "private_key_id": "51fabad17df36596084362507b1df23647ac2e79",
        |  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDP7FCDKRKAivdv\n/IX/fWZnMhdVPLtFZbA8cYagRcdFsPeUNkhyDuaLLJIJx4l/lbMlx/mPE2XgqT3W\nNTHefo3vLePDcmJuBfwwT5XlqcNSFpP6nGo2HgTVkI/Gffi4Aia4ROqm+zukgOpt\nc5xwMoGdHdJdshzgUR9UXF85CiQ01RtK8rHDwnlX5AJ55ApzvuJzz8+D2w8LTYgJ\nY5gHNHNuH8L07+ONFgDiSh208E0NizDnuYP4ycWR0+tpXxRdSAeJSgaxIPa73XBh\nE6Ty3oplvm84udf9foCwfB8dfN/tvQCE3mL1TLzrSvSWzcd6FTcu5bK0t3MpXSTr\nItIMaA+TAgMBAAECggEARwlHNpB1PEp+IBoH09KNhmtEMoBlwN9tlzD4HFDKtKIx\n68ah+KnjlR/8ou+zp83G330TY5DuiRN5R3J0H75gEpu8iZ1OSKWt0/mUzlqyGx0Q\noJoI5YVbBHX30Qpfy8ocXW9aNgN2jIzoys0pYOG4i6vRH+bG29KLYCCQ/eVbmlqo\nIbYYlhHc/yQzEBZS4GW66Wi9yhujWUk3J0gOtvI2squA/pvtRBm1Q4gWCWEpyklt\n4eOLiTIQWY3uIDVDdeM/UL75gepjEzhWaJrsMNegUNS8YvpV/ITcZcAw5vfDxtVJ\nDb0kArjvL4/43PrA1EIPnpchES27yXCiQ0BWpaBzCQKBgQD+9SQIUpff6h11U6xA\neBxLgj7s5x/okkGVi8WSn7IokB1AwsVgYJo2zMpvOarWWwc/V2FqqfwjrX66UY4j\nX+hwIGUgguVIvjAr9q72PXPMdGVSyE7NSQbw3nyQrnHBaOPEGZzWvitbUYHZER/M\nOxevZQ4W7ZoXwBGQuVo41H//+wKBgQDQxfGTfmPFedvE+yqraE79mkr8Fm3gxRV6\nSRQK6kp7+Z/6rKFdPjqAGe5Q981Hgab03sRMxcoq5Dt+O5TIUb/qapyOlyW7uhnA\ndRpFNxXhnZMn9LNEY2IKEiT7YBM+3mILPOK12gpFB1VFSf14AG8DpRwJJXikU3Jm\nFD6DNZ5jSQKBgAoFeLUbCf0zJpVGBK9ECViudeq56vcpSIqoQ8vPmyEdCQlSno97\nPJSK2ConCiAC0/YZaSrYI6EDYMfSDNQ3INvHajIs8vY5A4u21om3QKX4rULjvLU0\n+aDeHedR9Aa2KL28g/2s2+dq/L+bfLR6XiP2xOcBz9y/H/GgV3uEXsOhAoGBAK5C\nuw0g70iTGZUHDSu7yks2caaPVjHKb839l6QwwfFPgHBtjddVrODmRB0Dai5okyJL\nm1B1u/UnQl1wgBTg369cQ8dldFKI2Rvi4wWpIDONIpq0Trojtl6vnHzSSd4tI2s7\n7ARctju+DjfitZZnzkIdnBQqWdPX72IzPaapp8Y5AoGBAIadWEgRrvLQG9c7fRWH\nP9iG3CHW3txKlvk+/Qj9UvuRxiQ0bRqp7LyQHUfarMQ7bmxQhvTmcJ2hnCf/cPmE\nbhgtc1TXvCQvRC4M/iO2hTyAAAZarZxbDtYfZx6NGouKtXNrG6j2BQeVNpVhtvIE\nyO7MXiTus1AEi23fSUpRgEdu\n-----END PRIVATE KEY-----\n",
        |  "client_email": "data-insider@skillful-coil-317808.iam.gserviceaccount.com",
        |  "client_id": "116035308601510446459",
        |  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        |  "token_uri": "https://oauth2.googleapis.com/token",
        |  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        |  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/data-insider%40skillful-coil-317808.iam.gserviceaccount.com"
        |}
        |""".stripMargin
  )

  test("test read data from bigquery storage") {
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
    val expectedRowsNumber = 112
    val reader = BigQueryStorageReader(dataSource, job)
    val schema = reader.getTableSchema
    var count = 0
    while (reader.hasNext) {
      val data = reader.next
      assert(data.nonEmpty)
      count += data.length
    }
    assert(count > 0)
  }

  test("test read date data from bigquery storage") {
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
      datasetName = "covid19_google_mobility",
      tableName = "mobility_report",
      selectedColumns = Seq("date"),
      rowRestrictions = "date = \"2020-08-20\"",
      destDatabaseName = "bigquery_storage",
      destTableName = "usa_names"
    )

    val reader = BigQueryStorageReader(dataSource, job)
    val schema = reader.getTableSchema
    println(schema)
    var count: Int = 0
    while (reader.hasNext) {
      val data = reader.next
      println(data)
      data.foreach(
        _.foreach(date =>
          if (date.toString.equals("2020-08-20")) {
            count = count + 1
          }
        )
      )
    }

    assert(count > 0)
  }

  test("test read timestamp data from bigquery storage") {
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
      datasetName = "austin_bikeshare",
      tableName = "bikeshare_stations",
      selectedColumns = Seq("modified_date"),
      rowRestrictions = "station_id = 3464",
      destDatabaseName = "bigquery_storage",
      destTableName = "usa_names"
    )

    val reader = BigQueryStorageReader(dataSource, job)
    val schema = reader.getTableSchema
    println(schema)
    assert(schema.columns.head.isInstanceOf[DateTimeColumn])
    while (reader.hasNext) {
      val data = reader.next
      println(data)
      data.foreach(_.foreach(value => assert(value.isInstanceOf[Timestamp])))
    }
  }

  test("test read datetime data from bigquery storage") {
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
      datasetName = "idc_v1",
      tableName = "auxiliary_metadata",
      selectedColumns = Seq("idc_version_timestamp"),
      rowRestrictions = "instance_size = 526226",
      destDatabaseName = "bigquery_storage",
      destTableName = "usa_names"
    )

    val reader = BigQueryStorageReader(dataSource, job)
    val schema = reader.getTableSchema
    println(schema)
    assert(schema.columns.head.isInstanceOf[DateTimeColumn])
    while (reader.hasNext) {
      val data = reader.next
      println(data)
      data.foreach(_.foreach(value => assert(value.isInstanceOf[Timestamp])))
    }
  }
}
