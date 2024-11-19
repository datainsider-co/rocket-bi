package co.datainsider.license.service

import co.datainsider.license.domain.License
import co.datainsider.license.domain.permissions.{SaasUsage, Usage}
import co.datainsider.license.repository.LicenseRepository
import com.google.inject.Inject
import com.twitter.inject.Logging
import com.twitter.util.Future
import co.datainsider.common.client.exception.{BadRequestError, InsufficientPermissionError}

/**
  * Get current status of licence from licence server.
  */
trait LicenseClientService {
  @throws[BadRequestError]("if license key is not found")
  @throws[InsufficientPermissionError]("if license is expired")
  def ensureGet(licenceKey: String): Future[License]

  def multiGet(licenceKeys: Seq[String]): Future[Map[String, License]]

  def verify(licenseKey: String, usage: Usage): Future[Boolean]

  def verify(licenseKey: String, usages: Seq[Usage]): Future[Seq[Boolean]]

  def notify(message: String): Future[Boolean]

  def createTrialSubscription(licenseKey: String): Future[Boolean]
  def isExpired(license: License): Boolean

}

class LicenseClientServiceImpl @Inject() (licenseRepository: LicenseRepository)
    extends LicenseClientService
    with Logging {

  override def ensureGet(licenseKey: String): Future[License] = {
    licenseRepository.get(licenseKey).map {
      case Some(license) => {
        ensureLicense(license)
        license
      }
      case None => throw BadRequestError(s"not found license for key: $licenseKey")
    }
  }

  private def ensureLicense(license: License): Unit = {
    if (isExpired(license)) {
      throw InsufficientPermissionError(
        s"Insufficient permission to perform this action: License '${license.key}' has expired."
      )
    }
  }

  override def isExpired(license: License): Boolean = {
    !license.verify(SaasUsage())
  }

  override def multiGet(licenseKeys: Seq[String]): Future[Map[String, License]] = {
    licenseRepository.multiGet(licenseKeys)
  }

  override def verify(licenseKey: String, usage: Usage): Future[Boolean] = {
    for {
      license <- ensureGet(licenseKey)
    } yield license.verify(usage)
  }

  override def verify(licenseKey: String, usages: Seq[Usage]): Future[Seq[Boolean]] = {
    for {
      license <- ensureGet(licenseKey)
    } yield usages.map(license.verify)
  }

  override def notify(message: String): Future[Boolean] = {
    licenseRepository.notify(message)
  }

  override def createTrialSubscription(licenseKey: String): Future[Boolean] = {
    licenseRepository.createTrialSubscription(licenseKey)
  }
}
