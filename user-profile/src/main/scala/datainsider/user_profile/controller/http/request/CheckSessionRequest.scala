package datainsider.user_profile.controller.http.request

import com.twitter.finagle.http.Request
import datainsider.client.filter.LoggedInRequest

import javax.inject.Inject

case class CheckSessionRequest(@Inject request: Request) extends LoggedInRequest
