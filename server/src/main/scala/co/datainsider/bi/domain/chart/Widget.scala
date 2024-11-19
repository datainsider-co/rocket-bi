package co.datainsider.bi.domain.chart

import co.datainsider.bi.domain.Ids.{UserId, WidgetId}
import co.datainsider.bi.domain.request.{ChartRequest, CompareRequest, FilterRequest}
import com.fasterxml.jackson.annotation.JsonSubTypes.Type
import com.fasterxml.jackson.annotation.{JsonSubTypes, JsonTypeInfo}

import scala.collection.mutable.ArrayBuffer

/**
  * One directory have multiple widget.
  * A widget could be a filter, a chart (pie chart, line chart etc), a image or a html webpage.
  * We use per-class annotation to work with Jackson/ScalaObjectMapper please check more at https://www.baeldung.com/jackson-inheritance
  * We don't use enableDefaultTyping() because there is a bugs when deserialize Map using enabelDefaultTyping().
  */

@JsonTypeInfo(
  use = JsonTypeInfo.Id.NAME,
  include = JsonTypeInfo.As.PROPERTY,
  property = "class_name"
)
@JsonSubTypes(
  Array(
    new Type(value = classOf[ImageWidget], name = "image_widget"),
    new Type(value = classOf[TextWidget], name = "text_widget"),
    new Type(value = classOf[LinkWidget], name = "link_widget"),
    new Type(value = classOf[Chart], name = "chart_v3"),
    new Type(value = classOf[TabWidget], name = "tab_widget"),
    new Type(value = classOf[DynamicFunctionWidget], name = "dynamic_function_widget"),
    new Type(value = classOf[DynamicConditionWidget], name = "dynamic_condition_widget")
  )
)
abstract class Widget {
  val id: WidgetId
  val name: String
  val creatorId: UserId
  val ownerId: UserId
  val extraData: Map[String, Any]

  def isEqualId(thatId: WidgetId): Boolean = this.id.equals(thatId)

  def withId(id: WidgetId): Widget

  def withCreator(creatorId: UserId): Widget

  def withOwner(ownerId: UserId): Widget

  def copyInfo(that: Widget): Widget
}

/** Other widget */
case class ImageWidget(
    id: WidgetId,
    name: String,
    url: String,
    creatorId: UserId = null,
    ownerId: UserId = null,
    extraData: Map[String, Any] = Map.empty
) extends Widget {
  override def withId(id: WidgetId): Widget = this.copy(id = id)

  override def withCreator(creatorId: UserId): Widget = this.copy(creatorId = creatorId)

  override def withOwner(ownerId: UserId): Widget = this.copy(ownerId = ownerId)

  override def copyInfo(that: Widget): Widget =
    this.copy(id = that.id, creatorId = that.creatorId, ownerId = that.ownerId)
}

// TODO: put all UI attributes in a single field
case class TextWidget(
    id: WidgetId,
    name: String,
    content: String,
    @deprecated fontSize: String = "",
    @deprecated textColor: String = "",
    @deprecated backgroundColor: String = "",
    @deprecated isHtmlRender: Boolean,
    creatorId: UserId = null,
    ownerId: UserId = null,
    extraData: Map[String, Any] = Map.empty
) extends Widget {
  override def withId(id: WidgetId): Widget = this.copy(id = id)

  override def withCreator(creatorId: UserId): Widget = this.copy(creatorId = creatorId)

  override def withOwner(ownerId: UserId): Widget = this.copy(ownerId = ownerId)

  override def copyInfo(that: Widget): Widget =
    this.copy(id = that.id, creatorId = that.creatorId, ownerId = that.ownerId)
}

@deprecated("unused widget")
case class LinkWidget(
    id: WidgetId,
    name: String,
    url: String,
    displayText: String,
    fontSize: Int,
    textColor: String = "",
    backgroundColor: String = "",
    creatorId: UserId = null,
    ownerId: UserId = null,
    extraData: Map[String, Any] = Map.empty
) extends Widget {
  override def withId(id: WidgetId): Widget = this.copy(id = id)

  override def withCreator(creatorId: UserId): Widget = this.copy(creatorId = creatorId)

  override def withOwner(ownerId: UserId): Widget = this.copy(ownerId = ownerId)

  override def copyInfo(that: Widget): Widget =
    this.copy(id = that.id, creatorId = that.creatorId, ownerId = that.ownerId)
}

