package co.datainsider.jobworker.repository.reader.lazada

import co.datainsider.jobworker.client.lazada.{FlexiComboListResponse, LazadaClient}
import co.datainsider.jobworker.domain.job.LazadaJob
import co.datainsider.jobworker.repository.reader.Reader
import com.twitter.util.logging.Logging
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column.Column
import co.datainsider.bi.client.JdbcClient.Record

/**
  * created 2023-04-12 5:25 PM
  *
  * @author tvc12 - Thien Vi
  */
class FlexiComboLazadaReader(client: LazadaClient, job: LazadaJob) extends Reader with Logging {
  var hasNext: Boolean = true
  private var offset: Long = 0
  private var currentPage: Long = 0
  var columns: Seq[Column] = Seq.empty
  init()
  protected def init(): Unit = {
    hasNext = true
    offset = 0
    currentPage = 0
    columns = Reader.readColumns("lazada/flexi_combo.json")
  }

  override def next(columns: Seq[Column]): Seq[Record] = {
    val comboListResponse: FlexiComboListResponse = client.getFlexiComboList(currentPage)
    val records: Seq[Record] = LazadaReader.parseRecords(comboListResponse.dataList, columns)
    currentPage += 1
    offset += comboListResponse.dataList.size
    hasNext = comboListResponse.dataList.nonEmpty && offset <= comboListResponse.total
    records
  }

  override def detectTableSchema(): TableSchema = {
    TableSchema(
      name = job.destTableName,
      dbName = job.destDatabaseName,
      organizationId = job.orgId,
      displayName = job.destTableName,
      columns = columns
    )
  }

  override def close(): Unit = {
    // do nothing
  }

  override def isIncrementalMode(): Boolean = false

  override def getLastSyncValue(): Option[String] = None
}
