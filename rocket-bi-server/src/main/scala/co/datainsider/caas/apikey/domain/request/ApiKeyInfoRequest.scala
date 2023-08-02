package co.datainsider.caas.apikey.domain.request

import com.fasterxml.jackson.core.`type`.TypeReference
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.annotations.RouteParam
import com.twitter.finatra.validation.constraints.{Max, Min, NotEmpty}
import co.datainsider.caas.apikey.domain.request.SortOrder.SortOrder
import co.datainsider.caas.user_profile.controller.http.filter.LoggedInRequest
import co.datainsider.caas.user_profile.util.Configs

import javax.inject.Inject

object SortOrder extends Enumeration {
  type SortOrder = Value
  val ASC: SortOrder = Value("ASC")
  val DESC: SortOrder = Value("DESC")
}

class SortOrderRef extends TypeReference[SortOrder.type]

case class SortRequest(field: String, @JsonScalaEnumeration(classOf[SortOrderRef]) order: SortOrder)

case class ListApiKeyRequest(
    keyword: Option[String] = None,
    @Min(0) from: Int = 0,
    @Max(1000) size: Int = 20,
    sorts: Seq[SortRequest] = Seq.empty,
    @Inject request: Request
) extends LoggedInRequest

case class GetApiKeyRequest(@RouteParam apiKey: String, @Inject request: Request) extends LoggedInRequest

case class CreateApiKeyRequest(
    displayName: String,
    expiredTimeMs: Option[Long] = None,
    permissions: Set[String],
    @Inject request: Request
) extends LoggedInRequest {
  def getPermissions: Seq[String] = Configs.enhancePermissions(getOrganizationId(), permissions.toSeq: _*)
}

case class UpdateApiKeyRequest(
    @RouteParam @NotEmpty apiKey: String,
    displayName: String,
    expiredTimeMs: Option[Long] = None,
    includePermissions: Set[String] = Set.empty,
    excludePermissions: Set[String] = Set.empty,
    @Inject request: Request
) extends LoggedInRequest {

  def getIncludesPermissions: Seq[String] = {
    Configs.enhancePermissions(getOrganizationId(), includePermissions.toSeq: _*)
  }

  def getExcludePermissions: Seq[String] = {
    Configs.enhancePermissions(getOrganizationId(), excludePermissions.toSeq: _*)
  }
}

case class DeleteApiKeyRequest(@RouteParam apiKey: String, @Inject request: Request) extends LoggedInRequest

case class ChangeApiKeyPermissionsRequest(
    @RouteParam @NotEmpty apiKey: String,
    includePermissions: Set[String] = Set.empty,
    excludePermissions: Set[String] = Set.empty,
    @Inject request: Request
) extends LoggedInRequest {

  private def organizationId: Long = currentOrganizationId.get

  def getIncludesPermissions: Seq[String] = {
    Configs.enhancePermissions(organizationId, includePermissions.toSeq: _*)
  }

  def getExcludePermissions: Seq[String] = {
    Configs.enhancePermissions(organizationId, excludePermissions.toSeq: _*)
  }
}
