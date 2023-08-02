package co.datainsider.license.service

import com.google.inject.Inject
import com.twitter.inject.Logging
import com.twitter.util.Future
import datainsider.client.exception.BadRequestError
import co.datainsider.license.domain.License
import co.datainsider.license.domain.permissions.Usage
import co.datainsider.license.repository.LicenseRepository

/**
  * Get current status of licence from licence server.
  */
trait LicenseClientService {

  def get(licenceKey: String): Future[License]

  def verify(licenseKey: String, usage: Usage): Future[Boolean]

  def verify(licenseKey: String, usages: Seq[Usage]): Future[Seq[Boolean]]

}

class LicenseClientServiceImpl @Inject() (licenseRepository: LicenseRepository)
    extends LicenseClientService
    with Logging {

  override def get(licenseKey: String): Future[License] = {
    licenseRepository.get(licenseKey).map {
      case Some(license) => license
      case None          => throw BadRequestError(s"not found license for key: $licenseKey")
    }
  }

  override def verify(licenseKey: String, usage: Usage): Future[Boolean] = {
    for {
      license <- get(licenseKey)
    } yield license.verify(usage)
  }

  override def verify(licenseKey: String, usages: Seq[Usage]): Future[Seq[Boolean]] = {
    for {
      license <- get(licenseKey)
    } yield usages.map(license.verify)
  }
}