case class Chart(
    id: WidgetId,
    name: String,
    description: String,
    setting: ChartSetting,
    creatorId: UserId = null,
    ownerId: UserId = null,
    chartFilter: Option[Chart] = None,
    backgroundColor: Option[String] = None,
    textColor: Option[String] = None,
    extraData: Map[String, Any] = Map.empty,
    comparisonInfo: Map[String, Any] = Map.empty
) extends Widget {
  override def withId(id: WidgetId): Widget = this.copy(id = id)

  override def withCreator(creatorId: UserId): Widget = this.copy(creatorId = creatorId)

  override def withOwner(ownerId: UserId): Widget = this.copy(ownerId = ownerId)

  override def copyInfo(that: Widget): Widget =
    this.copy(id = that.id, creatorId = that.creatorId, ownerId = that.ownerId)

  def toChartRequest(filterRequests: Array[FilterRequest], dashboardId: Option[Long]): ChartRequest = {
    // this function has to match with build logic from front end for boost to pre query dashboard

    val querySetting: ChartSetting = setting.customCopy(options = Map.empty)
    val finalFilterRequests = ArrayBuffer[FilterRequest]()
    val finalCompareRequests = ArrayBuffer[CompareRequest]()

    if (!setting.isInstanceOf[FilterSetting]) {
      finalFilterRequests ++= filterRequests
    } else if (setting.isInstanceOf[NumberChartSetting]) {
      finalFilterRequests ++= setting.asInstanceOf[NumberChartSetting].filterRequest
    }

    if (setting.isInstanceOf[NumberChartSetting]) {
      finalCompareRequests ++= setting.asInstanceOf[NumberChartSetting].compareRequest
    } else {
      None
    }

    val (from, size) =
      if (setting.isInstanceOf[GroupTableChartSetting]) {
        (0, 20)
      } else {
        (-1, -1)
      }

    ChartRequest(
      querySetting = querySetting,
      filterRequests = finalFilterRequests.toArray,
      compareRequest = finalCompareRequests.headOption,
      from = from,
      size = size,
      chartId = Some(id),
      dashboardId = dashboardId
    )

  }
}

case class TabWidget(
    id: WidgetId,
    name: String,
    description: String,
    tabItems: Seq[TabItem],
    creatorId: UserId = null,
    ownerId: UserId = null,
    extraData: Map[String, Any] = Map.empty
) extends Widget {
  override def withId(id: WidgetId): Widget = this.copy(id = id)

  override def withCreator(creatorId: UserId): Widget = this.copy(creatorId = creatorId)

  override def withOwner(ownerId: UserId): Widget = this.copy(ownerId = ownerId)

  override def copyInfo(that: Widget): Widget =
    this.copy(id = that.id, creatorId = that.creatorId, ownerId = that.ownerId)
}

case class TabItem(name: String, widgetIds: Seq[Long], options: Map[String, Any])

case class DynamicFunctionWidget(
    id: WidgetId,
    name: String,
    values: Seq[TableColumn],
    selectedIndex: Int,
    options: Map[String, Any] = Map.empty,
    creatorId: UserId = null,
    ownerId: UserId = null,
    extraData: Map[String, Any] = Map.empty
) extends Widget {

  override def withId(id: WidgetId): Widget = this.copy(id = id)

  override def withCreator(creatorId: UserId): Widget = this.copy(creatorId = creatorId)

  override def withOwner(ownerId: UserId): Widget = this.copy(ownerId = ownerId)

  override def copyInfo(that: Widget): Widget =
    this.copy(id = that.id, creatorId = that.creatorId, ownerId = that.ownerId)

}

case class DynamicConditionWidget(
    id: WidgetId,
    name: String,
    values: Seq[String],
    options: Map[String, Any] = Map.empty,
    creatorId: UserId = null,
    ownerId: UserId = null,
    extraData: Map[String, Any] = Map.empty
) extends Widget {

  override def withId(id: WidgetId): Widget = this.copy(id = id)

  override def withCreator(creatorId: UserId): Widget = this.copy(creatorId = creatorId)

  override def withOwner(ownerId: UserId): Widget = this.copy(ownerId = ownerId)

  override def copyInfo(that: Widget): Widget =
    this.copy(id = that.id, creatorId = that.creatorId, ownerId = that.ownerId)

}
