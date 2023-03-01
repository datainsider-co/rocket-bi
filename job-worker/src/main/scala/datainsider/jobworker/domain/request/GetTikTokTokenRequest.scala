package datainsider.jobworker.domain.request

import com.twitter.finatra.http.annotations.RouteParam

case class GetTikTokTokenRequest(@RouteParam authCode: String)
