package co.datainsider.caas.user_profile.controller.http.request

import com.twitter.finagle.http.Request
import co.datainsider.caas.user_profile.controller.http.filter.LoggedInRequest

import javax.inject.Inject

case class CheckSessionRequest(@Inject request: Request) extends LoggedInRequest
