package co.datainsider.jobworker.repository.readers

import co.datainsider.jobworker.domain.job.BigQueryStorageJob
import co.datainsider.jobworker.domain.source.GoogleServiceAccountSource
import co.datainsider.jobworker.domain.{DataDestination, JobStatus, JobType}
import co.datainsider.jobworker.repository.reader.BigQueryStorageReader
import com.twitter.inject.Test
import co.datainsider.schema.domain.column.DateTimeColumn

import java.sql.Timestamp

class BigqueryStorageReaderTest extends Test {
  val dataSource: GoogleServiceAccountSource = GoogleServiceAccountSource(
    orgId = 0L,
    id = 1L,
    displayName = "datasource",
    credential =
      """{
        |  "type": "service_account",
        |  "project_id": "sincere-elixir-234203",
        |  "private_key_id": "7a68998789b0d8e126403c8b4b049fc3e04d43d7",
        |  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDmJ0x83MhMx8iH\n6oN6RCTOWThoM7HzigyLEedNQ49/dvEwZVIxRUe/xqo3B7Y1lDsc6BZomLwU/lT5\ncDbDW1PrgHQIywpsDnLyX7d7H6TOufKQWK2FgeY/+SRmwZUr3t0EXce1GBV21MQN\nHG/KWOuU363salmJYL8qXM2GfkGJ6dgwFKSfWTaYKpNIEkvUM3fR/4uDLntexi2t\nCVQdTOrYNLDs1BEi5dYJyIjMsb2vRwZx/EjqFUA+HE05brTwrn9fFH0ouRbZ/dw0\nyNEbA8vSx8TBDazrsOIPP4fyQY3EiGZVLjWkEJ/T/Zj44pKV0Du1vy/JW8q7k6w+\nFsIX+oIDAgMBAAECggEAIaZxSnhFWOSE70pces3ny7vDwYh9Ziwy9Upi1SshmfNc\nBEVsJQQKH4H+dRlNjLvlgK52SEi8hx1Ac0/y0dFSjcY0MOzu0ymxqLpR61CPGiKZ\n0n0EsdZyQbw9lECNfOKS0gacImApEzy8hWY4+g7SMuwZU82g1bMtgBYdfqKLFoyx\nGWCO30EOH+HfCr9K9lOBN1ndb0YQDkZQKYv2GIhMThxmzfBYPVBYzOVz+PRSdDtG\n/bTT125+XgfCcQJH/OWlBxm/ZtxB/YLNdZULJU5PAOMzMz/dPtqQ/bdk7P5QzCPH\ng7du653GPG4kkOGmlD49Osgk7430fyK5Vvyiz5BwUQKBgQD/yVvcmVqcW0M31eU+\nCn8aAQEhOmmIje11MiCy4R1e5wZLMNOpWfoP/hVU4NruoTbiw30xPZX5ax38q294\nyL7IgMBq8AH41pf8n/E82tRt7mnytUjVnQyUMV2YH1OalNj8zT6gXlTipa1Z1oA7\nAFKVoMCQBsO9RET9f94qrf7yxQKBgQDmWHbWdJqXby9Otlkk708s9I040+x0K1pk\nYSaD8LohfdpSb4+aPDcBRTANwkKL7XnMWFAi8P1wRkywZNV6DdE0rzuVz+NItnxl\nebzlddjL04eMuw5MhWqL8uzR8bo7XN/iu1BH32O86ITny+xEuYldYpjJjZ4W11kk\nklpQPDXOJwKBgQD38RC5onGB1Lkwm4cOf5A6/bRBqGR5+NGv47psiug0gQ7Jvfe+\nVjieXfYBg8DUxbL1Vve4znDdB+dWcDuqwjSlGKDsR+AxfJpxR/zIt3ppYUyT9wQ2\nBHkYAU4vUlZxJk27p5xISYhQ9rY1ukYsayCiZ+Og+N2uTkntzI/noSfb3QKBgQC4\n+xYERwPW1O0y0vFn3d7BhWrb1iSvbhlbP0GE948iUkU/qmOyQuURWhSrF/QFFyKW\n3d0NEmcVAP+ZMIDXUb1OB+Nb/eTSgeoIO+lchHUjyq2ycI2dGg9kcCOKvgsGnSEW\nncJs1ZLtI/WHiJYm4rDTk9iLE/V+9lWaLwXkJVY4RQKBgQDSSPyZiigMfzqNp/HQ\nb5ITNlhv9K4qC9UFvaYAa8ZY2w2kBAdXmm0zdb5Xrg1AXXr8sjR3uAyc/DkefltZ\nfaukaUOexIi8/1Gd1fbisGdsnF8JCkw9frTUTIxdZVRLzOfupt38w5dUZ2veUdLh\nesEXZk59ubq7ke7iPwyhdGtcXw==\n-----END PRIVATE KEY-----\n",
        |  "client_email": "bigquery-worker@sincere-elixir-234203.iam.gserviceaccount.com",
        |  "client_id": "100412005484854543435",
        |  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        |  "token_uri": "https://oauth2.googleapis.com/token",
        |  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        |  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/bigquery-worker%40sincere-elixir-234203.iam.gserviceaccount.com"
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
    var count: Int = 0
    while (reader.hasNext) {
      val data = reader.next
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
    assert(schema.columns.head.isInstanceOf[DateTimeColumn])
    while (reader.hasNext) {
      val data = reader.next
      data.foreach(_.foreach(value => assert(value.isInstanceOf[Timestamp])))
    }
  }
}
