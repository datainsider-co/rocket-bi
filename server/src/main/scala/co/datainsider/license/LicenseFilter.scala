package co.datainsider.license

import co.datainsider.caas.user_profile.controller.http.filter.parser.UserContext.UserContextSyntax
import co.datainsider.license.domain.permissions.SaasUsage
import co.datainsider.license.service.LicenseClientService
import com.google.inject.Inject
import com.twitter.finagle.{Service, SimpleFilter}
import com.twitter.finagle.http.{Request, Response}
import com.twitter.util.Future
import co.datainsider.common.client.exception.InsufficientPermissionError

class LicenseFilter @Inject() (licenseClientService: LicenseClientService) extends SimpleFilter[Request, Response] {
  override def apply(request: Request, service: Service[Request, Response]): Future[Response] = {
    request.ensureLoggedIn

    val licenseKey: String = request.currentOrganization.get.licenceKey

    licenseClientService
      .verify(licenseKey, SaasUsage())
      .flatMap(isPermitted => {
        if (isPermitted) {
          service(request)
        } else {
          Future.exception(
            InsufficientPermissionError(
              s"Insufficient permission to perform this action: License '$licenseKey' has expired."
            )
          )
        }
      })
  }
}
