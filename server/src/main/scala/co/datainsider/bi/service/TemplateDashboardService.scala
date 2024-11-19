//package co.datainsider.bi.service
//
//import co.datainsider.bi.domain._
//import co.datainsider.bi.domain.request.{CreateDashboardRequest, CreateFromTemplateRequest}
//import co.datainsider.bi.domain.response.TemplateDashboardResponse
//import co.datainsider.bi.repository.TemplateDashboardRepository
//import co.datainsider.bi.util.Implicits.RichOption
//import co.datainsider.common.client.exception.{BadRequestError, NotFoundError}
//import co.datainsider.share.domain.response.PageResult
//import com.twitter.util.Future
//
//import javax.inject.Inject
//
///**
//  * created 2023-10-04 2:11 PM
//  *
//  * @author tvc12 - Thien Vi
//  */
//trait TemplateDashboardService {
//  def list(keyword: String, from: Int, size: Int): Future[PageResult[TemplateDashboardResponse]]
//
//  def get(id: Long): Future[TemplateDashboard]
//
//  def create(
//      orgId: Long,
//      name: String,
//      description: String,
//      dashboard: Dashboard,
//      thumbnail: String,
//      setting: TemplateSetting,
//      creatorId: String
//  ): Future[TemplateDashboard]
//
//  def update(
//      id: Long,
//      name: Option[String],
//      description: Option[String],
//      dashboard: Option[Dashboard],
//      thumbnail: Option[String],
//      setting: Option[TemplateSetting],
//      updatedBy: String
//  ): Future[TemplateDashboard]
//
//  def delete(orgId: Long, id: Long): Future[TemplateDashboard]
//
//  def createFromTemplate(request: CreateFromTemplateRequest): Future[Dashboard]
//
//  def applyConnectDataSource(orgId: Long, dashboardId: Long): Future[Boolean]
//
//}
//
//class TemplateDashboardServiceImpl @Inject() (
//    templateRepository: TemplateDashboardRepository,
//    dashboardService: DashboardService
//) extends TemplateDashboardService {
//  override def list(keyword: String, from: Int, size: Int): Future[PageResult[TemplateDashboardResponse]] = {
//    templateRepository
//      .listTemplateDashboards(keyword, from, size)
//      .map(pageResult => {
//        val templateResponse = pageResult.data.map(template => TemplateDashboardResponse.from(template))
//        PageResult(pageResult.total, templateResponse)
//      })
//  }
//
//  override def get(id: Long): Future[TemplateDashboard] = {
//    templateRepository.get(id).flatMap {
//      case Some(template) => Future.value(template)
//      case None           => Future.exception(new NotFoundError(s"Template with id: $id not found"))
//    }
//  }
//
//  override def create(
//      orgId: Long,
//      name: String,
//      description: String,
//      dashboard: Dashboard,
//      thumbnail: String,
//      setting: TemplateSetting,
//      creatorId: String
//  ): Future[TemplateDashboard] = {
//    val template = TemplateDashboard(
//      orgId = orgId,
//      id = 0, // dummy id
//      name = name,
//      description = description,
//      thumbnail = thumbnail,
//      dashboard = dashboard,
//      setting = setting,
//      createdBy = creatorId,
//      updatedBy = creatorId
//    )
//    templateRepository.create(template)
//  }
//
//  override def delete(orgId: Long, id: Long): Future[TemplateDashboard] = {
//    for {
//      template <- get(id)
//      _ <- templateRepository.delete(orgId, id)
//    } yield {
//      template
//    }
//  }
//
//  override def update(
//      id: Long,
//      name: Option[String],
//      description: Option[String],
//      dashboard: Option[Dashboard],
//      thumbnail: Option[String],
//      setting: Option[TemplateSetting],
//      updatedBy: String
//  ): Future[TemplateDashboard] = {
//    for {
//      oldTemplate <- get(id)
//      updatedTemplate = oldTemplate.copy(
//        name = name.getOrElse(oldTemplate.name),
//        description = description.getOrElse(oldTemplate.description),
//        dashboard = dashboard.getOrElse(oldTemplate.dashboard),
//        thumbnail = thumbnail.getOrElse(oldTemplate.thumbnail),
//        setting = setting.getOrElse(oldTemplate.setting),
//        updatedBy = updatedBy
//      )
//      _ <- templateRepository.update(updatedTemplate)
//    } yield {
//      updatedTemplate
//    }
//  }
//
//  override def createFromTemplate(request: CreateFromTemplateRequest): Future[Dashboard] = {
//    for {
//      template <- get(request.templateId)
//      newDashboard = template.dashboard.copyWithTemplateInfo(
//        TemplateInfo(
//          fromTemplateId = template.id,
//          isComplete = false,
//          setting = template.setting
//        )
//      )
//      createdDashboard <- dashboardService.create(
//        CreateDashboardRequest(
//          name = request.name,
//          parentDirectoryId = request.parentDirectoryId,
//          mainDateFilter = newDashboard.mainDateFilter,
//          widgets = newDashboard.widgets,
//          widgetPositions = newDashboard.widgetPositions.getOrElse(Map.empty),
//          setting = newDashboard.setting,
//          boostInfo = newDashboard.boostInfo,
//          request = request.request
//        )
//      )
//    } yield createdDashboard
//  }
//
//  override def applyConnectDataSource(orgId: Long, dashboardId: Long): Future[Boolean] = {
//    for {
//      dashboard <- dashboardService.get(orgId, dashboardId)
//      template: TemplateInfo =
//        dashboard.getTemplateInfo().getOrElseThrow(BadRequestError("Dashboard is not created from template"))
//      _ <- ensureSetupCompleted(template)
//      originToDestTblNameMap =
//        template.setting.requiredDatasourceList
//          .map(table => table.originDatabaseName -> table.setting.destDatabaseName.get)
//          .toMap
//      newDashboard = dashboard.copyWithReplacements(originToDestTblNameMap)
//      _ <- dashboardService.updateDashboard(orgId, dashboardId, newDashboard)
//    } yield true
//  }
//
//  private def ensureSetupCompleted(templateInfo: TemplateInfo): Future[Unit] =
//    Future {
//      val sources: Array[RequiredDataSourceInfo] = templateInfo.setting.getInConnectedSource()
//      if (sources.nonEmpty) {
//        throw BadRequestError(s"Template is not completed, missing sources: ${sources.map(_.`type`).mkString(", ")}")
//      }
//      templateInfo.setting.requiredDatasourceList.foreach(source => source.ensureSetupCompleted())
//    }
//
//}
