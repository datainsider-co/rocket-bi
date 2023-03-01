package datainsider.data_cook.domain.request.EtlRequest
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.annotations.RouteParam
import datainsider.client.filter.LoggedInRequest
import datainsider.data_cook.domain.Ids.EtlJobId

import javax.inject.Inject

case class GetPreviewDatabaseName(@RouteParam id: EtlJobId, @Inject request: Request = null) extends LoggedInRequest
