package co.datainsider.bi.repository

import co.datainsider.bi.domain.request.ChartRequest
import co.datainsider.bi.domain.response.ChartResponse
import co.datainsider.bi.service.QueryService
import com.google.inject.Inject
import com.twitter.inject.Logging
import com.twitter.util.Future
import co.datainsider.bi.util.Implicits.RichScalaFuture
import education.x.commons.KVS

import scala.concurrent.ExecutionContext.Implicits.global

/**
  * quản lí storage lưu response của chart:
  * - responseId: hash của ChartRequest với những field cần thiết
  * - các fields input của hàm hash: chartSetting, filterRequests, from, size
  */
trait ChartResponseRepository {
  def get(responseId: String): Future[Option[ChartResponse]]

  def put(responseId: String, chartResponse: ChartResponse): Future[Boolean]

  def queryAndPut(responseId: String, chartRequest: ChartRequest): Future[ChartResponse]

  def delete(responseId: String): Future[Boolean]

  def multiDelete(responseIds: Array[String]): Future[Boolean]
}

class ChartResponseRepositoryImpl @Inject() (
    queryService: QueryService,
    chartResponseStore: KVS[String, ChartResponse]
) extends ChartResponseRepository
    with Logging {

  override def get(responseId: String): Future[Option[ChartResponse]] = {
    debug(s"${this.getClass.getSimpleName}::get \t responseId: $responseId")
    chartResponseStore.get(responseId).asTwitterFuture
  }

  override def queryAndPut(responseId: String, chartRequest: ChartRequest): Future[ChartResponse] = {
    debug(
      s"${this.getClass.getSimpleName}::queryAndPut \n\t responseId: $responseId \n\t chartRequest: $chartRequest"
    )
    val t1: Long = System.currentTimeMillis()
    for {
      chartResponse <-
        queryService
          .query(chartRequest)
          .map(_.setTime(System.currentTimeMillis(), System.currentTimeMillis() - t1))
          .rescue {
            case ex: Throwable => throw ex
          }
      saved <- chartResponseStore.add(responseId, chartResponse).asTwitterFuture
    } yield chartResponse

  }

  override def put(responseId: String, chartResponse: ChartResponse): Future[Boolean] = {
    debug(
      s"${this.getClass.getSimpleName}::put \n\t responseId: $responseId \n\t chartResponse: $chartResponse"
    )
    chartResponseStore.add(responseId, chartResponse).asTwitterFuture
  }

  override def delete(responseId: String): Future[Boolean] = {
    debug(s"${this.getClass.getSimpleName}::delete \t responseId: $responseId")
    chartResponseStore.remove(responseId).asTwitterFuture
  }

  override def multiDelete(responseIds: Array[String]): Future[Boolean] = {
    debug(s"${this.getClass.getSimpleName}::multiDelete responseIds:\n [${responseIds.mkString("\t", "\n", "")}]")
    chartResponseStore.multiRemove(responseIds).asTwitterFuture
  }
}
