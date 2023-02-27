package datainsider.jobscheduler.service

import com.google.inject.Inject
import com.twitter.util.Future
import datainsider.client.exception.BadRequestError
import datainsider.jobscheduler.domain.DataSource
import datainsider.jobscheduler.domain.Ids.SourceId
import datainsider.jobscheduler.domain.request.{CreateDatasourceRequest, PaginationRequest, PaginationResponse, UpdateDataSourceRequest}
import datainsider.jobscheduler.repository.{DataSourceRepository, JobRepository}
import datainsider.jobscheduler.util.ZConfig
import kong.unirest.Unirest

trait DataSourceService {

  def create(orgId: Long, creatorId: String, dataSource: DataSource): Future[Option[DataSource]]

  def list(orgId: Long, request: PaginationRequest): Future[PaginationResponse[DataSource]]

  def delete(orgId: Long, id: SourceId): Future[Boolean]

  def update(orgId: Long, source: DataSource): Future[Boolean]

  def get(orgId: Long, id: SourceId): Future[Option[DataSource]]

  def getFbAdsLongLiveToken(accessToken: String): Future[String]

  def transferOwnerId(orgId: Long, fromUsername: String, toUsername: String): Future[Boolean]

  def deleteByOwnerId(orgId: Long, username: String): Future[Boolean]
}

class DataSourceServiceImpl @Inject() (sourceRepository: DataSourceRepository, jobRepository: JobRepository)
    extends DataSourceService {

  override def create(orgId: Long, creatorId: String, dataSource: DataSource): Future[Option[DataSource]] = {
    for {
      createdId <- sourceRepository.insert(orgId, creatorId, dataSource)
      dataSource <- get(orgId: Long, createdId)
    } yield dataSource
  }

  override def list(orgId: Long, request: PaginationRequest): Future[PaginationResponse[DataSource]] = {
    for {
      sources <- sourceRepository.list(orgId, request.from, request.size, request.sorts, request.keyword)
      total <- sourceRepository.count(orgId, request.keyword)
    } yield PaginationResponse(sources, total)
  }

  override def delete(orgId: Long, id: SourceId): Future[Boolean] = {
    for {
      sourceOk <- sourceRepository.delete(orgId, id)
      jobOk <- jobRepository.delete(orgId, sourceId = Some(id), jobId = None)
    } yield sourceOk && jobOk
  }

  override def update(orgId: Long, source: DataSource): Future[Boolean] = sourceRepository.update(orgId, source)

  override def get(orgId: Long, id: SourceId): Future[Option[DataSource]] = {
    sourceRepository.get(orgId, id)
  }

  override def getFbAdsLongLiveToken(accessToken: String): Future[String] = Future{
    val clientId = ZConfig.getString("fb_app_id")
    val appSecret = ZConfig.getString("fb_app_secret")
    Unirest.get(s"https://graph.facebook.com/v11.0/oauth/access_token?grant_type=fb_exchange_token&client_id=$clientId&client_secret=$appSecret&fb_exchange_token=$accessToken")
      .header("content-type", "application/x-www-form-urlencoded").asString().getBody
  }

  override def transferOwnerId(orgId: SourceId, fromUsername: String, toUsername: String): Future[Boolean] = {
    for {
      _ <- sourceRepository.transferOwnerId(orgId, fromUsername, toUsername)
    } yield true
  }

  override def deleteByOwnerId(orgId: SourceId, username: String): Future[Boolean] = {
    for {
      dataSources <- sourceRepository.listByUsername(orgId, username)
      _ <- jobRepository.deleteBySourceIds(orgId, dataSources.map(_.getId))
      _ <- sourceRepository.deleteByUsername(orgId, username)
    } yield true
  }
}



//val response = Unirest.post(serverEncodedUrl)
//.header("content-type", "application/x-www-form-urlencoded")
//.body(s"code=$authorizationCode&redirect_uri=$redirectUri&client_id=$clientId&client_secret=$clientSecret&scope=&grant_type=authorization_code")
//.asString()
