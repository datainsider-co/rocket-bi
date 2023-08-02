package co.datainsider.jobworker.repository.readers.lazada

import co.datainsider.jobworker.client.lazada.MockLazadaClient
import co.datainsider.jobworker.domain.job.{LazadaJob, LazadaSupportedTable}
import co.datainsider.jobworker.domain.{DataDestination, JobStatus, RangeValue, SyncMode}
import co.datainsider.jobworker.repository.reader.lazada.FlexiComboLazadaReader
import co.datainsider.bi.util.Using
import co.datainsider.schema.domain.column.Column

/**
  * created 2023-04-07 6:25 PM
  *
  * @author tvc12 - Thien Vi
  */
class FlexiComboLazadaReaderTest extends AbstractShopeeReaderTest {
  val client = new MockLazadaClient()
  val baseJob = new LazadaJob(
    orgId = 1,
    jobId = 1,
    syncMode = SyncMode.IncrementalSync,
    sourceId = 1,
    lastSuccessfulSync = System.currentTimeMillis(),
    syncIntervalInMn = 1,
    lastSyncStatus = JobStatus.Synced,
    currentSyncStatus = JobStatus.Error,
    tableName = LazadaSupportedTable.FlexiCombo,
    destDatabaseName = "tvc12",
    destTableName = "order",
    destinations = Seq(DataDestination.Clickhouse),
    timeRange = RangeValue(from = getNDaysAgoAsMillis(7), to = getNDaysAgoAsMillis(0)),
    incrementalColumn = Some("updated_at"),
    lastSyncedValue = None
  )

  test("init reader must success") {
    val reader = new FlexiComboLazadaReader(client, job = baseJob)
    assert(reader != null)
    assert(reader.hasNext)
    assert(reader.columns.nonEmpty)
    assert(!reader.isIncrementalMode())
    assert(reader.getLastSyncValue().isEmpty)
  }

  test("read data must success") {
    Using(new FlexiComboLazadaReader(client, baseJob)) { reader =>
      {
        val records = reader.next(reader.columns)
        assert(records.nonEmpty)
        assert(records.size == 1)
        assert(reader.columns.nonEmpty)
        assert(!reader.isIncrementalMode())
        assert(reader.getLastSyncValue().isEmpty)
        println("start last sync value: " + reader.getLastSyncValue())
        val existColumNames = Set("start_time", "end_time", "order_numbers", "platform_channel", "name")
        reader.columns.zipWithIndex.foreach {
          case (column, index) =>
            val value = records.head(index)
            assertValue(value, column)
            ensureExistsValue(value, column, existColumNames)
        }
        println("end last sync value: " + reader.getLastSyncValue())
      }
    }

  }

}
