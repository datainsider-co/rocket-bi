package co.datainsider.bi.service

import co.datainsider.bi.domain.Ids.{DashboardId, DirectoryId, WidgetId}
import co.datainsider.bi.domain._
import co.datainsider.bi.domain.chart.Widget
import co.datainsider.bi.domain.request._
import co.datainsider.bi.repository.{ChartResponseRepository, DashboardRepository}
import co.datainsider.bi.util.Implicits._
import co.datainsider.bi.util.Serializer
import co.datainsider.caas.user_profile.client.ProfileClientService
import co.datainsider.share.controller.request.GetOrCreatePermissionTokenRequest
import co.datainsider.share.service.{PermissionTokenService, ShareService}
import com.google.inject.Inject
import com.twitter.util.Future
import datainsider.authorization.domain.PermissionProviders
import co.datainsider.caas.user_profile.domain.user.UserProfile
import datainsider.client.exception.{BadRequestError, InternalError, NotFoundError}
import education.x.commons.I32IdGenerator
import org.nutz.ssdb4j.spi.SSDB

import scala.concurrent.ExecutionContext.Implicits.global

trait DashboardService {
  def getOwner(organizationId: Long, toLong: DashboardId): Future[UserProfile]

  def list(orgId: Long, from: Int, size: Int): Future[Seq[Dashboard]]

  def count(orgId: Long): Future[Long]

  def get(orgId: Long, dashboardId: DashboardId): Future[Dashboard]

  def get(request: GetDashboardRequest): Future[Dashboard]

  def create(request: CreateDashboardRequest): Future[Dashboard]

  def rename(request: RenameDashboardRequest): Future[Boolean]

  @deprecated("use updateSettings instead")
  def updateMainDateFilter(request: UpdateMainDateFilterRequest): Future[Boolean]

  def delete(request: DeleteDashboardRequest): Future[Boolean]

  @deprecated("use shareWithAnyone in ShareService")
  def share(request: ShareDashboardRequest): Future[PermissionToken]

  def createWidget(request: CreateWidgetRequest): Future[Widget]

  def getWidget(request: GetWidgetRequest): Future[Widget]

  def getWidget(orgId: Long, dashboardId: Long, widgetId: Long): Future[Widget]

  def editWidget(request: EditWidgetRequest): Future[Boolean]

  def deleteWidget(request: DeleteWidgetRequest): Future[Boolean]

  def resizeWidgets(request: ResizeWidgetsRequest): Future[Boolean]

  def updateSettings(request: UpdateSettingsRequest): Future[Boolean]

  def getDirectoryId(orgId: Long, dashboardId: DashboardId): Future[DirectoryId]

  def refreshBoost(request: RefreshBoostRequest): Future[Boolean]

  def forceBoost(request: ForceBoostRequest): Future[Unit]

  def updateBoostInfo(orgId: Long, dashboardId: Long, newBoostInfo: Option[BoostInfo]): Future[Boolean]

  def createFromTemplate(request: CreateFromTemplateRequest): Future[Dashboard]

  def listTemplateDashboards(request: ListTemplateDashboardsRequest): Future[Array[Directory]]

}

