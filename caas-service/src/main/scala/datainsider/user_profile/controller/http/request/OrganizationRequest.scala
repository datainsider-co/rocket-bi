package datainsider.user_profile.controller.http.request

import com.fasterxml.jackson.annotation.JsonProperty
import com.twitter.finagle.http.{Request, Response}
import com.twitter.finagle.{Service, SimpleFilter}
import com.twitter.finatra.http.annotations.{QueryParam, RouteParam}
import com.twitter.finatra.validation.constraints.NotEmpty
import com.twitter.util.Future
import datainsider.admin.module.ConfigureAccount
import datainsider.client.domain.org.Organization
import datainsider.client.exception.UnAuthorizedError
import datainsider.client.filter.UserContext.UserContextSyntax
import datainsider.client.filter.{DataRequestContext, LoggedInRequest}
import datainsider.client.util.ZConfig
import datainsider.user_caas.domain.PasswordMode
import datainsider.user_profile.domain.Implicits.OptionString
import datainsider.user_profile.service.OrganizationService
import datainsider.user_profile.util.{JsonParser, Utils}
import education.x.commons.Serializer
import org.apache.commons.lang3.SerializationUtils

import java.util.UUID
import javax.inject.Inject

/**
  * @author andy
  * @since 8/20/20
  * */
@deprecated("does not support create org with domain")
class CreateOrganizationRequestParser() extends SimpleFilter[Request, Response] {
  override def apply(request: Request, service: Service[Request, Response]): Future[Response] = {

    val bodyRequest = JsonParser.fromJson[CreateOrganizationBodyRequest](request.contentString)
    DataRequestContext.setDataRequest(
      request,
      CreateOrganizationRequest(
        -1L,
        bodyRequest.name,
        request.currentUser.username,
        domain = "",
        isActive = false,
        bodyRequest.reportTimeZoneId,
        bodyRequest.thumbnailUrl,
        System.currentTimeMillis()
      )
    )
    service(request)
  }
}

class CanGetOrganizationFilter @Inject() (organizationService: OrganizationService)
    extends SimpleFilter[Request, Response] {
  override def apply(request: Request, service: Service[Request, Response]): Future[Response] = {
    val organizationId = request.getLongParam("organization_id")
    organizationService
      .isOrganizationMember(organizationId, request.currentUser.username)
      .map({
        case true => true
        case _    => throw UnAuthorizedError("No permission to access this organization")
      })
      .flatMap(_ => service(request))
  }
}

class CanDeleteOrganizationFilter @Inject() (organizationService: OrganizationService)
    extends SimpleFilter[Request, Response] {
  override def apply(request: Request, service: Service[Request, Response]): Future[Response] = {
    val organizationId = request.getLongParam("organization_id")
    for {
      organization <- organizationService.getOrganization(organizationId)
      _ = organization.foreach(organization => {
        if (organization.owner != request.currentUser.username) {
          throw UnAuthorizedError("No permission to perform this action")
        }
      })
      response <- service(request)
    } yield {
      response
    }

  }
}

class CanAddOrgMemberFilter @Inject() (organizationService: OrganizationService)
    extends SimpleFilter[Request, Response] {
  override def apply(request: Request, service: Service[Request, Response]): Future[Response] = {
    val organizationId = request.getLongParam("organization_id")
    for {
      organization <- organizationService.getOrganization(organizationId)
      _ = organization.foreach(organization => {
        if (organization.owner != request.currentUser.username) {
          throw UnAuthorizedError("No permission to perform this action")
        }
      })
      response <- service(request)
    } yield {
      response
    }

  }
}

case class CreateOrganizationBodyRequest(
    @NotEmpty name: String,
    @JsonProperty("report_time_zone_id") reportTimeZoneId: Option[String],
    @JsonProperty("thumbnail_url") thumbnailUrl: Option[String]
)

case class CreateOrganizationRequest(
    organizationId: Long,
    name: String,
    owner: String,
    domain: String,
    isActive: Boolean,
    reportTimeZoneId: Option[String],
    thumbnailUrl: Option[String],
    createdTime: Long
) {

  def buildOrganization(): Organization = {
    Organization(
      organizationId = organizationId,
      owner = owner,
      name = name,
      domain = domain,
      isActive = isActive,
      reportTimeZoneId = reportTimeZoneId,
      thumbnailUrl = thumbnailUrl.notEmptyOrNull,
      createdTime = Some(createdTime),
      updatedTime = Some(createdTime),
      updatedBy = Some(owner),
      licenceKey = Some(UUID.randomUUID().toString)
    )
  }
}

case class SwitchOrganizationRequest(
    organizationId: Long,
    @Inject request: Request
) extends LoggedInRequest

case class AddOrgMemberRequest(
    @RouteParam organizationId: Long,
    @NotEmpty username: String,
    @Inject request: Request
) extends LoggedInRequest

case class UpdateDomainRequest(
    @RouteParam organizationId: Long,
    @NotEmpty newSubDomain: String,
    @Inject request: Request
) extends LoggedInRequest

case class GetAllOrganizationsRequest(
    @QueryParam from: Option[Int],
    @QueryParam size: Option[Int]
) extends PagingRequest

@SerialVersionUID(130821L)
case class RegisterOrgRequest(
    @NotEmpty firstName: String,
    @NotEmpty lastName: String,
    @NotEmpty workEmail: String,
    @NotEmpty password: String,
    phoneNumber: String,
    @NotEmpty companyName: String,
    @NotEmpty subDomain: String,
    @NotEmpty reCaptchaToken: Option[String]
) {

  def toCreateAdminAccountReq: ConfigureAccount = {
    val fullName = s"$firstName $lastName"
    ConfigureAccount(
      email = workEmail,
      password = Some(password),
      fullName = Some(fullName),
      passwordMode = Some(PasswordMode.Raw)
    )
  }

  def toCreateOrganizationReq(orgId: Long, ownerId: String, domain: String): CreateOrganizationRequest = {
    CreateOrganizationRequest(
      organizationId = orgId,
      name = companyName,
      owner = ownerId,
      domain = domain,
      isActive = true,
      reportTimeZoneId = None,
      thumbnailUrl = None,
      createdTime = System.currentTimeMillis()
    )
  }

}

object RegisterOrgRequest {
  implicit object RegisterOrgRequestSerializer extends Serializer[RegisterOrgRequest] {
    override def fromByte(bytes: Array[Byte]): RegisterOrgRequest = {
      SerializationUtils.deserialize(bytes).asInstanceOf[RegisterOrgRequest]
    }

    override def toByte(value: RegisterOrgRequest): Array[Byte] = {
      SerializationUtils.serialize(value.asInstanceOf[Serializable])
    }
  }
}

case class RegisterOrgResponse(success: Boolean, activationLink: String)
