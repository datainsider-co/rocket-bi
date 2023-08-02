package co.datainsider.bi.controller.http

import co.datainsider.bi.domain.GeoArea
import co.datainsider.bi.service.GeolocationService
import co.datainsider.bi.util.profiler.Profiler
import com.google.inject.Inject
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.Controller

class GeolocationController @Inject() (geolocationService: GeolocationService) extends Controller {

  get("/geolocation/areas") { _: Request =>
    Profiler(s"/geolocation/areas") {
      geolocationService.listSupportedAreas()
    }
  }

  post("/geolocation/list") { request: GeoArea =>
    Profiler(s"/geolocation/list") {
      geolocationService.list(request)
    }
  }

  post("/geolocation/verify_area") { request: Request =>
    Profiler(s"/geolocation/verify_area") {
      geolocationService.parseGeoArea(request.getContentString())
    }
  }

  post("/geolocation/verify_location") { request: Request =>
    Profiler(s"/geolocation/verify_location") {
      geolocationService.parseGeolocation(request.getContentString())
    }
  }

}
