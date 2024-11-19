package co.datainsider.bi.domain.request

import co.datainsider.bi.domain.chart.TableColumn
import co.datainsider.bi.domain.query.{Query, SqlQuery}
import com.twitter.finagle.http.Request
import co.datainsider.caas.user_profile.controller.http.filter.LoggedInRequest

import javax.inject.Inject

case class SqlQueryRequest(
    sql: String,
    @Inject request: Request = null
) extends LoggedInRequest {
  def toQuery: Query = SqlQuery(sql)

  def toTableColumns: Array[TableColumn] = Array.empty
}
