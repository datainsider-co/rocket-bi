package co.datainsider.bi.domain.request

import co.datainsider.bi.domain.QueryContext
import co.datainsider.bi.domain.chart.TableColumn
import co.datainsider.bi.domain.query.{Query, SqlQuery}
import com.twitter.finagle.http.Request
import datainsider.client.filter.LoggedInRequest

import javax.inject.Inject

case class SqlQueryRequest(
    sql: String,
    queryContext: Option[QueryContext] = None,
    @Inject request: Request = null
) extends LoggedInRequest {
  def toQuery: Query = SqlQuery(sql)

  def toTableColumns: Array[TableColumn] = Array.empty
}
