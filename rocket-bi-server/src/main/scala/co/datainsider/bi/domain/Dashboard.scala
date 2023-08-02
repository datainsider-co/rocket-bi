package co.datainsider.bi.domain

import co.datainsider.bi.domain.Ids.{DashboardId, WidgetId}
import co.datainsider.bi.domain.MainDateFilterMode.MainDateFilterMode
import co.datainsider.bi.domain.chart.{Chart, FilterSetting, Widget}
import co.datainsider.bi.domain.query.{Field, QueryView}
import co.datainsider.bi.domain.request.{ChartRequest, FilterRequest}
import co.datainsider.bi.util.Serializer
import com.fasterxml.jackson.core.`type`.TypeReference
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import datainsider.client.util.JsonParser

/** *
  *
  * @param row    : dashboard row
  * @param column : dashboard column
  */
case class Position(row: Int, column: Int, width: Int, height: Int, zIndex: Int = 0)

case class Dashboard(
    orgId: Long,
    id: DashboardId = -1, // dummy id
    name: String,
    creatorId: String,
    ownerId: String,
    setting: Option[JsonNode] = None,
    mainDateFilter: Option[MainDateFilter] = None,
    widgets: Option[Array[Widget]] = Some(Array.empty),
    widgetPositions: Option[Map[WidgetId, Position]] = Some(Map.empty),
    boostInfo: Option[BoostInfo] = None,
    useAsTemplate: Boolean = false
) {
  private def getCharts: Array[Chart] = {
    widgets.get.filter(_.isInstanceOf[Chart]).map(_.asInstanceOf[Chart])
  }

  private def getFilterSettings: Array[FilterSetting] = {
    getCharts.map(_.setting).filter(_.isInstanceOf[FilterSetting]).map(_.asInstanceOf[FilterSetting])
  }

  def toChartRequests: Array[ChartRequest] = {
    val mainDateFilterRequest: Option[FilterRequest] = mainDateFilter.flatMap(_.filterRequest)
    val filterRequests = getFilterSettings.filter(_.filterRequest.isDefined).map(_.filterRequest.get)
    getCharts.map(_.toChartRequest(filterRequests ++ mainDateFilterRequest, Some(id)))
  }

  def getAllQueryViews: Seq[QueryView] = {
    getCharts.toSeq.map(_.setting.toQuery).flatMap(_.allQueryViews).distinct
  }

  def copyWithReplacements(dbNamesReplacements: Map[String, String]): Dashboard = {
    val originalDashboardJson: String = Serializer.toJson(this)
    val newDashboardJson: String =
      dbNamesReplacements.foldLeft(originalDashboardJson)((dashboardJson, dbNameReplacement) =>
        dashboardJson.replace(s""""db_name":"${dbNameReplacement._1}"""", s""""db_name":"${dbNameReplacement._2}"""")
      )

    JsonParser.fromJson[Dashboard](newDashboardJson)
  }
}

case class MainDateFilter(
    affectedField: Field,
    @JsonScalaEnumeration(classOf[MainDateFilterModeType]) mode: MainDateFilterMode,
    filterRequest: Option[FilterRequest] = None
)

object MainDateFilterMode extends Enumeration {
  type MainDateFilterMode = Value
  val ThisDay: MainDateFilterMode = Value("this_day")
  val ThisWeek: MainDateFilterMode = Value("this_week")
  val ThisMonth: MainDateFilterMode = Value("this_month")
  val ThisQuarter: MainDateFilterMode = Value("this_quarter")
  val ThisYear: MainDateFilterMode = Value("this_year")
  val LastDay: MainDateFilterMode = Value("last_day")
  val LastWeek: MainDateFilterMode = Value("last_week")
  val LastMonth: MainDateFilterMode = Value("last_month")
  val LastQuarter: MainDateFilterMode = Value("last_quarter")
  val LastYear: MainDateFilterMode = Value("last_year")
  val Last7Days: MainDateFilterMode = Value("last_7_days")
  val Last30Days: MainDateFilterMode = Value("last_30_days")
  val AllTime: MainDateFilterMode = Value("all_time")
}

class MainDateFilterModeType extends TypeReference[MainDateFilterMode.type]
