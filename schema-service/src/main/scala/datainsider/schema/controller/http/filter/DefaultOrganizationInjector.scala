package datainsider.schema.controller.http.filter

import com.google.inject.Inject
import com.twitter.finagle.http.{Request, Response}
import com.twitter.finagle.{Service, SimpleFilter}
import com.twitter.inject.Logging
import com.twitter.util.{Future, Return, Throw}
import datainsider.client.domain.org.Organization
import datainsider.client.service.OrgClientService

import javax.inject.Singleton

/**
  * Hard code as 1L for now
  * @param organizationService
  */
@Singleton
class DefaultOrganizationInjector @Inject() ()(
    organizationService: OrgClientService
) extends SimpleFilter[Request, Response]
    with Logging {

  override def apply(request: Request, service: Service[Request, Response]) = {
    getOrganization().flatMap(organization => {
      RequestOrganizationContext.setOrganization(request, organization)
      service(request)
    })
  }

  private def getOrganization(): Future[Option[Organization]] = {
    organizationService
      .getOrganization(0L)
      .transform {
        case Return(organization) => Future.value(Some(organization))
        case Throw(_)             => Future.value(buildFallbackOrganization())
      }
  }

  private def buildFallbackOrganization(): Option[Organization] = {
    Some(
      Organization(
        organizationId = 0L,
        owner = "admin",
        name = "Data Insider",
        domain = "dev.datainsider.co",
        isActive = true,
        reportTimeZoneId = Some("Asia/Saigon")
      )
    )
  }
}
