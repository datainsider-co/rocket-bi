package datainsider.admin.module

import com.google.inject.name.Named
import com.google.inject.name.Names.named
import com.google.inject.{Provides, Singleton}
import com.twitter.inject.TwitterModule
import datainsider.admin._
import datainsider.admin.service.MappingCaasClientService
import datainsider.authorization.filters.{PermissionAccessFilters, SettingAccessFilters, UserAccessFilters}
import datainsider.client.filter.PermissionFilter
import datainsider.client.service.CaasClientService

/**
 * @author andy
 */

object AdminAccessFilterModule extends TwitterModule {


  override def configure(): Unit = {
    bind[CaasClientService].annotatedWith(named("MappingCaasClientService")).to[MappingCaasClientService]
  }

  @Provides
  @Singleton
  def providesPermissionFilter(@Named("MappingCaasClientService") caasClientService: CaasClientService): PermissionFilter = {
    new PermissionFilter(caasClientService)
  }



}
