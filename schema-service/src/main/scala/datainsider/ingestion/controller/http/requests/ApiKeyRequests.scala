package datainsider.ingestion.controller.http.requests

import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import com.google.inject.Inject
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.annotations.RouteParam
import com.twitter.finatra.validation.constraints.{Min, NotEmpty}
import datainsider.client.filter.LoggedInRequest
import datainsider.ingestion.domain.{ApiKeyInfo, ApiKeyTypeRef, ApiKeyTypes, RateLimitingInfo}

case class CreateAnalyticApiKeyRequest(
    @Min(0) organizationId: Long,
    @NotEmpty name: String,
    description: Option[String],
    rateLimitingInfo: Option[RateLimitingInfo],
    @Inject request: Request = null
) extends LoggedInRequest {

  def toCreateApiKeyRequest(): CreateApiKeyRequest = {
    CreateApiKeyRequest(
      keyType = ApiKeyTypes.Analytics,
      organizationId = organizationId,
      name = name,
      description = description,
      rateLimitingInfo = rateLimitingInfo,
      request = request
    )
  }
}

case class CreateApiKeyRequest(
    @JsonScalaEnumeration(classOf[ApiKeyTypeRef])
    keyType: ApiKeyTypes.ApiKeyType,
    @Min(0) organizationId: Long,
    @NotEmpty name: String,
    description: Option[String],
    rateLimitingInfo: Option[RateLimitingInfo],
    @Inject request: Request = null
) extends LoggedInRequest {
  def buildApiKeyInfo(apiKey: String): ApiKeyInfo = {
    ApiKeyInfo(
      keyType,
      apiKey,
      organizationId,
      rateLimitingInfo.getOrElse(RateLimitingInfo()),
      Option(name),
      description,
      updatedTime = Some(System.currentTimeMillis()),
      createdTime = Some(System.currentTimeMillis())
    )
  }
}

case class AddApiKeyRequest(
    @JsonScalaEnumeration(classOf[ApiKeyTypeRef])
    keyType: ApiKeyTypes.ApiKeyType,
    @NotEmpty apiKey: String,
    @Min(0) organizationId: Long,
    name: Option[String],
    description: Option[String],
    rateLimitingInfo: Option[RateLimitingInfo],
    @Inject request: Request = null
) extends LoggedInRequest {

  def buildApiKeyInfo(): ApiKeyInfo = {
    ApiKeyInfo(
      keyType,
      apiKey,
      organizationId,
      rateLimitingInfo.getOrElse(RateLimitingInfo()),
      name,
      description,
      updatedTime = Some(System.currentTimeMillis()),
      createdTime = Some(System.currentTimeMillis())
    )
  }
}

case class GetApiKeyRequest(
    @RouteParam @NotEmpty apiKey: String,
    @Inject request: Request = null
) extends LoggedInRequest

case class DeleteApiKeyRequest(
    @RouteParam @NotEmpty apiKey: String,
    @Inject request: Request = null
) extends LoggedInRequest
