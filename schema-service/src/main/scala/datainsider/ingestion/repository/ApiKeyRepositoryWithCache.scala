package datainsider.ingestion.repository
import com.google.common.cache.{CacheBuilder, CacheLoader, LoadingCache}
import com.google.inject.Inject
import com.twitter.util.Future
import datainsider.ingestion.domain.ApiKeyInfo
import datainsider.ingestion.util.Implicits.FutureEnhance
import datainsider.profiler.Profiler

import java.util.concurrent.TimeUnit
import scala.concurrent.ExecutionContext.Implicits.global

class ApiKeyRepositoryWithCache @Inject() (
    apiKeyRepository: ApiKeyRepository,
    maxCacheSize: Long = 1000,
    maxExpireTime: Long = 60 /*expire after access in second*/
) extends ApiKeyRepository {

  val apiKeyLoader: CacheLoader[String, ApiKeyInfo] = new CacheLoader[String, ApiKeyInfo] {
    override def load(key: String): ApiKeyInfo = {
      apiKeyRepository.get(key).syncGet()
    }
  }

  val apiKeyCache: LoadingCache[String, ApiKeyInfo] = CacheBuilder
    .newBuilder()
    .maximumSize(maxCacheSize)
    .expireAfterAccess(maxExpireTime, TimeUnit.SECONDS)
    .build[String, ApiKeyInfo](apiKeyLoader)

  override def add(apiKeyInfo: ApiKeyInfo): Future[Boolean] =
    Profiler(s"[Tracking] ${this.getClass.getName}::add") {
      apiKeyRepository.add(apiKeyInfo)
    }

  override def get(apiKey: String): Future[ApiKeyInfo] =
    Profiler(s"[Tracking] ${this.getClass.getName}::get") {
      Future {
        apiKeyCache.getUnchecked(apiKey)
      }
    }

  override def delete(apiKey: String): Future[Boolean] =
    Profiler(s"[Tracking] ${this.getClass.getName}::delete") {
      apiKeyCache.invalidate(apiKey)
      apiKeyRepository.delete(apiKey)
    }

  override def list(organizationId: Long): Future[Seq[ApiKeyInfo]] =
    Profiler(s"[Tracking] ${this.getClass.getName}::list") {
      apiKeyRepository.list(organizationId)
    }
}
