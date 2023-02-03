package datainsider.user_profile.controller.http.filter.parser

import com.google.inject.Inject
import com.twitter.finagle.{Service, SimpleFilter}
import com.twitter.finagle.http.{Request, Response}
import com.twitter.util.Future
import datainsider.client.domain.org.Organization
import datainsider.profiler.Profiler
import datainsider.user_profile.controller.http.filter.parser.OrganizationContext.OrganizationField
import datainsider.user_profile.service.OrganizationService

import scala.concurrent.ExecutionContext.Implicits.global

object OrganizationContext {
  val OrganizationField = Request.Schema.newField[Organization]()

  implicit class OrganizationContextSyntax(val request: Request) extends AnyVal {
    def organization: Organization = request.ctx(OrganizationField)
    def orgId: Long = organization.organizationId
  }
}

class OrganizationParser @Inject() (organizationService: OrganizationService) extends SimpleFilter[Request, Response] {
  override def apply(request: Request, service: Service[Request, Response]): Future[Response] =
    Profiler(s"[Filter] ${this.getClass.getSimpleName}::apply") {
      val orgDomain: String = getRequestDomain(request)

      for {
        org <- getOrgByDomain(orgDomain)
        _ = request.ctx.update(OrganizationField, org)
        resp <- service(request)
      } yield resp
    }

  private def getOrgByDomain(domain: String): Future[Organization] =
    Profiler(s"[Filter] ${this.getClass.getSimpleName}::getOrgFromDomain") {
      organizationService.getByDomain(domain)
    }

  private def getRequestDomain(request: Request): String = {
    request.headerMap.get("Host") match {
      case Some(host) => host.split('.').head
      case None       => ""
    }
  }
}