class DashboardServiceImpl @Inject() (
    dashboardRepository: DashboardRepository,
    directoryService: DirectoryService,
    permissionTokenService: PermissionTokenService,
    ssdb: SSDB,
    profileService: ProfileClientService,
    shareService: ShareService,
    drillThroughService: DrillThroughService,
    boostScheduleService: BoostScheduleService,
    chartResponseRepository: ChartResponseRepository
) extends DashboardService {

  override def list(orgId: Long, from: Int, size: Int): Future[Seq[Dashboard]] = {
    dashboardRepository.list(orgId, from, size)
  }

  override def count(orgId: Long): Future[DashboardId] = {
    dashboardRepository.count(orgId)
  }

  override def get(orgId: Long, dashboardId: DashboardId): Future[Dashboard] = {
    fetch(orgId, dashboardId)
  }

  override def get(request: GetDashboardRequest): Future[Dashboard] = {
    val orgId: Long = getOrgId(request.currentOrganizationId)
    fetch(orgId, request.id)
  }

  override def create(request: CreateDashboardRequest): Future[Dashboard] = {
    val orgId: Long = getOrgId(request.currentOrganizationId)

    for {
      parentDir <- directoryService.get(orgId, request.parentDirectoryId)
      newDashboard <- prepareDashboardFromRequest(request, parentDir.ownerId, request.currentUsername)
      createdDashboardId <- dashboardRepository.create(orgId, newDashboard)
      directory <- directoryService.create(
        CreateDirectoryRequest(
          name = request.name,
          parentId = request.parentDirectoryId,
          directoryType = request.directoryType,
          dashboardId = Some(createdDashboardId),
          request = request.request
        )
      )
      _ <- shareService.copyPermissionFromParent(
        request.getOrganizationId,
        directory.id.toString,
        parentDir.id.toString,
        DirectoryType.Directory.toString,
        request.currentUser.username,
        parentDir.ownerId
      )
      dashboard <- fetch(orgId, createdDashboardId)
      _ <- drillThroughService.updateDrillThroughFields(dashboard)
    } yield dashboard
  }

  override def rename(request: RenameDashboardRequest): Future[Boolean] = {
    val orgId: Long = getOrgId(request.currentOrganizationId)

    for {
      _ <- fetch(orgId, request.id)
      dirId <-
        directoryService
          .list(ListDirectoriesRequest(dashboardId = Some(request.id), request = request.request))
          .map(_.head.id)
      response <- directoryService.rename(RenameDirectoryRequest(dirId, request.toName, request = request.request))
    } yield response
  }

  override def updateMainDateFilter(request: UpdateMainDateFilterRequest): Future[Boolean] = {
    val orgId: Long = getOrgId(request.currentOrganizationId)

    for {
      _ <- fetch(orgId, request.id)
      directoryId <- getDirectoryId(orgId, request.id)
      _ <- directoryService.updateUpdatedDate(orgId, directoryId)
      response <- dashboardRepository.updateMainDateFilter(
        orgId,
        request.id,
        request.mainDateFilter
      )
    } yield response
  }

  override def delete(request: DeleteDashboardRequest): Future[Boolean] = {
    val orgId: Long = getOrgId(request.currentOrganizationId)

    for {
      _ <- fetch(orgId, request.id)
      dirId <-
        directoryService
          .list(ListDirectoriesRequest(dashboardId = Some(request.id), request = request.request))
          .map(_.head.id)
      response <- directoryService.hardDelete(request.getOrganizationId(), dirId)
      _ <- drillThroughService.deleteDrillThroughFields(request.id)
    } yield response
  }

  override def share(request: ShareDashboardRequest): Future[PermissionToken] = {
    val orgId: Long = getOrgId(request.currentOrganizationId)
    val userId = request.currentUser.username

    fetch(orgId, request.id).flatMap(dashboard => {
      if (dashboard.creatorId == userId)
        for {
          id <- getShareToken(request)
          tokenInfo <- permissionTokenService.getToken(id)
        } yield tokenInfo
      else
        throw BadRequestError("only creator of dashboard can share")
    })
  }

  override def createWidget(request: CreateWidgetRequest): Future[Widget] = {
    val orgId: Long = getOrgId(request.currentOrganizationId)

    for {
      dashboard <- fetch(orgId, request.dashboardId)
      directoryId <- getDirectoryId(orgId, request.dashboardId)
      _ <- directoryService.updateUpdatedDate(orgId, directoryId)
      newWidget <- assignWidgetInfo(request.widget, dashboard.ownerId, request.currentUsername)
      newDashboard = addWidgetInfo(dashboard, newWidget, request.position)
      _ <- dashboardRepository.updateWidgets(
        orgId,
        request.dashboardId,
        newDashboard.widgets,
        newDashboard.widgetPositions
      )
      createdWidget <- getWidget(orgId, request.dashboardId, newWidget.id)
      _ <- drillThroughService.updateDrillThroughFields(newDashboard)
    } yield createdWidget
  }

  override def getWidget(request: GetWidgetRequest): Future[Widget] = {
    val orgId: Long = getOrgId(request.currentOrganizationId)
    getWidget(orgId, request.dashboardId, request.widgetId)
  }

  override def getWidget(orgId: DashboardId, dashboardId: DashboardId, widgetId: DashboardId): Future[Widget] = {
    for {
      dashboard <- fetch(orgId, dashboardId)
      widget = findWidget(dashboard, widgetId)
    } yield widget
  }

  override def editWidget(request: EditWidgetRequest): Future[Boolean] = {
    val orgId: Long = getOrgId(request.currentOrganizationId)
    val newWidget = request.widget

    for {
      dashboard <- fetch(orgId, request.dashboardId)
      directoryId <- getDirectoryId(orgId, request.dashboardId)
      _ <- directoryService.updateUpdatedDate(orgId, directoryId)
      oldWidget = findWidget(dashboard, request.widgetId)
      newDashboard = updateWidgetInfo(dashboard, oldWidget, newWidget)
      response <- dashboardRepository.updateWidgets(
        orgId,
        request.dashboardId,
        newDashboard.widgets,
        newDashboard.widgetPositions
      )
      _ <- drillThroughService.updateDrillThroughFields(newDashboard)
    } yield response
  }

  override def deleteWidget(request: DeleteWidgetRequest): Future[Boolean] = {
    val orgId: Long = getOrgId(request.currentOrganizationId)

    for {
      dashboard <- fetch(orgId, request.dashboardId)
      directoryId <- getDirectoryId(orgId, request.dashboardId)
      _ <- directoryService.updateUpdatedDate(orgId, directoryId)
      deletedWidget = findWidget(dashboard, request.widgetId)
      newDashboard = dropWidget(dashboard, request.widgetId)
      response <- dashboardRepository.updateWidgets(
        orgId,
        request.dashboardId,
        newDashboard.widgets,
        newDashboard.widgetPositions
      )
      _ <- drillThroughService.updateDrillThroughFields(newDashboard)
    } yield response
  }

  override def resizeWidgets(request: ResizeWidgetsRequest): Future[Boolean] = {
    val orgId: Long = getOrgId(request.currentOrganizationId)

    for {
      dashboard <- fetch(orgId, request.dashboardId)
      directoryId <- getDirectoryId(orgId, request.dashboardId)
      _ <- directoryService.updateUpdatedDate(orgId, directoryId)
      newDashboard = updatePositionsInfo(dashboard, request.positions)
      response <- dashboardRepository.updateWidgets(
        orgId,
        request.dashboardId,
        newDashboard.widgets,
        newDashboard.widgetPositions
      )
    } yield response
  }

  override def updateSettings(request: UpdateSettingsRequest): Future[Boolean] = {
    val orgId: Long = getOrgId(request.currentOrganizationId)

    for {
      dashboard <- fetch(orgId, request.id)
      directoryId <- getDirectoryId(orgId, request.id)
      _ <- directoryService.updateUpdatedDate(orgId, directoryId)
      newDashboard = dashboard.copy(
        name = request.name.getOrElse(dashboard.name),
        mainDateFilter = if (request.mainDateFilter.isDefined) request.mainDateFilter else dashboard.mainDateFilter,
        boostInfo = if (request.boostInfo.isDefined) request.boostInfo else dashboard.boostInfo,
        setting = if (request.setting.isDefined) request.setting else dashboard.setting
      )
      updated <- dashboardRepository.update(orgId, request.id, newDashboard)
      _ <- setupPerformanceBoost(request.boostInfo, newDashboard)
    } yield updated
  }

  private def setupPerformanceBoost(boostInfo: Option[BoostInfo], dashboard: Dashboard): Future[Unit] =
    Future {
      if (boostInfo.isEmpty || !boostInfo.get.enable) {
        boostScheduleService.unscheduleJob(dashboard.id)
      } else {
        boostScheduleService.scheduleJob(dashboard)
      }
    }

  private def addWidgetInfo(dashboard: Dashboard, widget: Widget, position: Position): Dashboard = {
    dashboard.copy(
      widgets = Some(dashboard.widgets.get :+ widget),
      widgetPositions = Some(dashboard.widgetPositions.get + (widget.id -> position))
    )
  }

  private def updateWidgetInfo(dashboard: Dashboard, oldWidget: Widget, newWidget: Widget): Dashboard = {
    val index: Int = dashboard.widgets.get.indexWhere(_.isEqualId(oldWidget.id))
    val updatedWidget: Widget = newWidget.copyInfo(oldWidget)
    dashboard.widgets.get.update(index, updatedWidget)
    dashboard
  }

  private def updatePositionsInfo(dashboard: Dashboard, positions: Option[Map[WidgetId, Position]]): Dashboard = {
    positions match {
      case Some(_) =>
        val json = Serializer.toJson(positions)
        val posFromJson = Serializer.fromJson[Map[WidgetId, Position]](json)
        val ids = dashboard.widgets.get.map(_.id).toSet
        val posIds = posFromJson.keySet
        if (ids == posIds)
          dashboard.copy(widgetPositions = positions)
        else
          throw BadRequestError("widget positions do not match current widget")
      case None =>
        throw BadRequestError("widget positions can not be empty")
    }
  }

  private def fetch(orgId: Long, dashboardId: DashboardId): Future[Dashboard] = {
    for {
      dashboard <- dashboardRepository.get(orgId, dashboardId).map {
        case Some(x) => x
        case None    => throw NotFoundError(s"no dashboard found for id: $dashboardId")
      }
      checkOrg <- profileService.getUserProfile(orgId, dashboard.ownerId).map {
        case Some(user) => /* exists user with this org */
        case None       => throw NotFoundError(s"this dashboard does not belong to your organization.")
      }
    } yield dashboard
  }

  private def findWidget(dashboard: Dashboard, widgetId: WidgetId): Widget = {
    dashboard.widgets.get.find(_.isEqualId(widgetId)) match {
      case Some(x) => x
      case None    => throw NotFoundError(s"no widget found for dashboard id: ${dashboard.id} - widget id: $widgetId")
    }
  }

  private def dropWidget(dashboard: Dashboard, widgetId: WidgetId): Dashboard = {
    dashboard.copy(
      widgets = Some(dashboard.widgets.get.filter(!_.isEqualId(widgetId))),
      widgetPositions = Some(dashboard.widgetPositions.get.filterKeys(!_.equals(widgetId)))
    )
  }

  private def assignWidgetInfo(widget: Widget, ownerId: String, creatorId: String): Future[Widget] = {
    val idGen = I32IdGenerator("bi-service", "widget_id", ssdb)
    idGen.getNextId().asTwitterFuture.map {
      case Some(id) => widget.withId(id).withOwner(ownerId = ownerId).withCreator(creatorId)
      case None     => throw InternalError("gen widget id fail")
    }
  }

  @deprecated("will remove when remove share")
  private def getShareToken(request: ShareDashboardRequest): Future[String] = {
    val dashboardId = request.id
    if (request.actions.length == 0)
      throw BadRequestError("share type has not been chosen")

    val permissions = request.actions.map(action =>
      PermissionProviders.permissionBuilder
        .perm(request.getOrganizationId, "dashboard", action, dashboardId.toString)
    )
    permissionTokenService.getOrCreateToken(
      GetOrCreatePermissionTokenRequest(
        "dashboard",
        dashboardId.toString,
        Some(permissions),
        request.request
      )
    )
  }

  override def getOwner(organizationId: Long, id: DashboardId): Future[UserProfile] = {
    for {
      maybeDashboard <- dashboardRepository.get(organizationId, id)
      dashboard = maybeDashboard match {
        case Some(dashboard) => dashboard
        case _               => throw NotFoundError(s"not found dashboard id = ${id}")
      }
      maybeProfile <- profileService.getUserProfile(organizationId, dashboard.ownerId)
    } yield maybeProfile match {
      case Some(profile) => profile
      case _             => throw NotFoundError(s"fail to load profile of owner of dashboard id ${id}")
    }
  }

  override def getDirectoryId(orgId: Long, dashboardId: DashboardId): Future[DirectoryId] = {
    directoryService
      .listByDashboardIds(orgId, Array(dashboardId))
      .map(_.headOption match {
        case Some(value) => value.id
        case None        => throw BadRequestError(s"not found directory id with dashboard = $dashboardId")
      })
  }

  override def refreshBoost(request: RefreshBoostRequest): Future[Boolean] = {
    val orgId: Long = getOrgId(request.currentOrganizationId)

    for {
      responseIds <- fetch(orgId, request.id).map(dashboard => dashboard.toChartRequests.map(_.toResponseId))
      deleteOk <- chartResponseRepository.multiDelete(responseIds)
    } yield deleteOk
  }

  override def forceBoost(request: ForceBoostRequest): Future[Unit] = {
    val orgId: Long = getOrgId(request.currentOrganizationId)
    val boostJob = new BoostJob(this, chartResponseRepository)

    for {
      dashboard <- get(orgId, request.id)
      forceRunJob <- Future(boostJob.boost(dashboard))
    } yield forceRunJob
  }

  override def updateBoostInfo(orgId: Long, dashboardId: Long, newBoostInfo: Option[BoostInfo]): Future[Boolean] = {
    for {
      newDashboard <- dashboardRepository.get(orgId, dashboardId).map {
        case Some(dashboard) => dashboard.copy(boostInfo = newBoostInfo)
        case None            => throw BadRequestError(s"not found dashboard for id $dashboardId")
      }
      updated <- dashboardRepository.update(orgId, dashboardId, newDashboard)
      _ <- setupPerformanceBoost(newBoostInfo, newDashboard)
    } yield updated
  }

  override def createFromTemplate(request: CreateFromTemplateRequest): Future[Dashboard] = {
    for {
      templateDashboard <- get(request.fromOrgId, request.fromDashboardId)
      newDashboard = templateDashboard.copyWithReplacements(Map(request.fromDbName -> request.toDbName))
      createdDashboard <- create(
        CreateDashboardRequest(
          name = newDashboard.name,
          parentDirectoryId = request.toParentDirId,
          mainDateFilter = newDashboard.mainDateFilter,
          widgets = newDashboard.widgets,
          widgetPositions = newDashboard.widgetPositions,
          setting = newDashboard.setting,
          boostInfo = newDashboard.boostInfo,
          request = request.request
        )
      )
    } yield createdDashboard
  }

  override def listTemplateDashboards(request: ListTemplateDashboardsRequest): Future[Array[Directory]] = {
    val orgId: Long = getOrgId(request.currentOrganizationId)
    for {
      dashboards <- dashboardRepository.list(orgId, request.from, request.size, Some(true))
      directories <-
        directoryService.list(ListDirectoriesRequest(dashboardIds = dashboards.map(_.id), request = request.request))
    } yield directories
  }

  private def prepareDashboardFromRequest(
      request: CreateDashboardRequest,
      ownerId: String,
      creatorId: String
  ): Future[Dashboard] = {
    val orgId: Long = getOrgId(request.currentOrganizationId)
    for {
      newWidgetAsMap <- Future.collect(
        request.widgets
          .getOrElse(Array.empty)
          .map(widget => {
            widget.id -> assignWidgetInfo(widget, ownerId, creatorId)
          })
          .toMap
      )
      newPositions: Map[WidgetId, Position] =
        request.widgetPositions
          .getOrElse(Map.empty)
          .map {
            case (oldId: WidgetId, position: Position) =>
              val newId: Option[WidgetId] = newWidgetAsMap.get(oldId).map(_.id)
              newId.getOrElse(oldId) -> position
          }
    } yield Dashboard(
      orgId = orgId,
      name = request.name,
      creatorId = creatorId,
      ownerId = ownerId,
      setting = request.setting,
      mainDateFilter = request.mainDateFilter,
      widgets = Some(newWidgetAsMap.values.toArray),
      widgetPositions = Some(newPositions),
      boostInfo = request.boostInfo
    )
  }

  private def getOrgId(orgId: Option[Long]): Long = {
    orgId match {
      case Some(id) => id
      case None     => throw BadRequestError("Your request has not been authorized.")
    }
  }

}
