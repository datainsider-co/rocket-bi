package co.datainsider.jobworker.service

import co.datainsider.bi.util.ZConfig
import co.datainsider.jobworker.domain.job.{AmazonS3Job, GoogleSheetJob}
import co.datainsider.jobworker.domain.request._
import co.datainsider.jobworker.domain.response.{PreviewResponse, ShopifyAccessTokenResponse, TokenResponse}
import co.datainsider.jobworker.domain.source.{AmazonS3Source, JdbcSource, MongoSource}
import co.datainsider.jobworker.domain.{DataSource, JdbcJob, Job}
import co.datainsider.jobworker.repository.reader.shopify.ShopifyReader
import co.datainsider.jobworker.repository.reader.tiktok.TikTokTokenInfo
import co.datainsider.jobworker.repository.{DataSourceRepository, JdbcReader}
import co.datainsider.jobworker.service.handler.{AmazonS3MetadataHandler, MongoMetadataHandler, SourceMetadataHandler, TikTokAdsMetaDataHandler}
import co.datainsider.jobworker.service.worker.AmazonS3Client
import co.datainsider.jobworker.util.{GoogleCredentialUtils, GoogleOAuthConfig}
import com.amazonaws.services.s3.AmazonS3
import com.shopify.ShopifySdk
import com.shopify.exceptions.{ShopifyClientException, ShopifyErrorResponseException}
import com.shopify.model.Shop
import com.twitter.util.Future
import com.twitter.util.logging.Logging
import co.datainsider.schema.domain.TableSchema
import datainsider.client.exception.{BadRequestError, InternalError, UnsupportedError}
import datainsider.client.util.JsonParser
import scalaj.http.{Http, HttpResponse}

trait MetadataService {
  def testSource(source: DataSource): Future[Boolean]

  def testJob(job: Job): Future[Boolean]

  def listDatabase(request: SuggestDatabaseRequest): Future[Seq[String]]

  def listTable(request: SuggestTableRequest): Future[Seq[String]]

  def listColumn(request: SuggestColumnRequest): Future[Seq[String]]

  def exchangeGoogleTokenCode(authorizationCode: String): Future[TokenResponse]

  /**
    * @throws BadRequestError when shortLivedAccessToken invalid [expired or wrong]
    */
  def exchangeFacebookToken(accessToken: String): Future[TokenResponse]

  def exchangeTikTokToken(authorizationCode: String): Future[TikTokTokenInfo]
  def getShopifyAccessToken(
      shopUrl: String,
      authorizationCode: String,
      apiVersion: String
  ): Future[ShopifyAccessTokenResponse]

  @deprecated("method is unused, need check before remove")
  def getTableSchema(request: GetTableSchemaRequest): Future[TableSchema]

  @deprecated("method is unused, need check before remove")
  def suggestTableSchema(request: SuggestTableSchemaRequest): Future[TableSchema]

  def preview(request: PreviewRequest): Future[PreviewResponse]

  def listTikTokReportTable(): Future[Seq[String]]

  def refreshGoogleToken(accessToken: String, refreshToken: String): Future[TokenResponse]
}

