package co.datainsider.datacook.domain.request.etl

import com.fasterxml.jackson.core.`type`.TypeReference
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.annotations.RouteParam
import co.datainsider.caas.user_profile.controller.http.filter.LoggedInRequest
import co.datainsider.datacook.domain.request.etl.ForceRunMode.ForceRunMode

import javax.inject.Inject

class ForceRunModeRef extends TypeReference[ForceRunMode.type]

object ForceRunMode extends Enumeration {
  type ForceRunMode = Value
  val Continuous: ForceRunMode = Value("Continuous")
  val Once: ForceRunMode = Value("Once")
}
case class ForceRunRequest(
    @RouteParam id: Long,
    atTime: Long = System.currentTimeMillis(),
    @JsonScalaEnumeration(classOf[ForceRunModeRef]) mode: ForceRunMode = ForceRunMode.Continuous,
    @Inject request: Request = null
) extends LoggedInRequest
