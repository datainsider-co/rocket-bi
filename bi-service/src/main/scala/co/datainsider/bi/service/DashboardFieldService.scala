package co.datainsider.bi.service

import co.datainsider.bi.domain.Dashboard
import co.datainsider.bi.domain.Ids.DashboardId
import co.datainsider.bi.domain.chart._
import co.datainsider.bi.domain.query.{Field, FieldRelatedFunction, TableField}
import co.datainsider.bi.domain.request.ListDrillThroughDashboardRequest
import co.datainsider.bi.repository.{DashboardFieldRepository, DashboardRepository}
import co.datainsider.share.domain.response.PageResult
import com.twitter.util.Future

import javax.inject.Inject

/**
  * @author tvc12 - Thien Vi
  * @created 09/13/2021 - 8:43 PM
  */
trait DashboardFieldService {
  /**
   * scan all dashboard and create dashboard fields
   * @return boolean
   */
  def scanAndCreateDashboardFields(): Future[Boolean]

  def setFields(dashboard: Dashboard): Future[Unit]

  def getFields(id: DashboardId): Future[Seq[Field]]

  def delFields(id: DashboardId): Future[Boolean]

  def listDashboards(request: ListDrillThroughDashboardRequest): Future[PageResult[Dashboard]]
}

class DashboardFieldServiceImpl @Inject() (
    dashboardRepository: DashboardRepository,
    dashboardFieldRepository: DashboardFieldRepository
) extends DashboardFieldService {

  override def getFields(id: DashboardId): Future[Seq[Field]] = {
    dashboardFieldRepository.getFields(id)
  }

  override def listDashboards(request: ListDrillThroughDashboardRequest): Future[PageResult[Dashboard]] = {
    request.fields.nonEmpty match {
      case true => dashboardRepository.listDashboards(request)
      case _ => Future.value(PageResult(0, Seq.empty))
    }
  }

  override def setFields(dashboard: Dashboard): Future[Unit] = {
    val currentTableFields: Seq[Field] = dashboard.widgets.map(widgets => getFields(widgets)).getOrElse(Seq.empty)
    for {
      _ <- dashboardFieldRepository.deleteFields(dashboard.id)
      _ <- dashboardFieldRepository.setFields(dashboard.id, currentTableFields)
    } yield Unit
  }

  override def delFields(id: DashboardId): Future[Boolean] = {
    dashboardFieldRepository.deleteFields(id)
  }

  private def getFields(widgets: Seq[Widget]): Seq[Field] = {
    widgets.map(widget => getField(widget)).filterNot(_.isEmpty).map(_.get)
  }

  private def getField(widget: Widget): Option[Field] = {
    widget match {
      case chart: Chart =>
        chart.setting match {
          case tabFilter: TabFilterChartSetting           => toField(tabFilter.value)
          case dropdownFilter: DropdownFilterChartSetting => toField(dropdownFilter.value)
          case _                                          => None
        }
      case _ => None
    }
  }

  private def toField(tableColumn: TableColumn): Option[Field] = {
    tableColumn.function match {
      case relatedFn: FieldRelatedFunction if (relatedFn.field.isInstanceOf[TableField]) =>
        Some(relatedFn.field.asInstanceOf[TableField])
      case _ => None
    }
  }

  /**
   * scan all dashboard and create dashboard fields
   *
   * @return boolean
   */
  override def scanAndCreateDashboardFields(): Future[Boolean] = {
    dashboardRepository.scan(1000)(multiSetFields).map(_ => true)
  }

  def multiSetFields(dashboards: Seq[Dashboard]): Future[Unit] = {
    Future.collect(dashboards.map(dashboard => setFields(dashboard))).unit
  }
}
