package co.datainsider.jobworker.domain.request

import co.datainsider.jobworker.domain.response.SyncInfo
import co.datainsider.jobworker.util.ShopifyUtils
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.annotations.RouteParam
import com.twitter.finatra.validation.{MethodValidation, ValidationResult}
import co.datainsider.caas.user_profile.controller.http.filter.LoggedInRequest
import co.datainsider.jobworker.domain.Ids.SourceId
import co.datainsider.jobworker.domain.{DataSource, Job}

import javax.inject.Inject

case class SuggestDatabaseRequest(
    @RouteParam sourceId: SourceId,
    extraData: Option[String] = None,
    @Inject request: Request = null
) extends LoggedInRequest

case class SuggestTableRequest(
    sourceId: SourceId,
    databaseName: String,
    extraData: Option[String] = None,
    @Inject request: Request = null
) extends LoggedInRequest

case class SuggestColumnRequest(
    sourceId: SourceId,
    databaseName: String,
    tableName: String,
    extraData: Option[String] = None,
    @Inject request: Request = null
) extends LoggedInRequest

case class ExchangeGoogleTokenRequest(authorizationCode: String, @Inject request: Request = null)
    extends LoggedInRequest
case class RefreshGoogleTokenRequest(accessToken: String, refreshToken: String, @Inject request: Request = null)
    extends LoggedInRequest

case class GetTableSchemaRequest(syncInfo: SyncInfo)

case class SuggestTableSchemaRequest(
    sourceId: SourceId,
    databaseName: String,
    tableName: String,
    @Inject request: Request = null
) extends LoggedInRequest

case class PreviewRequest(dataSource: DataSource, job: Job)

case class GetShopifyAccessTokenRequest(shopUrl: String, authorizationCode: String, apiVersion: String) {
  @MethodValidation
  def validateShopUrl(): ValidationResult = {
    if (ShopifyUtils.isShopUrl(shopUrl)) {
      ValidationResult.Valid()
    } else {
      ValidationResult.Invalid(s"Invalid shopify url")
    }
  }

}
