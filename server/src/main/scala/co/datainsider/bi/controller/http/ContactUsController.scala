package co.datainsider.bi.controller.http

import co.datainsider.bi.domain.request.ContactUsRequest
import co.datainsider.caas.user_profile.controller.http.filter.parser.UserContext.UserContextSyntax
import co.datainsider.caas.user_profile.util.JsonParser
import co.datainsider.license.service.LicenseClientService
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.Controller

import javax.inject.Inject

class ContactUsController @Inject() (
    licenseClientService: LicenseClientService
) extends Controller {

  post("/contact_us") { request: ContactUsRequest =>
    {
      val message = s"New customer's contact submission:\n ${JsonParser.toJson(request)}"
      licenseClientService.notify(message = message)
    }
  }

  get("/license") { request: Request =>
    {
      val licenseKey = request.currentOrganization.get.licenceKey
      licenseClientService.ensureGet(licenseKey)
    }
  }
}
