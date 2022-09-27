package datainsider.schema.controller.http.filter

import com.twitter.finagle.http.Request
import datainsider.client.domain.org.Organization
import datainsider.client.exception.UnAuthenticatedError

/**
  * @author andy
  * @since 7/9/20
  */
object RequestOrganizationContext {

  private val OrgField = Request.Schema.newField[Option[Organization]]()

  def setOrganization(request: Request, organization: Option[Organization]): Unit = {
    request.ctx.update(OrgField, organization)
  }

  implicit class OrganizationContextSyntax(val request: Request) extends AnyVal {

    def hasOrganization: Boolean = request.ctx(OrgField).isDefined

    def currentOrganization = {
      request.ctx(OrgField) match {
        case Some(x) => x
        case _       => throw UnAuthenticatedError("No service key or no organization was found.")
      }
    }
  }
}
