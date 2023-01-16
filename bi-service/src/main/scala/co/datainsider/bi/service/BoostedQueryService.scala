package co.datainsider.bi.service

import co.datainsider.bi.domain.request.{ChartRequest, SqlQueryRequest, QueryViewAsRequest}
import co.datainsider.bi.domain.response.{CsvResponse, ChartResponse, SqlQueryResponse}
import co.datainsider.bi.repository.ChartResponseRepository
import co.datainsider.bi.util.ZConfig
import com.google.inject.Inject
import com.twitter.inject.Logging
import com.twitter.util.Future
import datainsider.client.util.ByKeyAsyncMutex
import datainsider.profiler.Profiler

import scala.concurrent.ExecutionContext.Implicits.global

/**
  * quan ly luc nao nen lay data tu cache, luc nao nen query lai:
  * - dung queryService doi voi request force query hoac ko tim thay data trong chartResponseRepository
  * - data co pagination (table, pivot table) thi xu li the nao? truong hop qua nhieu rows?
  * - các trường hợp override lại data trong ChartResponseRepository : ChartResponseWorker, forceUpdate flag in chartRequest
  */
class BoostedQueryService @Inject() (
    queryService: QueryService,
    chartResponseRepository: ChartResponseRepository
) extends QueryService
    with Logging {

  private val maxCacheTime = ZConfig.getLong("boost_scheduler.max_cache_time", 24 * 3600000)
  private def jobRespMutex = ByKeyAsyncMutex()

  override def query(request: ChartRequest): Future[ChartResponse] =
    Profiler(s"[Boost] ${this.getClass.getSimpleName}::ChartRequest") {
      if (request.useBoost) {
        queryFromCache(request)
      } else {
        queryService.query(request)
      }
    }

  override def query(request: SqlQueryRequest): Future[SqlQueryResponse] =
    Profiler(s"[Boost] ${this.getClass.getSimpleName}::SqlQueryRequest") {
      queryService.query(request)
    }

  override def query(request: QueryViewAsRequest): Future[ChartResponse] =
    Profiler(s"[Boost] ${this.getClass.getSimpleName}::QueryViewAsRequest") {
      queryService.query(request)
    }

  private def queryFromCache(request: ChartRequest): Future[ChartResponse] =
    Profiler(s"[Boost] ${this.getClass.getSimpleName}::queryFromCache") {
      val responseId: String = request.toResponseId

      jobRespMutex.acquireAndRun(responseId) {

        chartResponseRepository.get(responseId).flatMap {
          case Some(chartResponse) =>
            if (System.currentTimeMillis() - chartResponse.lastQueryTime > maxCacheTime) {
              Profiler(s"[Boost] ${this.getClass.getSimpleName}::maxCacheTime") {
                chartResponseRepository.queryAndPut(responseId, request)
              }
            } else Future(chartResponse)

          case None => queryService.query(request)
        }

      }

    }

  override def exportAsCsv(request: ChartRequest): Future[String] = queryService.exportAsCsv(request)
}
