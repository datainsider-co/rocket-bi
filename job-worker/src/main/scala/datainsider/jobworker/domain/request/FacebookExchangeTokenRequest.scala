package datainsider.jobworker.domain.request

import com.twitter.finatra.http.annotations.RouteParam

case class FacebookExchangeTokenRequest(@RouteParam accessToken:String)
