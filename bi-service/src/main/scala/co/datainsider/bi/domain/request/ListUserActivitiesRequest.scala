package co.datainsider.bi.domain.request

import com.twitter.finagle.http.Request
import datainsider.client.filter.LoggedInRequest

import javax.inject.Inject

case class ListUserActivitiesRequest(
    from: Int,
    size: Int,
    startTime: Option[Long] = None,
    endTime: Option[Long] = None,
    usernames: Seq[String] = Seq.empty,
    actionNames: Seq[String] = Seq.empty,
    actionTypes: Seq[String] = Seq.empty,
    resourceTypes: Seq[String] = Seq.empty,
    @Inject request: Request
) extends LoggedInRequest
