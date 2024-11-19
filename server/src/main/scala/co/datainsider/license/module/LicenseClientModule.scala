package co.datainsider.license.module

import co.datainsider.bi.util.ZConfig
import co.datainsider.license.repository.{HttpLicenseRepository, LicenseRepository, MockLicenseRepository}
import co.datainsider.license.service.{LicenseClientService, LicenseClientServiceImpl}
import com.google.inject.Provides
import com.twitter.inject.TwitterModule

import javax.inject.Singleton

object LicenseClientModule extends TwitterModule {
  override def configure(): Unit = {
    super.configure()
    bind[LicenseClientService].to[LicenseClientServiceImpl]
  }

  @Singleton
  @Provides
  def provideLicenseClientRepository(): LicenseRepository = {
    val licenseServerHost = ZConfig.getString("license.server_host", "https://license.datainsider.co")
    val maxCacheSize = ZConfig.getInt("license.max_cache_size", 1000)
    val refreshIntervalMin = ZConfig.getInt("license.refresh_interval_min", 60)
    new HttpLicenseRepository(host = licenseServerHost, maxCacheSize, refreshIntervalMin)
  }

}
