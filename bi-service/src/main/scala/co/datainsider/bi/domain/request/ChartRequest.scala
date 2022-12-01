package co.datainsider.bi.domain.request

import co.datainsider.bi.domain.CompareMode.CompareMode
import co.datainsider.bi.domain._
import co.datainsider.bi.domain.chart.ChartSetting
import co.datainsider.bi.domain.query.{
  And,
  CalculatedField,
  Condition,
  EqualField,
  ExpressionField,
  Field,
  FieldRelatedCondition,
  FieldRelatedFunction,
  NotEqualField,
  Or,
  QueryView,
  SqlView,
  TableField,
  TableView
}
import co.datainsider.bi.util.{Serializer, StringUtils}
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import com.twitter.finagle.http.Request
import com.twitter.finatra.validation.constraints.Min
import com.twitter.inject.Logging
import datainsider.client.domain.user.UserProfile
import datainsider.client.filter.LoggedInRequest

import javax.inject.Inject
import scala.collection.mutable.ArrayBuffer

case class ChartRequest(
    querySetting: ChartSetting,
    filterRequests: Array[FilterRequest] = Array.empty,
    compareRequest: Option[CompareRequest] = None,
    useBoost: Boolean = false,
    dashboardId: Option[Long] = None,
    chartId: Option[Long] = None,
    expressions: Map[String, String] = Map.empty,
    @Min(-1) from: Int = -1,
    @Min(-1) size: Int = -1,
    @Inject request: Request = null
) extends LoggedInRequest
    with PageRequest
    with Logging {

  /**
    * return fixed string contains the structure of query.
    * Queries with same structure always return same string to create key for caching layer
    * @return
    */
  override def toString: String = {
    s"""
       |{
       |  "query_setting": "${Serializer.toJson(querySetting.customCopy(options = Map.empty))}",
       |  "filter_requests": "${Serializer.toJson(filterRequests.sortBy(_.hashCode()))}",
       |  "compare_request": "${Serializer.toJson(compareRequest)}",
       |  "from": $from,
       |  "size": $size
       |}
       |""".stripMargin
  }

  def toResponseId: String = {
    debug(
      s"${this.getClass.getSimpleName}::toResponseId\n${this.toString}\n---responseId: ${StringUtils.md5(this.toString)}"
    )

    StringUtils.md5(this.toString)
  }
}

case class FilterRequest(
    condition: Condition,
    sqlView: Option[SqlView] = None,
    filterId: Option[Long] = None,
    isApplyRelatively: Boolean = true,
    isActive: Boolean = true
) {

  val tableView: Seq[TableView] = getTblViewsFromConditions(Seq(condition))

  // TODO: bad code here, duplicate with ObjectQuery.scala::getTblViewsFromConditions
  private def getTblViewsFromConditions(conditions: Seq[Condition]): Seq[TableView] = {
    val tableViews = ArrayBuffer.empty[TableView]

    conditions.foreach {
      case condition: FieldRelatedCondition => tableViews ++= getTableViewFromField(condition.field)
      case and: And                         => tableViews ++= getTblViewsFromConditions(and.conditions)
      case or: Or                           => tableViews ++= getTblViewsFromConditions(or.conditions)
      case eq: EqualField =>
        tableViews ++= getTableViewFromField(eq.leftField)
        tableViews ++= getTableViewFromField(eq.rightField)
      case neq: NotEqualField =>
        tableViews ++= getTableViewFromField(neq.leftField)
        tableViews ++= getTableViewFromField(neq.rightField)
      case _ =>
    }

    tableViews.distinct
  }

  private def getTableViewFromField(field: Field): Option[TableView] = {
    field match {
      case tblField: TableField       => Some(TableView(tblField.dbName, tblField.tblName))
      case exprField: ExpressionField => Some(TableView(exprField.dbName, exprField.tblName))
      case calcField: CalculatedField => Some(TableView(calcField.dbName, calcField.tblName))
      case _                          => None
    }
  }

  val queryView: QueryView = {
    (tableView ++ sqlView).head
  }
}

case class CompareRequest(
    firstCondition: Option[Condition] = None,
    secondCondition: Option[Condition] = None,
    @JsonScalaEnumeration(classOf[CompareModeType]) mode: CompareMode
)

case class ViewAsRequest(
    queryRequest: ChartRequest,
    userProfile: Option[UserProfile],
    @Inject request: Request = null
) extends LoggedInRequest
