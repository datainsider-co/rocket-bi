package datainsider.schema.controller.http.requests

import com.google.inject.Inject
import com.twitter.finagle.http.Request
import datainsider.client.filter.LoggedInRequest
import datainsider.schema.domain.ClickhouseSource

/**
  * created 2022-07-19 4:08 PM
  *
  * @author tvc12 - Thien Vi
  */
case class TestConnectionRequest(
    sourceConfig: ClickhouseSource,
    @Inject() request: Request = null
) extends LoggedInRequest
