package co.datainsider.jobworker.controller.http

import co.datainsider.jobworker.domain.request._
import co.datainsider.jobworker.domain.{DataSource, Job}
import co.datainsider.jobworker.service.MetadataService
import com.google.inject.Inject
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.Controller
import com.twitter.util.Future
import co.datainsider.caas.user_profile.controller.http.filter.MustLoggedInFilter
import co.datainsider.bi.util.ZConfig

class MetadataController @Inject() (metadataService: MetadataService) extends Controller {
  private val SHOPIFY_CLIENT_ID: String = ZConfig.getString("shopify.client_id")

  post("/job/test") { job: Job =>
    metadataService.testJob(job).map(success => Map("success" -> success))
  }

  post("/source/test") { source: DataSource =>
    metadataService.testSource(source).map(success => Map("success" -> success))
  }

  filter[MustLoggedInFilter]
    .post("/source/:source_id/database") { request: SuggestDatabaseRequest =>
      metadataService.listDatabase(request)
    }

  filter[MustLoggedInFilter]
    .post("/source/table") { request: SuggestTableRequest =>
      metadataService.listTable(request)
    }

  filter[MustLoggedInFilter]
    .post("/source/column") { request: SuggestColumnRequest =>
      metadataService.listColumn(request)
    }

  filter[MustLoggedInFilter]
    .post("/source/google/token") { request: ExchangeGoogleTokenRequest =>
      {
        metadataService.exchangeGoogleTokenCode(request.authorizationCode)
      }
    }

  filter[MustLoggedInFilter]
    .post("/source/google/access_token/refresh") { request: RefreshGoogleTokenRequest =>
      {
        metadataService.refreshGoogleToken(request.accessToken, request.refreshToken)
      }
    }

  filter[MustLoggedInFilter]
    .post("/source/shopify/access_token") { request: GetShopifyAccessTokenRequest =>
      {
        metadataService.getShopifyAccessToken(request.shopUrl, request.authorizationCode, request.apiVersion)
      }
    }

  get("/source/shopify/client_id") { request: Request =>
    {
      Future.value(Map("client_id" -> SHOPIFY_CLIENT_ID))
    }
  }

  post("/job/get_table_schema") { request: GetTableSchemaRequest =>
    metadataService.getTableSchema(request)
  }

  post("/source/suggest_schema") { request: SuggestTableSchemaRequest =>
    metadataService.suggestTableSchema(request)
  }

  post("/job/preview") { request: PreviewRequest =>
    metadataService.preview(request)
  }

  filter[MustLoggedInFilter]
    .get("/source/fb_ads/:access_token/exchange_token") { request: FacebookExchangeTokenRequest =>
      metadataService.exchangeFacebookToken(request.accessToken)
    }

  filter[MustLoggedInFilter]
    .post("/source/tiktok_ads/exchange_token") { request: ExchangeTikTokTokenRequest =>
      metadataService.exchangeTikTokToken(request.authCode)
    }

  filter[MustLoggedInFilter]
    .get("/source/tiktok_ads/report/table") { request: Request =>
      metadataService.listTikTokReportTable()
    }

}
