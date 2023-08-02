package co.datainsider.datacook.domain.request.etl

import com.twitter.finagle.http.Request
import co.datainsider.caas.user_profile.controller.http.filter.LoggedInRequest
import co.datainsider.datacook.domain.persist.ThirdPartyPersistConfiguration

import javax.inject.Inject

/**
  * @author tvc12 - Thien Vi
  * @created 02/25/2022 - 10:32 AM
  */
case class ListThirdPartyDatabaseRequest(
    configuration: ThirdPartyPersistConfiguration,
    @Inject request: Request = null
) extends LoggedInRequest {}
