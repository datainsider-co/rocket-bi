package datainsider.ingestion.controller.http.requests

import com.google.inject.Inject
import com.twitter.finagle.http.Request
import datainsider.ingestion.domain.ClickhouseSource
import datainsider.client.filter.LoggedInRequest

/**
  * created 2022-07-19 4:08 PM
  *
  * @author tvc12 - Thien Vi
  */
case class TestConnectionRequest(
    sourceConfig: ClickhouseSource,
    @Inject() request: Request = null
) extends LoggedInRequest
