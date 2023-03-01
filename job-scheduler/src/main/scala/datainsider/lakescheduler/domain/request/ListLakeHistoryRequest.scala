package datainsider.lakescheduler.domain.request

import com.twitter.finagle.http.Request
import com.twitter.finatra.validation.constraints.{Max, Min}
import datainsider.client.filter.LoggedInRequest
import datainsider.jobscheduler.domain.request.SortRequest

import javax.inject.Inject

case class ListLakeHistoryRequest(
    keyword: String = "",
    @Min(0) from: Int = 0,
    @Max(1000) size: Int = 20,
    sorts: Seq[SortRequest] = Seq.empty,
    @Inject request: Request
) extends LoggedInRequest
