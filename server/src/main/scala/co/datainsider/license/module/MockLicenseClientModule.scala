package co.datainsider.license.module

import com.twitter.inject.TwitterModule
import co.datainsider.license.repository.{LicenseRepository, MockLicenseRepository}
import co.datainsider.license.service.{LicenseClientService, LicenseClientServiceImpl}

object MockLicenseClientModule extends TwitterModule {
  override def configure(): Unit = {
    super.configure()
    bind[LicenseRepository].to[MockLicenseRepository]
    bind[LicenseClientService].to[LicenseClientServiceImpl]
  }

}
