package co.datainsider.bi.service

import co.datainsider.bi.domain.Dashboard
import co.datainsider.bi.domain.Ids.DashboardId
import co.datainsider.bi.domain.chart._
import co.datainsider.bi.domain.query.Field
import co.datainsider.bi.domain.request.ListDrillThroughDashboardRequest
import co.datainsider.bi.repository.{DashboardRepository, DrillThroughFieldRepository}
import co.datainsider.share.domain.response.PageResult
import com.twitter.util.Future

import javax.inject.Inject

/**
  * @author tvc12 - Thien Vi
  * @created 09/13/2021 - 8:43 PM
  */
trait DrillThroughService {

  /**
    * scan all dashboard and create dashboard fields
    * @return boolean
    */
  def scanAndUpdateDrillThroughFields(): Future[Boolean]

  /**
    * scan all drill through of this dashboard and create dashboard fields
    */
  def updateDrillThroughFields(dashboard: Dashboard): Future[Unit]

  def getDrillThroughFields(id: DashboardId): Future[Seq[Field]]

  def deleteDrillThroughFields(id: DashboardId): Future[Boolean]

  /**
    * list all dashboard support drill through from drill through field
    */
  def listDashboards(request: ListDrillThroughDashboardRequest): Future[PageResult[Dashboard]]
}

class DashboardFieldServiceImpl @Inject() (
    dashboardRepository: DashboardRepository,
    drillThroughFieldRepository: DrillThroughFieldRepository
) extends DrillThroughService {

  override def getDrillThroughFields(id: DashboardId): Future[Seq[Field]] = {
    drillThroughFieldRepository.getFields(id)
  }

  override def listDashboards(request: ListDrillThroughDashboardRequest): Future[PageResult[Dashboard]] = {
    val orgId = request.currentOrganizationId.get
    if (request.fields.nonEmpty) {
      dashboardRepository.listDashboards(orgId, request)
    } else {
      Future.value(PageResult(0, Seq.empty))
    }
  }

  override def updateDrillThroughFields(dashboard: Dashboard): Future[Unit] = {
    val drillThroughFields: Seq[Field] =
      dashboard.widgets.map(widgets => getDrillThroughFields(widgets)).getOrElse(Seq.empty)
    for {
      _ <- drillThroughFieldRepository.deleteFields(dashboard.id)
      _ <- drillThroughFieldRepository.setFields(dashboard.id, drillThroughFields)
    } yield Unit
  }

  override def deleteDrillThroughFields(id: DashboardId): Future[Boolean] = {
    drillThroughFieldRepository.deleteFields(id)
  }

  private def getDrillThroughFields(widgets: Seq[Widget]): Seq[Field] = {
    val drillThroughFields: Seq[Field] = widgets.flatMap(widget => {
      widget match {
        case chart: Chart => {
          chart.setting match {
            case drillThroughSetting: DrillThroughSetting =>
              val drillThroughFields: Seq[Field] = drillThroughSetting.getDrillThroughFields()
              drillThroughFields
            case _ => Seq.empty
          }
        }
        case _ => Seq.empty
      }
    })
    drillThroughFields
  }

  override def scanAndUpdateDrillThroughFields(): Future[Boolean] = {
    dashboardRepository.scan(1000)(multiUpdateDrillThroughFields).map(_ => true)
  }

  private def multiUpdateDrillThroughFields(dashboards: Seq[Dashboard]): Future[Unit] = {
    Future.collect(dashboards.map(dashboard => updateDrillThroughFields(dashboard))).unit
  }
}
