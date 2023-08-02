package co.datainsider.bi.controller.http

import co.datainsider.bi.domain.request.ContactUsRequest
import co.datainsider.bi.util.SlackUtils
import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.caas.user_profile.controller.http.filter.parser.UserContext.UserContextSyntax
import co.datainsider.caas.user_profile.util.JsonParser
import co.datainsider.license.service.LicenseClientService
import com.google.inject.Inject
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.Controller

/**
  * Created by SangDang on 9/18/16.
  */
class HealthController @Inject() (licenseClientService: LicenseClientService) extends Controller {
  get("/ping") { request: Request =>
    Profiler("/ping") {
      response.ok(Map("status" -> "ok", "data" -> "pong"))
    }
  }

  post("/status") { request: Request =>
    response.ok(Map("status" -> "ok"))
  }

  get("/_profiler") { _: Request =>
    {
      response.ok(Profiler.report())
    }
  }

  get("/_profiler_html") { request: Request =>
    {
      response.ok.html(Profiler.reportAsHtml())
    }
  }

  post("/contact_us") { request: ContactUsRequest =>
    {
      val message = s"New customer's contact submission:\n ${JsonParser.toJson(request)}"
      SlackUtils.send(message = message)
      response.ok
    }
  }

  get("/license") { request: Request =>
    {
      val licenseKey = request.currentOrganization.get.licenceKey.get
      licenseClientService.get(licenseKey)
    }
  }
}
