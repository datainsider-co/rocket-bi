package co.datainsider.bi.controller.http.filter

import com.twitter.finagle.http.{Request, Response}
import com.twitter.finagle.{Service, SimpleFilter}
import com.twitter.inject.Logging
import com.twitter.util.Future
import datainsider.client.filter.UserContext.UserContextSyntax
import datainsider.client.util.ZConfig
import datainsider.licence.exception.LicenceExpiredError
import datainsider.licence.service.LicenceClientService

import java.sql.Date
import java.text.SimpleDateFormat
import java.time.Duration
import javax.inject.Inject

class LicenceServerFilter @Inject() (licenceClientService: LicenceClientService)
    extends SimpleFilter[Request, Response]
    with Logging {
  val dateFormat = new SimpleDateFormat("dd MM yyyy HH:mm:ss Z")
  override def apply(request: Request, service: Service[Request, Response]): Future[Response] = {
    try {
      //  val licenceKey = request.currentOrganization.get.licenceKey.get
      val timeOfMonthMillis: Long = Duration.ofDays(30).toMillis
      val timeOfDayMillis: Long = Duration.ofDays(1).toMillis

      require(request.currentOrganization.get.licenceKey.isDefined)

      for {
        licence <- licenceClientService.get(request.currentOrganization.get.licenceKey.get)
        response <- service(request)
      } yield {
        val terminatedTimeMillis = licence.expiredAt + timeOfMonthMillis
        val terminatedDate = new Date(terminatedTimeMillis)
        if (terminatedTimeMillis < System.currentTimeMillis()) {
          throw LicenceExpiredError(s"Your license was terminated ${dateFormat.format(terminatedDate)}")
        }

        if (licence.expiredAt < System.currentTimeMillis()) {
          val withinDays: Long = (terminatedTimeMillis - System.currentTimeMillis()) / timeOfDayMillis
          response.headerMap.add(
            ZConfig.getString("licence.field_name"),
            s"Your license is expired. Please make sure to charge for your license before ${dateFormat
              .format(terminatedDate)}/ within ${withinDays} days. Otherwise, your service will be terminated."
          )
        }
        response
      }
    } catch {
      case e: Throwable =>
        logger.error(s"LicenceFilter::apply ${e.getMessage}", e)
        service(request)
    }
  }
}
