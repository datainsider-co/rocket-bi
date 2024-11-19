package co.datainsider.bi.domain.request

import co.datainsider.bi.domain.Connection
import co.datainsider.caas.user_profile.controller.http.filter.LoggedInRequest
import com.twitter.finagle.http.Request

import javax.inject.Inject

case class GetConnectionRequest(@Inject request: Request) extends LoggedInRequest

case class SetConnectionRequest(source: Connection, @Inject request: Request) extends LoggedInRequest

case class TestConnectionRequest(source: Connection, @Inject request: Request) extends LoggedInRequest
