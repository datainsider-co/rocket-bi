package datainsider.user_profile.controller.http.request

import com.twitter.finagle.http.Request
import com.twitter.finatra.validation.constraints.NotEmpty
import datainsider.client.filter.LoggedInRequest

import javax.inject.Inject

/**
  * created 2022-11-17 1:49 PM
  *
  * @author tvc12 - Thien Vi
  */
case class UpdateOrganizationRequest(
    @NotEmpty() name: String,
    thumbnailUrl: String,
    @Inject request: Request
) extends LoggedInRequest
