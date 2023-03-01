package datainsider.analytics.service.tracking

import akka.actor.{ActorRef, _}
import com.twitter.util.Future
import datainsider.analytics.service.actors.ApiKeyChangedConsumerActor
import datainsider.client.exception.InternalError
import datainsider.client.util.ZConfig
import datainsider.ingestion.controller.http.requests.{CreateAnalyticApiKeyRequest, CreateApiKeyRequest}
import datainsider.ingestion.domain.{ApiKeyInfo, ApiKeyTypes, RateLimitingInfo}
import datainsider.ingestion.repository.ApiKeyRepository
import datainsider.profiler.Profiler

import scala.concurrent.ExecutionContext.Implicits.global

import java.util.UUID
import javax.inject.{Inject, Named}

trait ApiKeyGenerator {
  def generate(apiKeyType: ApiKeyTypes.ApiKeyType): String
}

trait ApiKeyService {

  def createApiKey(request: CreateApiKeyRequest): Future[ApiKeyInfo]

  def addApiKey(apiKeyInfo: ApiKeyInfo): Future[Boolean]

  def getApiKey(apiKey: String): Future[ApiKeyInfo]

  def deleteApiKey(apiKey: String): Future[Boolean]

}

case class DefaultApiKeyGenerator() extends ApiKeyGenerator {

  override def generate(apiKeyType: ApiKeyTypes.ApiKeyType): String = {
    s"$apiKeyType-${UUID.randomUUID().toString}"
  }
}

case class ApiKeyServiceImpl @Inject() (
    keyGenerator: ApiKeyGenerator,
    apiKeyRepository: ApiKeyRepository
//    @Named("api_key_event_consumer_actor") apiKeyEventConsumerActor: ActorRef
) extends ApiKeyService {

  override def createApiKey(request: CreateApiKeyRequest): Future[ApiKeyInfo] =
    Profiler(s"[Tracking] ${this.getClass.getName}::createApiKey") {

      val apiKeyInfo = request.buildApiKeyInfo(keyGenerator.generate(request.keyType))
      addApiKey(apiKeyInfo).map {
        case true => apiKeyInfo
        case false =>
          throw InternalError(
            s"Can't create [${request.keyType}] api key  for this organization: ${request.organizationId}"
          )
      }
    }

  override def addApiKey(apiKeyInfo: ApiKeyInfo): Future[Boolean] =
    Profiler(s"[Tracking] ${this.getClass.getName}::addApiKey") {
      apiKeyRepository.add(apiKeyInfo)
    }

  override def getApiKey(apiKey: String): Future[ApiKeyInfo] =
    Profiler(s"[Tracking] ${this.getClass.getName}::getApiKey") {
      apiKeyRepository.get(apiKey)
    }

  override def deleteApiKey(apiKey: String): Future[Boolean] =
    Profiler(s"[Tracking] ${this.getClass.getName}::deleteApiKey") {
      apiKeyRepository.delete(apiKey)
    }

}

case class ApiKeyServiceLocalConfigImpl() extends ApiKeyService {

  override def createApiKey(request: CreateApiKeyRequest): Future[ApiKeyInfo] = {
    val apiKeyInfo = request.buildApiKeyInfo(UUID.randomUUID().toString)
    Future.value(apiKeyInfo)
  }

  override def addApiKey(apiKeyInfo: ApiKeyInfo): Future[Boolean] = {
    Future.True
  }

  override def getApiKey(apiKey: String): Future[ApiKeyInfo] = {
    val apiKeyInfo = ZConfig.getString("tracking.default_api_key") == apiKey match {
      case true =>
        ApiKeyInfo(
          ApiKeyTypes.Analytics,
          apiKey,
          0L,
          RateLimitingInfo(),
          name = None,
          description = None,
          updatedTime = Some(System.currentTimeMillis()),
          createdTime = Some(System.currentTimeMillis())
        )
      case _ => throw InternalError("Your tracking api key was not found. Please check your configuration file.")
    }

    Future.value(apiKeyInfo)
  }

  override def deleteApiKey(apiKey: String): Future[Boolean] = {
    Future.True
  }

}

case class MockApiKeyServiceImpl() extends ApiKeyService {

  override def createApiKey(request: CreateApiKeyRequest): Future[ApiKeyInfo] = {
    val apiKeyInfo = request.buildApiKeyInfo(UUID.randomUUID().toString)
    Future.value(apiKeyInfo)
  }

  override def addApiKey(apiKeyInfo: ApiKeyInfo): Future[Boolean] = {
    Future.True
  }

  override def getApiKey(apiKey: String): Future[ApiKeyInfo] = {
    val apiKeyInfo = ApiKeyInfo(
      ApiKeyTypes.Analytics,
      apiKey,
      0L,
      RateLimitingInfo(),
      name = None,
      description = None,
      updatedTime = Some(System.currentTimeMillis()),
      createdTime = Some(System.currentTimeMillis())
    )
    Future.value(apiKeyInfo)
  }

  override def deleteApiKey(apiKey: String): Future[Boolean] = {
    Future.True
  }

}
