package co.datainsider.jobworker.repository.readers.mixpanel

import co.datainsider.bi.util.Using
import co.datainsider.jobscheduler.domain.job.{DateRangeInfo, MixpanelTableName}
import co.datainsider.jobworker.client.mixpanel.{MixpanelClient, USMixpanelClient}
import co.datainsider.jobworker.domain.JobStatus
import co.datainsider.jobworker.domain.job.MixpanelJob
import co.datainsider.jobworker.repository.reader.mixpanel.ExportReader
import co.datainsider.schema.domain.TableSchema
import com.twitter.inject.Test

class ExportReaderTest extends Test {
  val client: MixpanelClient = new USMixpanelClient(
    accountUsername = "alo.c9d563.mp-service-account",
    accountSecret = "MDJwLqsb3FAMzqC4j1ZMMUnewr2YoKIO"
  )

  val projectId = "2690017"
  var mixpanelJob = MixpanelJob(
    orgId = 1,
    jobId = 1,
    displayName = "sad",
    sourceId = 0L,
    lastSuccessfulSync = 0,
    syncIntervalInMn = 10,
    lastSyncStatus = JobStatus.Init,
    currentSyncStatus = JobStatus.Init,
    destDatabaseName = "1001_database1",
    destTableName = "transaction",
    destinations = Seq("Clickhouse"),
    lastSyncedValue = Some("tvc12"),
    dateRange = DateRangeInfo(
      fromDate = "2019-01-01",
      toDate = "2023-11-11"
    ),
    tableName = MixpanelTableName.Cohort,
  )

  test("detect schema success") {
    Using(new ExportReader(client, projectId, mixpanelJob))(reader => {
      val schema: TableSchema = reader.detectTableSchema()
      assert(schema.columns.nonEmpty)
      schema.columns.foreach(column => {
        println(s"column: ${column.name}, type: ${column.getColumnType}")
      })
    })
  }

  test("read data success") {
    Using(new ExportReader(client, projectId, mixpanelJob))(reader => {
      val columns = reader.detectTableSchema().columns
      println(s"columns: ${columns.size}, hasNext ${reader.hasNext()}")
      val records = reader.next(columns)
      println(s"records: ${records.size}")
  //    assert(records.nonEmpty)
      records.foreach(values => {
        println(s"record: ${values.mkString("Array(", ", ", ")")}")
      })
    })
  }

}
