package co.datainsider.bi.controller.http.filter

import co.datainsider.bi.util.LicenceUtils
import com.twitter.finagle.{Service, SimpleFilter}
import com.twitter.finagle.http.{Request, Response}
import com.twitter.inject.Logging
import com.twitter.util.Future

class LicenceFilter extends SimpleFilter[Request, Response] with Logging {
  override def apply(request: Request, service: Service[Request, Response]): Future[Response] = {
    LicenceUtils.checkLicence()
    service(request)
  }
}
