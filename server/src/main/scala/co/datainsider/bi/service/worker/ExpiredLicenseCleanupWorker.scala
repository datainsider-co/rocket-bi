package co.datainsider.bi.service.worker
import co.datainsider.caas.user_profile.domain.org.Organization
import co.datainsider.caas.user_profile.service.OrganizationService
import co.datainsider.license.domain.License
import co.datainsider.license.domain.permissions.SaasUsage
import co.datainsider.license.service.LicenseClientService
import com.twitter.util.logging.Logging
import co.datainsider.bi.util.Implicits.FutureEnhance

import javax.inject.Inject
class ExpiredLicenseCleanupWorker @Inject() (
    cleaner: OrganizationMetadataCleaner,
    organizationService: OrganizationService,
    licenseService: LicenseClientService,
    remainingPaymentMs: Long,
    ignoreCleanupOrgIds: Set[Long]
) extends Logging {
  private val BATCH_SIZE = 100
  def run(): Unit = {
    try {
      val organizations: Seq[Organization] = getOrgIdsForCleanup()
      cleanup(organizations)
    } catch {
      case ex: Throwable => {
        println(s"Error when clean expired license: ${ex.getMessage}")
      }
    }
  }

  private def getOrgIdsForCleanup(): Seq[Organization] = {
    val organizations: Seq[Organization] = organizationService
      .getAllOrganizations()
      .syncGet()
    val licensesMap: Map[String, License] = organizations
      .map(_.licenceKey)
      .grouped(BATCH_SIZE)
      .flatMap((keys: Seq[String]) => licenseService.multiGet(keys).syncGet())
      .toMap
    val expiredLicenses: Seq[License] = getExpiredLicenses(licensesMap)
    val licenseToOrgMap: Map[String, Organization] = organizations.map(org => org.licenceKey -> org).toMap
    expiredLicenses
      .flatMap(license => licenseToOrgMap.get(license.key))
      .filter(org => !isIgnoreCleanup(org.organizationId))
  }

  private def isIgnoreCleanup(orgId: Long): Boolean = {
    ignoreCleanupOrgIds.contains(orgId)
  }

  private def getExpiredLicenses(licensesMap: Map[String, License]): Seq[License] = {
    licensesMap.values
      .filter(license => licenseService.isExpired(license))
      .filter(license => canRemove(license))
      .toSeq
  }

  private def canRemove(license: License): Boolean = {
    license.getPermission(SaasUsage()) match {
      case Some(perm) => {
        val maxRemainingMs = perm.validTimeRange.max + remainingPaymentMs
        System.currentTimeMillis() > maxRemainingMs
      }
      case None => false
    }
  }

  private def cleanup(organizations: Seq[Organization]): Unit = {
    organizations.foreach { organization =>
      try {
        cleaner.clean(organization.organizationId)
      } catch {
        case ex: Throwable => {
          logger.error(s"Error when clean organization $organization: ${ex.getMessage}")
        }
      }
    }
  }
}
