package co.datainsider.bi.controller.http

import co.datainsider.bi.domain.GeoArea
import co.datainsider.bi.service.GeolocationService
import com.google.inject.Inject
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.Controller

class GeolocationController @Inject() (geolocationService: GeolocationService) extends Controller {

  val apiPath = s"/geolocation"

  get(s"$apiPath/areas") { _: Request =>
    geolocationService.listSupportedAreas()
  }

  post(s"$apiPath/list") { request: GeoArea =>
    geolocationService.list(request)
  }

}
