package co.datainsider.jobworker.repository.readers

import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.util.Using
import co.datainsider.jobscheduler.domain.job.PalexyDateRange
import co.datainsider.jobworker.client.palexy.MockPalexyClient
import co.datainsider.jobworker.domain.JobStatus
import co.datainsider.jobworker.domain.job.PalexyJob
import co.datainsider.jobworker.repository.reader.palexy.PalexyReader
import co.datainsider.schema.domain.TableSchema
import com.twitter.inject.Test

/**
 * created 2023-07-11 4:04 PM
 *
 * @author tvc12 - Thien Vi
 */
class PalexyReaderTest extends Test {
  val client = new MockPalexyClient()
  var expectedJob = PalexyJob(
    orgId = 1,
    jobId = 1,
    sourceId = 0L,
    lastSuccessfulSync = 0,
    syncIntervalInMn = 10,
    lastSyncStatus = JobStatus.Init,
    currentSyncStatus = JobStatus.Init,
    destDatabaseName = "1001_database1",
    destTableName = "transaction",
    destinations = Seq("Clickhouse"),
    lastSyncedValue = None,
    metrics = Set("visits", "walk_ins", "average_dwell_time"),
    dimensions = Set("store_id", "store_code", "store_name", "day"),
    dateRange = PalexyDateRange(
      fromDate = "2019-01-01",
      toDate = "2019-01-02"
    ),
    storeIds = Set("1", "2"),
    storeCodes = Set.empty
  )

  test("test read data from palexy") {
    Using(new PalexyReader(client, "tvc12", expectedJob)) { reader =>
      while (reader.hasNext) {
        val tableSchema: TableSchema = reader.detectTableSchema()
        val data: Seq[Record] = reader.next(tableSchema.columns)
        assert(data.nonEmpty)
        assert(data.size == 11)
      }
    }
  }

}
