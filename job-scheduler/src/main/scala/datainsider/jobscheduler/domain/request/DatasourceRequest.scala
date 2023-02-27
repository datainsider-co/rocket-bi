package datainsider.jobscheduler.domain.request

import com.twitter.finagle.http.Request
import com.twitter.finatra.http.annotations.RouteParam
import datainsider.client.filter.LoggedInRequest
import datainsider.jobscheduler.domain.DataSource

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
