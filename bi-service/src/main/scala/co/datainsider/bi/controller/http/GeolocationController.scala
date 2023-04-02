package co.datainsider.bi.controller.http

import co.datainsider.bi.domain.GeoArea
import co.datainsider.bi.service.GeolocationService
import com.google.inject.Inject
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.Controller

class GeolocationController @Inject() (geolocationService: GeolocationService) extends Controller {

  get("/geolocation/areas") { _: Request =>
    geolocationService.listSupportedAreas()
  }

  post("/geolocation/list") { request: GeoArea =>
    geolocationService.list(request)
  }

  post("/geolocation/verify_area") { request: Request =>
    geolocationService.parseGeoArea(request.getContentString())
  }

  post("/geolocation/verify_location") { request: Request =>
    geolocationService.parseGeolocation(request.getContentString())
  }

}
