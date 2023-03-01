package datainsider.jobworker.domain.request

import com.twitter.finagle.http.Request
import com.twitter.finatra.http.annotations.RouteParam
import com.twitter.finatra.validation.{MethodValidation, ValidationResult}
import com.twitter.finatra.validation.constraints.NotEmpty
import datainsider.client.domain.schema.TableSchema
import datainsider.client.filter.LoggedInRequest
import datainsider.jobworker.domain.Ids.SourceId
import datainsider.jobworker.domain.{DataSource, Job}
import datainsider.jobworker.domain.response.SyncInfo
import datainsider.jobworker.util.ShopifyUtils

import javax.inject.Inject
import javax.validation.constraints.Pattern

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

case class GetGoogleTokenRequest(authorizationCode: String)

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
