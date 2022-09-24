package datainsider.user_profile.controller.http.request

import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.annotations.RouteParam
import com.twitter.finatra.validation.constraints.Min
import datainsider.client.filter.LoggedInRequest
import datainsider.user_caas.domain.UserType.UserType
import datainsider.user_caas.domain.{UserType, UserTypeRef}

import javax.inject.Inject

case class GetUserProfileRequest(
    @RouteParam username: String,
    @Inject request: Request
) extends LoggedInRequest

case class MultiGetUserProfileRequest(usernames: Seq[String], @Inject request: Request) extends LoggedInRequest

case class SuggestionUserRequest(
    keyword: String,
    @Min(0) from: Option[Int],
    @Min(1) size: Option[Int],
    @JsonScalaEnumeration(classOf[UserTypeRef])
    userType: Option[UserType] = Some(UserType.User),
    @Inject request: Request
) extends LoggedInRequest
    with PagingRequest
