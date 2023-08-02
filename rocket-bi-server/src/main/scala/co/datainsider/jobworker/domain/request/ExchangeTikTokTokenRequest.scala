package co.datainsider.jobworker.domain.request

import com.twitter.finatra.http.annotations.RouteParam

case class ExchangeTikTokTokenRequest(authCode: String)
