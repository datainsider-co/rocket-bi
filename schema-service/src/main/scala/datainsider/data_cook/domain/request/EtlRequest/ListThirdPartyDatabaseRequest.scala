package datainsider.data_cook.domain.request.EtlRequest

import com.twitter.finagle.http.Request
import datainsider.client.filter.LoggedInRequest
import datainsider.data_cook.domain.persist.ThirdPartyPersistConfiguration

import javax.inject.Inject

/**
  * @author tvc12 - Thien Vi
  * @created 02/25/2022 - 10:32 AM
  */
case class ListThirdPartyDatabaseRequest(
                                          configuration: ThirdPartyPersistConfiguration,
                                          @Inject request: Request = null
) extends LoggedInRequest {}
