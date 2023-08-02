package co.datainsider.jobscheduler.domain.request

import co.datainsider.jobscheduler.domain.source.DataSource
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.annotations.RouteParam
import co.datainsider.caas.user_profile.controller.http.filter.LoggedInRequest

import javax.inject.Inject

case class GetDataSourceRequest(
    @RouteParam id: Long,
    @Inject request: Request = null
) extends LoggedInRequest

case class CreateDatasourceRequest(
    dataSource: DataSource,
    @Inject request: Request = null
) extends LoggedInRequest

case class DeleteDatasourceRequest(
    @RouteParam id: Long,
    @Inject request: Request = null
) extends LoggedInRequest

case class MultiDeleteDatasourceRequest(
    ids: Array[Long],
    @Inject request: Request = null
) extends LoggedInRequest

case class UpdateDataSourceRequest(
    @RouteParam id: Long,
    dataSource: DataSource,
    @Inject request: Request = null
) extends LoggedInRequest

case class WorkerGetDataSourceRequest(
    @RouteParam id: Long,
    @RouteParam orgId: Long,
    @Inject request: Request = null
) extends LoggedInRequest
