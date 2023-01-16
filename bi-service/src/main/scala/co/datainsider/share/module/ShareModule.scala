package co.datainsider.share.module

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.module.BIServiceModule.{
  dbLiveName,
  dbTestName,
  tblObjectSharingTokenName,
  tblPermissionTokenName,
  tblShareInfoName
}
import co.datainsider.share.controller.filter._
import co.datainsider.share.repository._
import co.datainsider.share.service._
import com.google.inject.name.Named
import com.google.inject.{Inject, Provides, Singleton}
import com.twitter.inject.TwitterModule
import education.x.commons.I32IdGenerator
import org.nutz.ssdb4j.spi.SSDB

object ShareModule extends TwitterModule {

  private def bindFilters(): Unit = {
    bindSingleton[ShareAccessFilters.ViewAccessFilter].to[ViewAccessFilterImpl]
    bindSingleton[ShareAccessFilters.EditAccessFilter].to[EditAccessFilterImpl]
    bindSingleton[ShareAccessFilters.DeleteAccessFilter].to[DeleteAccessFilterImpl]

    bindSingleton[DirectoryPermissionService].to[DirectoryPermissionServiceImplV2]
    bindSingleton[DashboardPermissionService].to[DashboardPermissionServiceImpl]
  }

  override def configure(): Unit = {
    bind[PermissionTokenService].to[PermissionTokenServiceImpl].asEagerSingleton()
    bindSingleton[ShareService].to[DirectoryShareServiceImpl]
    bindFilters()
  }

  @Singleton
  @Provides
  def provideDashboardLinkSharingRepository(@Inject @Named("mysql") client: JdbcClient): ObjectTokenRepository = {
    new MysqlObjectTokenRepository(client, dbLiveName, tblObjectSharingTokenName)
  }

  @Singleton
  @Provides
  def providePermissionTokenRepository(@Inject @Named("mysql") client: JdbcClient): PermissionTokenManager = {
    new MysqlPermissionTokenManager(client, dbLiveName, tblPermissionTokenName, tblObjectSharingTokenName)
  }

  @Singleton
  @Provides
  def provideShareRepository(@Inject @Named("mysql") client: JdbcClient, ssdb: SSDB): ShareRepository = {
    val generator = I32IdGenerator("share_service", "id", ssdb)
    MySqlShareRepository(client, dbLiveName, tblShareInfoName, generator)
  }
}

object MockShareModule extends TwitterModule {

  def bindTestFilters(): Unit = {
    bindSingleton[ShareAccessFilters.ViewAccessFilter].to[MockViewAccessFilter]
    bindSingleton[ShareAccessFilters.EditAccessFilter].to[EditAccessTestFilter]
    bindSingleton[ShareAccessFilters.DeleteAccessFilter].to[DeleteAccessTestFilter]
  }

  override def configure(): Unit = {
    bindSingleton[ShareService].to[MockShareService]
    bindTestFilters()
  }

  @Singleton
  @Provides
  def providePermissionTokenRepository(@Inject @Named("mysql") client: JdbcClient): PermissionTokenManager = {
    new MysqlPermissionTokenManager(client, dbTestName, tblPermissionTokenName, tblObjectSharingTokenName)
  }

  @Singleton
  @Provides
  def provideDashboardLinkSharingRepository(@Inject @Named("mysql") client: JdbcClient): ObjectTokenRepository = {
    new MysqlObjectTokenRepository(client, dbTestName, tblObjectSharingTokenName)
  }

  @Singleton
  @Provides
  def provideShareRepository(@Inject @Named("mysql") client: JdbcClient, ssdb: SSDB): ShareRepository = {
    val generator = I32IdGenerator("share_service_test", "id", ssdb)
    MySqlShareRepository(client, dbTestName, tblShareInfoName, generator)
  }
}
