package co.datainsider.license.repository

import co.datainsider.license.domain.permissions._
import co.datainsider.license.domain.{License, LicenseStatus, LicenseType, RangeValue}
import com.google.common.cache.{CacheBuilder, CacheLoader}
import com.twitter.inject.Logging
import com.twitter.util.Future
import datainsider.client.domain.Implicits.async
import datainsider.client.exception.{InsufficientPermissionError, InternalError}
import datainsider.client.util.{HttpClient, JsonParser}

import java.util.concurrent.TimeUnit

trait LicenseRepository {
  def get(licenseKey: String): Future[Option[License]]

  def notify(message: String): Future[Boolean]

  def createTrialSubscription(licenseKey: String): Future[Boolean]
}

class HttpLicenseRepository(host: String, maxCacheSize: Int = 1000, refreshIntervalMin: Int = 60)
    extends LicenseRepository
    with Logging {

  private val licenseKeyLoader = new CacheLoader[String, Option[License]]() {
    override def load(licenseKey: String): Option[License] = {
      try {
        val resp: HttpClient.HttpResponse = HttpClient.get(url = s"$host/licenses/$licenseKey")
        if (resp.isSuccess) {
          val license = JsonParser.fromJson[License](resp.data)
          if (license.verify(SaasUsage())) {
            Some(license)
          } else {
            throw InsufficientPermissionError(
              s"Insufficient permission to perform this action: License '$licenseKey' has expired."
            )
          }
        } else None
      } catch {
        case e: Throwable =>
          logger.error(s"${this.getClass.getSimpleName}::get license key '$licenseKey' failed with exception: $e", e)
          throw InternalError(s"Fetch license from server $host failed with exception: ${e.getMessage}", e)
      }
    }
  }

  override def notify(message: String): Future[Boolean] = {
    try {
      HttpClient.post(url = s"$host/notify", message).isSuccess
    } catch {
      case e: Throwable =>
        logger.error(s"${this.getClass.getSimpleName}::notify failed with exception: $e", e)
        false
    }
  }

  private val licenseKeyCache = CacheBuilder
    .newBuilder()
    .maximumSize(maxCacheSize)
    .refreshAfterWrite(refreshIntervalMin, TimeUnit.MINUTES)
    .build[String, Option[License]](licenseKeyLoader)

  override def get(licenseKey: String): Future[Option[License]] = {
    async {
      licenseKeyCache.getUnchecked(licenseKey)
    }
  }

  override def createTrialSubscription(licenseKey: String): Future[Boolean] =
    async {
      try {
        val resp: HttpClient.HttpResponse = HttpClient.post(url = s"$host/plan/$licenseKey/trial", "{}")
        resp.isSuccess
      } catch {
        case e: Throwable =>
          throw InternalError(s"Call to license server $host failed with exception: ${e.getMessage}", e)
      }
    }
}

class MockLicenseRepository extends LicenseRepository {
  override def get(licenseKey: String): Future[Option[License]] =
    Future {
      val beginTime = System.currentTimeMillis()
      val endTime = beginTime + TimeUnit.DAYS.toMillis(30)
      val saasDefaultTimeRange = RangeValue[Long](beginTime, endTime)

      val mockLicense = License(
        key = licenseKey,
        permissions = Map(
          PermissionKeys.Ingestion -> IngestionPermission(isActive = true, saasDefaultTimeRange),
          PermissionKeys.DataCook -> DataCookPermission(isActive = true, saasDefaultTimeRange),
          PermissionKeys.UserManagement -> UserManagementPermission(isActive = true, saasDefaultTimeRange),
          PermissionKeys.UserActivity -> UserActivityPermission(isActive = true, saasDefaultTimeRange),
          PermissionKeys.ApiKey -> ApiKeyPermission(isActive = true, saasDefaultTimeRange),
          PermissionKeys.TableRelationship -> TableRelationshipPermission(isActive = true, saasDefaultTimeRange),
          PermissionKeys.GoogleOAuth -> GoogleOAuthPermission(isActive = true, saasDefaultTimeRange),
          PermissionKeys.LogoAndCompanyName -> LogoAndCompanyNamePermission(isActive = true, saasDefaultTimeRange),
          PermissionKeys.DashboardPassword -> DashboardPasswordPermission(isActive = true, saasDefaultTimeRange),
          PermissionKeys.NumViewers -> NumViewersPermission(maxNumViewers = 100, validTimeRange = saasDefaultTimeRange),
          PermissionKeys.NumEditors -> NumEditorsPermission(maxNumEditors = 100, validTimeRange = saasDefaultTimeRange),
          PermissionKeys.Saas -> SaasPermission(isActive = true, validTimeRange = saasDefaultTimeRange)
        ),
        licenseType = LicenseType.Saas,
        status = LicenseStatus.Active
      )

      Some(mockLicense)
    }

  override def notify(message: String): Future[Boolean] = Future.True

  override def createTrialSubscription(licenseKey: String): Future[Boolean] = Future.True
}
