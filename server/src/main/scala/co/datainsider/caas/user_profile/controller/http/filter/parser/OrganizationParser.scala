package co.datainsider.caas.user_profile.controller.http.filter.parser

import co.datainsider.bi.util.profiler.Profiler
import com.google.inject.Inject
import com.twitter.finagle.{Service, SimpleFilter}
import com.twitter.finagle.http.{Request, Response}
import com.twitter.util.Future
import co.datainsider.caas.user_profile.controller.http.filter.parser.OrganizationContext.OrganizationField
import co.datainsider.caas.user_profile.controller.http.filter.parser.UserContext.UserContextSyntax
import co.datainsider.caas.user_profile.domain.org.Organization
import co.datainsider.caas.user_profile.service.OrganizationService

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
      val orgDomain: String = request.getRequestDomain()

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
}
