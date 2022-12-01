package co.datainsider.bi.service
import co.datainsider.bi.domain.request.{ChartRequest, SqlQueryRequest, ViewAsRequest}
import co.datainsider.bi.domain.response.{
  CsvResponse,
  ChartResponse,
  SeriesOneItem,
  SeriesOneResponse,
  SqlQueryResponse
}
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

  override def query(request: ViewAsRequest): Future[ChartResponse] = ???

  override def exportAsCsv(request: ChartRequest): Future[String] = Future.value("/path/to/csv")
}
