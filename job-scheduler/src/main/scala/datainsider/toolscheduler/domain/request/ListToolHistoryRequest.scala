package datainsider.toolscheduler.domain.request

import com.twitter.finagle.http.Request
import datainsider.client.filter.LoggedInRequest
import datainsider.jobscheduler.domain.request.SortRequest

import javax.inject.Inject

case class ListToolHistoryRequest(
    keyword: String = "",
    from: Int,
    size: Int,
    sorts: Seq[SortRequest] = Seq.empty,
    @Inject request: Request = null
) extends LoggedInRequest
