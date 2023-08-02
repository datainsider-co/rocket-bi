package co.datainsider.bi.service

import co.datainsider.bi.domain.request.{ChartRequest, QueryViewAsRequest, SqlQueryRequest}
import co.datainsider.bi.domain.response.{
  ChartResponse,
  CsvResponse,
  SeriesOneItem,
  SeriesOneResponse,
  SqlQueryResponse
}
import co.datainsider.bi.repository.FileStorage.FileType.FileType
import com.twitter.util.Future

class MockQueryService extends QueryService {
  override def query(request: ChartRequest): Future[ChartResponse] =
    Future {
      Thread.sleep(100)
      SeriesOneResponse(
        series = Array(
          SeriesOneItem(name = "series-one", data = Array.empty)
        )
      )
    }

  override def query(request: SqlQueryRequest): Future[SqlQueryResponse] =
    Future {
      SqlQueryResponse(
        headers = Array("name"),
        records = Array(Array("Andy"))
      )
    }

  override def query(request: QueryViewAsRequest): Future[ChartResponse] = ???

  override def exportToFile(request: ChartRequest, fileType: FileType): Future[String] = ???
}
