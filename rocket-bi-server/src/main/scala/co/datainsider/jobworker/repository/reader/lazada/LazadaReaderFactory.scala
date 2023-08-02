package co.datainsider.jobworker.repository.reader.lazada

import co.datainsider.jobworker.client.lazada.{LazadaClient, MockLazadaClient}
import co.datainsider.jobworker.domain.RangeValue
import co.datainsider.jobworker.domain.job.{LazadaJob, LazadaSupportedTable}
import co.datainsider.jobworker.domain.source.LazadaSource
import co.datainsider.jobworker.exception.CreateReaderException
import co.datainsider.jobworker.repository.reader.Reader
import co.datainsider.jobworker.repository.reader.factory.ReaderFactory

/**
  * created 2023-04-15 7:44 PM
  *
  * @author tvc12 - Thien Vi
  */
class LazadaReaderFactory extends ReaderFactory[LazadaSource, LazadaJob] {

  override def create(source: LazadaSource, job: LazadaJob): Reader = {
    val client = createClient(source)
    val syncDateRange: RangeValue[String] = getSyncDateRange(job)
    job.tableName match {
      case LazadaSupportedTable.Order              => new OrderLazadaReader(client, syncDateRange, job)
      case LazadaSupportedTable.OrderItem          => new OrderItemLazadaReader(client, syncDateRange, job)
      case LazadaSupportedTable.Product            => new ProductLazadaReader(client, syncDateRange, job)
      case LazadaSupportedTable.FlexiCombo         => new FlexiComboLazadaReader(client, job)
      case LazadaSupportedTable.PayoutStatus       => new PayoutStatusLazadaReader(client, syncDateRange, job)
      case LazadaSupportedTable.TransactionDetail  => new TransactionDetailLazadaReader(client, syncDateRange, job)
      case LazadaSupportedTable.PartnerTransaction => new PartnerTransactionLazadaReader(client, syncDateRange, job)
      case _                                       => throw new CreateReaderException(s"Unsupported sync data from table ${job.tableName}")
    }
  }

  private def createClient(source: LazadaSource): LazadaClient = new MockLazadaClient()

  // @fixme: update sync date time range correctly
  private def getSyncDateRange(job: LazadaJob): RangeValue[String] = {
    val from = String.valueOf(job.timeRange.from)
    val to = String.valueOf(job.timeRange.to)
    RangeValue(from, to)
  }
}