class MetadataServiceImpl(
    sourceRepo: DataSourceRepository,
    shopifyClientId: String,
    shopifyClientSecret: String,
    googleOAuthConfig: GoogleOAuthConfig
) extends MetadataService
    with Logging {

  def testSource(source: DataSource): Future[Boolean] = {
    val sourceHandler: SourceMetadataHandler = SourceMetadataHandler(source)
    sourceHandler.testConnection()
  }

  def testJob(job: Job): Future[Boolean] = {
    // fixme: bad implement, need to refactor. test-job should be use worker instead of metadata handler. worker.test(job)
    job match {
      case jdbcJob: JdbcJob => testJdbcJob(jdbcJob)
      case _                => Future.exception(new UnsupportedError(s"Test job type ${job.jobType} unsupported"))
    }
  }

  private def testJdbcJob(job: Job): Future[Boolean] = {
    for {
      source <- sourceRepo.get(job.orgId, job.sourceId)
      fetchData <- SourceMetadataHandler(source).testJob(job)
    } yield fetchData
  }

  override def listDatabase(request: SuggestDatabaseRequest): Future[Seq[String]] = {
    for {
      source <- sourceRepo.get(request.currentOrganizationId.get, request.sourceId)
      databases <- SourceMetadataHandler(source, request.extraData).listDatabases()
    } yield databases
  }

  override def listTable(request: SuggestTableRequest): Future[Seq[String]] = {
    for {
      source <- sourceRepo.get(request.currentOrganizationId.get, request.sourceId)
      tables <- SourceMetadataHandler(source, request.extraData).listTables(request.databaseName)
    } yield tables
  }

  override def listColumn(request: SuggestColumnRequest): Future[Seq[String]] = {
    for {
      source <- sourceRepo.get(request.currentOrganizationId.get, request.sourceId)
      columns <- SourceMetadataHandler(source, request.extraData).listColumn(request.databaseName, request.tableName)
    } yield columns
  }

  /***
    * This function call google api to get access token and refresh token
    * Usage: When service connect to google api a long time, use this function to get refresh token that help service refresh expired time
    * @param authorizationCode
    * @return
    */
  override def exchangeGoogleTokenCode(authorizationCode: String): Future[TokenResponse] = Future {
    GoogleCredentialUtils.exchangeToken(authorizationCode, googleOAuthConfig)
  }

  override def getTableSchema(request: GetTableSchemaRequest): Future[TableSchema] =
    Future {
      request.syncInfo.job match {
        case jdbcJob: JdbcJob => {
          val batchSize = ZConfig.getInt("sync_batch_size", 1000).max(jdbcJob.maxFetchSize)
          lazy val reader: JdbcReader = JdbcReader(request.syncInfo.source.get.asInstanceOf[JdbcSource], jdbcJob, batchSize)
          // fixme: method need to close
          reader.getTableSchema
        }
        case googleSheetJob: GoogleSheetJob => googleSheetJob.schema
        case _ => throw UnsupportedError(s"Get table schema for job type ${request.syncInfo.job.jobType} unsupported")
      }
    }

  override def suggestTableSchema(request: SuggestTableSchemaRequest): Future[TableSchema] = {
    val tableSchema = sourceRepo.get(request.currentOrganizationId.get, request.sourceId).map {
      case dataSource: MongoSource =>
        new MongoMetadataHandler(dataSource).suggestSchema(request.databaseName, request.tableName)
      case _ => throw BadRequestError(s"Just support mongodb data source type")
    }
    tableSchema.flatten
  }

  override def preview(request: PreviewRequest): Future[PreviewResponse] = {
    if (request.job.isInstanceOf[AmazonS3Job]) {
      val connectionTimeout: Int = 60000
      val timeToLive: Long = 1000
      val client: AmazonS3 = AmazonS3Client(
        request.dataSource.asInstanceOf[AmazonS3Source],
        connectionTimeout = connectionTimeout,
        timeToLive = timeToLive
      )
      val sourceHandler: AmazonS3MetadataHandler = new AmazonS3MetadataHandler(client)
      sourceHandler.preview(request.job.asInstanceOf[AmazonS3Job])
    } else {
      throw BadRequestError("Previewing data only supports AmazonS3 job for now.")
    }
  }

  override def getShopifyAccessToken(
      shopUrl: String,
      authorizationCode: String,
      apiVersion: String
  ): Future[ShopifyAccessTokenResponse] = {
    try {
      val client: ShopifySdk = ShopifyReader.getClient(shopUrl, authorizationCode, shopifyClientId, shopifyClientSecret)
      val shop: Shop = client.getShop
      info(s"getShopifyAccessToken:: ${shopUrl}, apiVersion: ${apiVersion} success, shop ${shop}")
      Future.value(ShopifyAccessTokenResponse(client.getAccessToken))
    } catch {
      case ex: ShopifyErrorResponseException => Future.exception(InternalError(ex.getMessage, ex))
      case ex: ShopifyClientException        => Future.exception(InternalError(ex.getMessage, ex))
    }
  }

  override def exchangeFacebookToken(accessToken: String): Future[TokenResponse] =
    Future {
      val params: Map[String, String] =
        Map(
          "grant_type" -> "fb_exchange_token",
          "client_id" -> ZConfig.getString("facebook_ads.app_id"),
          "client_secret" -> ZConfig.getString("facebook_ads.app_secret"),
          "fb_exchange_token" -> accessToken
        )
      val response: HttpResponse[String] =
        try Http(ZConfig.getString("facebook_ads.exchange_url")).method("GET").params(params).asString
        catch {
          case e: Throwable =>
            logger.error(s"MetadataService::exchangeFacebookToken::${e.getMessage}")
            throw InternalError(e.getMessage, e)
        }
      if (response.is2xx) {
        val tokenResponse = JsonParser.fromJson[TokenResponse](response.body)
        tokenResponse
      } else {
        throw BadRequestError(response.body)
      }
    }

  override def exchangeTikTokToken(authorizationCode: String): Future[TikTokTokenInfo] =
    Future {
      TikTokAdsMetaDataHandler.getTokenInfo(authorizationCode)
    }

  override def listTikTokReportTable(): Future[Seq[String]] =
    Future {
      TikTokAdsMetaDataHandler.listReportTable()
    }

  override def refreshGoogleToken(accessToken: String, refreshToken: String): Future[TokenResponse] = Future {
    GoogleCredentialUtils.refreshToken(accessToken, refreshToken, googleOAuthConfig)
  }
}
