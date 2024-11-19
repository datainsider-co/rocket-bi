package co.datainsider.bi.domain.request

import co.datainsider.bi.domain.RlsPolicy
import com.google.inject.Inject
import com.twitter.finagle.http.Request
import com.twitter.finatra.validation.constraints.NotEmpty
import co.datainsider.caas.user_profile.controller.http.filter.LoggedInRequest

case class ListPolicyRequest(
    dbName: Option[String] = None,
    tblName: Option[String] = None,
    @Inject request: Request = null
) extends LoggedInRequest

case class PutPolicyRequest(
    @NotEmpty dbName: String,
    @NotEmpty tblName: String,
    policies: Array[RlsPolicy],
    @Inject request: Request = null
) extends LoggedInRequest
