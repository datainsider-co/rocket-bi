package co.datainsider.jobscheduler.domain.request

import co.datainsider.caas.user_profile.controller.http.filter.LoggedInRequest
import co.datainsider.jobscheduler.domain.request.ForceSyncMode.ForceSyncMode
import com.fasterxml.jackson.core.`type`.TypeReference
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.annotations.RouteParam

import javax.inject.Inject

case class ForceSyncRequest(
    @RouteParam id: Long,
    startTime: Long = System.currentTimeMillis(),
    @JsonScalaEnumeration(classOf[ForceSyncModeRef]) mode: ForceSyncMode = ForceSyncMode.Continuous,
    @Inject request: Request = null
) extends LoggedInRequest

case class MultiForceSyncRequest(
    ids: Seq[Long],
    startTime: Long = System.currentTimeMillis(),
    @JsonScalaEnumeration(classOf[ForceSyncModeRef]) mode: ForceSyncMode = ForceSyncMode.Continuous,
    @Inject request: Request = null
) extends LoggedInRequest

class ForceSyncModeRef extends TypeReference[ForceSyncMode.type]

object ForceSyncMode extends Enumeration {
  type ForceSyncMode = Value
  val Continuous: ForceSyncMode.Value = Value("Continuous")
  val Once: ForceSyncMode.Value = Value("Once")
}
