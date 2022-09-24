package co.datainsider.bi.module

import co.datainsider.bi.controller.http.filter.dashboard._
import co.datainsider.bi.controller.http.filter.directory._
import co.datainsider.bi.controller.http.filter.widget.{CreateWidgetRightFilter, DeleteWidgetRightFilter, EditWidgetRightFilter, ViewWidgetRightFilter}
import com.twitter.inject.TwitterModule
import datainsider.authorization.filters.{DashboardAccessFilters, DirectoryAccessFilters, WidgetAccessFilters}

/**
  * @author andy
  */

object AccessFilterModule extends TwitterModule {

  protected override def configure(): Unit = {
    super.configure()

    configureDirectoryFilters()
    configureDashboardFilters()
    configureWidgetFilters()
  }

  private def configureDirectoryFilters(): Unit = {

    bind[DirectoryAccessFilters.ViewAccessFilter].to[ViewDirectoryRightFilter].asEagerSingleton()
    bind[DirectoryAccessFilters.CreateAccessFilter].to[CreateDirectoryRightFilter].asEagerSingleton()
    bind[DirectoryAccessFilters.EditAccessFilter].to[EditDirectoryRightFilter].asEagerSingleton()
    bind[DirectoryAccessFilters.CopyAccessFilter].to[CopyDirectoryRightFilter].asEagerSingleton()
    bind[DirectoryAccessFilters.DeleteAccessFilter].to[DeleteDirectoryRightFilter].asEagerSingleton()

  }

  private def configureDashboardFilters(): Unit = {
    bind[DashboardAccessFilters.ViewAccessFilter].to[ViewDashboardRightFilter].asEagerSingleton()
    bind[DashboardAccessFilters.CreateAccessFilter].to[CreateDashboardRightFilter].asEagerSingleton()
    bind[DashboardAccessFilters.EditAccessFilter].to[EditDashboardRightFilter].asEagerSingleton()
    bind[DashboardAccessFilters.ShareAccessFilter].to[ShareDashboardRightFilter].asEagerSingleton()
    bind[DashboardAccessFilters.CopyAccessFilter].to[CopyDashboardRightFilter].asEagerSingleton()
    bind[DashboardAccessFilters.DeleteAccessFilter].to[DeleteDashboardRightFilter].asEagerSingleton()
  }

  private def configureWidgetFilters(): Unit = {
    bind[WidgetAccessFilters.ViewAccessFilter].to[ViewWidgetRightFilter].asEagerSingleton()
    bind[WidgetAccessFilters.CreateAccessFilter].to[CreateWidgetRightFilter].asEagerSingleton()
    bind[WidgetAccessFilters.EditAccessFilter].to[EditWidgetRightFilter].asEagerSingleton()
    bind[WidgetAccessFilters.DeleteAccessFilter].to[DeleteWidgetRightFilter].asEagerSingleton()
  }

}
