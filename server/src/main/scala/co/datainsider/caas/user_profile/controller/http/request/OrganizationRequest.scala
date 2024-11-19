package co.datainsider.caas.user_profile.controller.http.request

import co.datainsider.caas.admin.module.ConfigureAccount
import co.datainsider.caas.user_caas.domain.PasswordMode
import co.datainsider.caas.user_profile.controller.http.filter.LoggedInRequest
import co.datainsider.caas.user_profile.domain.Implicits.OptionString
import co.datainsider.caas.user_profile.domain.org.Organization
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.annotations.RouteParam
import com.twitter.finatra.validation.constraints.NotEmpty

import java.util.UUID
import javax.inject.Inject

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
      licenceKey = UUID.randomUUID().toString
    )
  }
}

case class UpdateDomainRequest(
    @RouteParam organizationId: Long,
    @NotEmpty newSubDomain: String,
    @Inject request: Request
) extends LoggedInRequest

@SerialVersionUID(130821L)
case class RegisterOrgRequest(
    @NotEmpty firstName: String,
    @NotEmpty lastName: String,
    @NotEmpty workEmail: String,
    @NotEmpty password: String,
    phoneNumber: String,
    @NotEmpty companyName: String,
    @NotEmpty subDomain: String,
    @NotEmpty reCaptchaToken: Option[String],
    @NotEmpty verifyCode: String
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

case class SendVerifyEmailRequest(
    @NotEmpty email: String
)
