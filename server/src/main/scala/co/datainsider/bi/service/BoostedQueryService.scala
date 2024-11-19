package co.datainsider.bi.service

import co.datainsider.bi.domain.request.{ChartRequest, QueryViewAsRequest, SqlQueryRequest}
import co.datainsider.bi.domain.response.{ChartResponse, SqlQueryResponse}
import co.datainsider.bi.repository.ChartResponseRepository
import co.datainsider.bi.repository.FileStorage.FileType.FileType
import co.datainsider.bi.util.ZConfig
import co.datainsider.bi.util.profiler.Profiler
import com.google.inject.Inject
import com.twitter.inject.Logging
import com.twitter.util.Future
import co.datainsider.common.client.util.ByKeyAsyncMutex

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

  private val clazz: String = this.getClass.getSimpleName

  private val maxCacheTime = ZConfig.getLong("boost_scheduler.max_cache_time", 24 * 3600000)
  private def jobRespMutex = ByKeyAsyncMutex()

  override def query(request: ChartRequest): Future[ChartResponse] =
    Profiler(s"$clazz::query ChartRequest") {
      if (request.useBoost) {
        queryFromCache(request)
      } else {
        queryService.query(request)
      }
    }

  override def query(request: SqlQueryRequest): Future[SqlQueryResponse] =
    Profiler(s"$clazz::query SqlQueryRequest") {
      queryService.query(request)
    }

  override def query(request: QueryViewAsRequest): Future[ChartResponse] =
    Profiler(s"$clazz::query QueryViewAsRequest") {
      queryService.query(request)
    }

  private def queryFromCache(request: ChartRequest): Future[ChartResponse] =
    Profiler(s"$clazz::queryFromCache") {
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

  override def exportToFile(request: ChartRequest, fileType: FileType): Future[String] = {
    queryService.exportToFile(request, fileType)
  }

}
