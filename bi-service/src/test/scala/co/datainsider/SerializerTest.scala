package co.datainsider

import co.datainsider.bi.domain.CompareMode.CompareMode
import co.datainsider.bi.domain.Ids.WidgetId
import co.datainsider.bi.domain._
import co.datainsider.bi.domain.chart._
import co.datainsider.bi.domain.query._
import co.datainsider.bi.domain.request._
import co.datainsider.bi.engine.TableExpressionUtils
import co.datainsider.bi.module.TestModule
import co.datainsider.bi.util.Implicits.ImplicitObject
import co.datainsider.bi.util.{PrettyNumberFormatter, QuarterNumFormatter, Serializer}
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.node.{ArrayNode, ObjectNode}
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, Logging}
import com.twitter.util.Await
import datainsider.authorization.domain.PermissionProviders
import datainsider.client.domain.scheduler.ScheduleMinutely
import datainsider.client.module.{MockCaasClientModule, MockSchemaClientModule}
import datainsider.client.util.JsonParser.mapper
import education.x.commons.SsdbKVS
import org.nutz.ssdb4j.spi.SSDB
import org.quartz.SimpleScheduleBuilder.simpleSchedule
import org.quartz.{
  DateBuilder,
  Job,
  JobBuilder,
  JobDetail,
  JobExecutionContext,
  JobKey,
  SimpleScheduleBuilder,
  Trigger,
  TriggerBuilder
}
import org.quartz.impl.StdSchedulerFactory
import org.quartz.impl.matchers.GroupMatcher
import org.scalatest.FunSuite

import java.sql.{Date, Timestamp}
import java.text.SimpleDateFormat
import java.util
import scala.collection.immutable.HashMap
import scala.collection.mutable
import scala.concurrent.{ExecutionContext, ExecutionContextExecutor}

/** *
  * https://twitter.github.io/finatra/user-guide/json/index.html
  */
class SerializerTest extends FunSuite with Logging {

  val inCondition: In = In(TableField("db_test", "tblUsers", "username", "string"), Set("user_1", "user_2", "user_3"))
  val betweenCondition: Between = Between(TableField("db_test", "tblUsers", "date", "String"), "min", "max")
  val likeCondition: Like = Like(TableField("db_test", "tblUsers", "input word", "String"), "Hello")
  val mainDateFilter = MainDateFilter(TableField("db_test", "tblUsers", "date", "date"), MainDateFilterMode.LastYear)
  val shortDashBoard: Dashboard = Dashboard(1, "short_dashboard", "user1", "owner1", null, Some(mainDateFilter))
  val equalCondition: Equal = Equal(TableField("db_test", "tblUsers", "equal", "String"), "Hello")

  val TableField1: TableField = TableField("dbTest", "tblProduct", "name", "string")
  val TableField2: TableField = TableField("dbTest", "tblOrder", "id", "bigint")
  val condition1: FieldRelatedCondition = NotNull(TableField1)
  val condition2: FieldRelatedCondition = Equal(TableField2, "1")

  val widgetPositions: Map[WidgetId, Position] = Map(
    1L -> Position(1, 1, 1, 2),
    2L -> Position(3, 4, 2, 3),
    3L -> Position(2, 2, 4, 5),
    4L -> Position(4, 3, 6, 7)
  )
  /*val fullDashboard: Dashboard = Dashboard(
    2,
    "full_dashboard",
    "user1",
    "owner1",
    Some(mainDateFilter),
    Some(Array[Widget](dateFilter, dropDownFilter)),
    Some(widgetPositions)
  )

  val dropdownFilter: DropDownFilter = DropDownFilter(
    2,
    "dropdown_filter",
    Array(DropDownValue("name1", "value1"), DropDownValue("name2", "value2"))
  )*/

  /*test("serialize/deserialize short dashboard") {
    debug(s"Dashboard:  $shortDashBoard")
    val dashboardAsJson: String = Serializer.toJson(shortDashBoard)
    debug(s"DashboardAsJson = $dashboardAsJson")
    val dashboard: Dashboard = Serializer.fromJson[Dashboard](dashboardAsJson)
    debug(s"Dashboard from json: $dashboard")
    assert(dashboard != null)
    debug(dashboardAsJson)
    debug(Serializer.toJson(dashboard))
    assert(dashboardAsJson.equalsIgnoreCase(Serializer.toJson(dashboard)))
  }*/

  test("map widget position") {
    val widgetPositionAsJson = Serializer.toJson(widgetPositions)
    debug(s"widgetPosition: $widgetPositions ")
    debug(s"widgetPositionAsJson: $widgetPositionAsJson ")

    val widgetPositionFromJson: Map[WidgetId, Position] =
      Serializer.fromJson[Map[WidgetId, Position]](widgetPositionAsJson)
    debug("widgetPosition from Json: " + widgetPositionFromJson)
    assert(widgetPositionFromJson.equals(widgetPositions))

    debug(widgetPositionAsJson)
    debug(Serializer.toJson(widgetPositionFromJson))
    assert(Serializer.toJson(widgetPositionFromJson).equalsIgnoreCase(widgetPositionAsJson))
  }

  /*test("array generic widget") {
    val arrWidget: Array[Widget] =
      Array[Widget](dateFilter, dropDownFilter)
    debug(s"Array widget: $arrWidget")
    val arrWidgetAsJson: String = Serializer.toJson(arrWidget)
    debug(s"Array widget to Json: $arrWidgetAsJson")
    val arrWidgetFromJson: Array[Widget] = Serializer.fromJson[Array[Widget]](arrWidgetAsJson)
    debug(s"Array widget from Json: $arrWidgetFromJson")
    assert(arrWidgetFromJson != null)
    assert(Serializer.toJson(arrWidgetFromJson).equalsIgnoreCase(arrWidgetAsJson))
  }

  test("full dashboard") {
    debug(s"full dashboard: $fullDashboard")
    val fullDashboardAsJson: String = Serializer.toJson(fullDashboard)
    debug(s"full dashboard to Json: $fullDashboardAsJson")
    println(s"full dashboard to Json: $fullDashboardAsJson")
    val fullDashboardFromJson: Dashboard = Serializer.fromJson[Dashboard](fullDashboardAsJson)
    debug(fullDashboardFromJson)
    println(fullDashboardFromJson)
    assert(fullDashboardFromJson != null)
    assert(fullDashboardAsJson.equalsIgnoreCase(Serializer.toJson(fullDashboardFromJson)))
  }

  test("array of dashboard") {
    val arrDashboard: Array[Dashboard] = Array[Dashboard](shortDashBoard, fullDashboard)
    val arrDashboardAsJson = Serializer.toJson(arrDashboard)
    debug("Array dashboard to Json: " + arrDashboardAsJson)
    val arrDashboardFromJson: Array[Dashboard] = Serializer.fromJson[Array[Dashboard]](arrDashboardAsJson)
    assert(arrDashboardFromJson != null)
    assert(arrDashboardAsJson.equalsIgnoreCase(Serializer.toJson(arrDashboardFromJson)))
  }*/

  test("scalar function") {
    val toYear = ToYear(Some(ToQuarter(Some(ToMonth()))))
    val jsonYear = Serializer.toJson(toYear)
    val toYearFromJson = Serializer.fromJson[ToYear](jsonYear)
    assert(toYear == toYearFromJson)
    val group = GroupBy(TableField("db", "tlb", "user", "string"), Some(toYear))
    val objQuery = ObjectQuery(
      Seq(group),
      Seq.empty
    )
    val json = Serializer.toJson(objQuery)
    val objectQueryFromJson = Serializer.fromJson[ObjectQuery](json)
    println(objectQueryFromJson)
    assert(objectQueryFromJson != null)
  }

  /*test("dashboard with main date filter") {
    val mainDateFilter: MainDateFilter =
      MainDateFilter(TableField("db_test", "tblUsers", "date_of_birth", "date"), Some(MainDateFilterMode.LastYear))
    val dashboard = Dashboard(
      1,
      "dashboard with main date filter",
      "user1",
      "owner1",
      null,
      Some(mainDateFilter)
    )
    val json = Serializer.toJson(dashboard)
    val dashboardFromJson = Serializer.fromJson[Dashboard](json)
    assert(Serializer.toJson(dashboard) == Serializer.toJson(dashboardFromJson))
  }*/

  test("object node") {
    val root: ObjectNode = mapper.createObjectNode()
    root.put("one", 1)
    val children: ObjectNode = mapper.createObjectNode()
    children.put("child", "child")
    root.set("chil dren", children)

    val children2: ObjectNode = mapper.createObjectNode()
    children2.put("child2", "child2")

    val children3: ObjectNode = mapper.createObjectNode()
    children3.put("child3", "child3")

    val arr: ArrayNode = mapper.createArrayNode()
    arr.add(children)
    arr.add(children)
    arr.add(children)

    root.set("arr", arr)
    println(root)

    val test = root.get("arr").asInstanceOf[ArrayNode]
    test.add(children2)

    val map = mutable.HashMap[String, ArrayNode]()
    map.put("test", test)
    map("test").add(children3)

    root.put("one", "test")

    println(root)
    //    val test = ObjectNode("one" -> 1, "two" -> 2)

    println("test add empty node:")
    val emptyArr: ArrayNode = mapper.createArrayNode()
    val emptyItem: ObjectNode = mapper.createObjectNode()
    println(emptyArr)
    if (emptyItem.size() > 0)
      emptyArr.add(emptyItem)
    println(emptyArr)

  }

  test("filter request") {
    val filters = Array[FilterRequest](
      FilterRequest(Equal(TableField("db", "tbl", "TableField", "string"), "Ha Noi"))
    )
    println(Serializer.toJson(filters))
  }

  test("mode") {
    val mode = CompareMode.ValuesDiff
    println(Serializer.toJson(mode))
  }

  test("test modify val array") {
    val arr = Array(1, 2, 3)
    arr(2) = 4
    assert(arr.sameElements(Array(1, 2, 4)))
  }

  test("compare object with null elements") {
    val groupByYear = GroupBy(null, Some(ToYear()))
    val groupByYear2 = GroupBy(null, Some(ToYear()))
    val groupByMonth = GroupBy(null, Some(ToMonth()))
    assert(groupByYear == groupByYear2)
    assert(groupByYear != groupByMonth)
  }

  test("serialize compare mode") {
    val mode = CompareMode.RawValues
    val json = Serializer.toJson(mode)
    val modesFromJson = Serializer.fromJson[CompareMode](json)
    assert(modesFromJson == mode)
  }

  /*test("serialize main date filter") {
    val mainDateFilter: MainDateFilter =
      MainDateFilter(TableField("db_test", "tblUsers", "date_of_birth", "date"), Some(MainDateFilterMode.LastYear))
    val mainDateFilterJson = Serializer.toJson(mainDateFilter)
    assert(
      mainDateFilterJson == "{\"affected_TableField\":{\"db_name\":\"db_test\",\"tbl_name\":\"tblUsers\",\"TableField_name\":\"date_of_birth\",\"TableField_type\":\"date\"},\"mode\":\"LastYear\"}"
    )
    val dashboard = Dashboard(1, "test", "hello", "owner1", null, Some(mainDateFilter))
    val json = Serializer.toJson(dashboard)
    val dashboardFromJson = Serializer.fromJson[Dashboard](json)
    assert(dashboard.mainDateFilter == dashboardFromJson.mainDateFilter)
  }*/

  test("find string contains of of the subString") {
    def isNumCol(colType: String): Boolean = {
      val patterns = Array("int", "float", "double")
      patterns.exists(pattern => colType.toLowerCase.contains(pattern))
    }
    assert(isNumCol("UInt32"))
    assert(isNumCol("uint64"))
    assert(isNumCol("FlOat32"))

    assert(!isNumCol("randomString"))
    assert(!isNumCol("string"))
    assert(!isNumCol("date"))
  }

  test("round big double") {
    val numberDouble: Double = 90000000000000.56789
    val value = numberDouble.asInstanceOf[Object]
    val rounded = BigDecimal(value.toString)
      .setScale(2, BigDecimal.RoundingMode.HALF_UP)
    assert(rounded.toString() == "90000000000000.56")
  }

  test("pretty num formatter") {
    assert(PrettyNumberFormatter.format(1.5.asInstanceOf[Object], 2).toString == "1.50")
    assert(PrettyNumberFormatter.format(12345.asInstanceOf[Object], 1).toString == "12345.0")
    assert(PrettyNumberFormatter.format(12345.000.asInstanceOf[Object]).toString == "12345")
    assert(PrettyNumberFormatter.format(12345.678.asInstanceOf[Object]).toString == "12346")
    assert(PrettyNumberFormatter.format(123456789.asInstanceOf[Object], 2).toString == "123.46M")
    assert(PrettyNumberFormatter.format(123456789.456.asInstanceOf[Object], 2).toString == "123.46M")
    assert(PrettyNumberFormatter.format(999123456789L.asInstanceOf[Object], 2).toString == "999.12B")
    assert(PrettyNumberFormatter.format(999123456789.456.asInstanceOf[Object], 2).toString == "999.12B")
    assert(PrettyNumberFormatter.format((-123.456).asInstanceOf[Object], 2).toString == "-123.46")
    assert(PrettyNumberFormatter.format((-123456789.0).asInstanceOf[Object], 2).toString == "-123.46M")
  }

  test("test date to timestamp") {
    val dateStr = "2020-12-31"
    val dateFormat = new SimpleDateFormat("yyyy-MM-dd")
    val date = dateFormat.parse(dateStr)
    val timestamp = new Timestamp(date.getTime)
    println(timestamp.getTime)
    val dateFromTimestamp = new Date(timestamp.getTime)
    assert(date == dateFromTimestamp)
    val dateStrFromTimestamp = dateFormat.format(dateFromTimestamp)
    println(dateStrFromTimestamp)
    assert(dateStr == dateStrFromTimestamp)
  }

  test("test datetime to timestamp") {
    val dateStr = "2020-12-31 00:00:00.999"
    val timestamp = Timestamp.valueOf(dateStr)
    println(timestamp.getTime)
    val dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS")
    val dateFromTimestamp = new Date(timestamp.getTime)
    val dateStrFromTimestamp = dateFormat.format(dateFromTimestamp)
    println(dateStrFromTimestamp)
    assert(dateStrFromTimestamp == dateStr)
  }

  test("widget with creator & owner") {
    val chart = Chart(
      1,
      "sale2021",
      "nothing",
      NumberChartSetting(TableColumn("profit", Sum(TableField("db", "tbl", "TableField", "type"))))
    ).withCreator("contributor").withOwner("admin")
    val json = Serializer.toJson(chart)
    val chartFromJson = Serializer.fromJson[Chart](json)
    val chartFromJsonJson = Serializer.toJson(chartFromJson)
    assert(json == chartFromJsonJson)
  }

  test("permissionprovider") {
    val test = PermissionProviders.dashboard.withDashboardId(123).all()
    println(test)
  }

  test("list request") {
    val request = ListDirectoriesRequest(Some(123))
    val json = Serializer.toJson(request)
    println(json)
    val instance = Serializer.fromJson[ListDirectoriesRequest](json)
    println(instance)
  }

  test("deformat") {
    val value = QuarterNumFormatter.format("9999")
    val test: Object = QuarterNumFormatter.deformat(value)
    println(test)
    assert(test.toString == "9999")
  }

  test("json pivot table setting") {
    val querySetting = PivotTableSetting(
      rows = Array(TableColumn("", GroupBy(TableField("org1_SalesRecords", "Sales", "country", "string")))),
      columns = Array(TableColumn("", GroupBy(TableField("org1_SalesRecords", "Sales", "item_type", "string")))),
      values = Array(TableColumn("", Sum(TableField("org1_SalesRecords", "Sales", "unit_cost", "double"))))
    )
    println(Serializer.toJson(querySetting))
  }

  test("serialize map(string, map(string, list))") {
    val TableFieldA: TableField = TableField("dbA", "tbl", "col", "type")
    val TableFieldB: TableField = TableField("dbB", "lbt", "lc", "type")
    val map: Map[String, Map[String, Seq[(TableField, TableField)]]] = Map(
      "A" -> Map("B" -> Seq((TableFieldA, TableFieldB), (TableFieldA, TableFieldB))),
      "B" -> Map("B" -> Seq((TableFieldB, TableFieldA)))
    )
    val json = Serializer.toJson(map)
    println(json)
    val mapFromJson = Serializer.fromJson[Map[String, Map[String, Seq[(TableField, TableField)]]]](json)
    println(mapFromJson)
  }

  test("serialize setting as json node") {
    val json = "{}"
    val setting: JsonNode = Serializer.fromJson[JsonNode](json)
    println(setting)
  }

  test("test serialize position without zindex") {
    val pos = Position(1, 2, 3, 4, 0)
    val json = "{\"row\":1,\"column\":2,\"width\":3,\"height\":4}"
    val posFromJson = Serializer.fromJson[Position](json)
    println(posFromJson)
    assert(pos == posFromJson)

  }

  test("serialize list directory") {
    val request = ListDirectoriesRequest(
      parentId = Some(1),
      directoryType = Some(DirectoryType.Dashboard)
    )
    val json = Serializer.toJson(request)
    println(json)

    val requestFromJson = Serializer.fromJson[ListDirectoriesRequest](json)
    println(requestFromJson)
  }

  test("serialize sankey chart setting") {
    val setting = SankeyChartSetting(
      source = TableColumn("region", GroupBy(TableField("db", "tbl", "region", "String"))),
      destination = TableColumn("item type", GroupBy(TableField("db", "tbl", "item_type", "String"))),
      weight = TableColumn("sum", Sum(TableField("db", "tbl", "total_profit", "int32")))
    )
    println(Serializer.toJson(setting))
  }

  test("serialize dashboard with table field") {
    val json =
      """[{"class_name":"chart_v3","id":36,"name":"copy to here","description":"","setting":{"class_name":"series_chart_setting","x_axis":{"name":"Country","function":{"class_name":"group","field":{"db_name":"org1_SalesRecords","tbl_name":"Sales","field_name":"country","field_type":"string"},"scalar_function":null},"is_horizontal_view":false,"is_calc_group_total":false},"y_axis":[{"name":"Total Profit","function":{"class_name":"sum","field":{"db_name":"org1_SalesRecords","tbl_name":"Sales","field_name":"total_profit","field_type":"double"},"scalar_function":null},"is_horizontal_view":false,"is_calc_group_total":false}],"legend":null,"filters":[],"sorts":[],"options":{"get_subtitle":{},"get_title":{},"chart_family_type":"series","stacking_group":{},"to_stacking_group":{},"options":{"subtitle":"","y_axis":[{"line_width":"0.5","grid_line_dash_style":"Solid","alternate_grid_color":"#00000000","opposite":false,"line_color":"#FFFFFF19","grid_line_color":"#FFFFFF19","allow_decimals":false,"title":{"text":"Total Profit"},"grid_line_width":"0.5"}],"plot_options":{"series":{"data_labels":{"enabled":false},"label":{"enabled":false}}},"background":"#333645","legend":{"enabled":true},"comparison_color":"rgb(158, 159, 163)","x_axis":{"title":{"text":"Country"},"labels":{"enabled":true}},"chart":{"type":"line"},"text_color":"#fff","title":"copy to here","series_types":["line"]},"class_name":"highcharts_series_chart_setting","to_series_types":{},"get_text_color":{},"to_series_options":{},"get_background_color":{},"series_types":{"0":"line"}},"series_types":null},"creator_id":"up-c7337faa-7ccb-45cf-aced-ea1864f09db2","owner_id":"up-c7337faa-7ccb-45cf-aced-ea1864f09db2","background_color":"#333645","text_color":"#fff","extra_data":{"configs":{"sorting":[],"x_axis":[{"name":"Country","table_name":"Sales","is_nested":false,"field":{"db_name":"org1_SalesRecords","tbl_name":"Sales","field_name":"country","field_type":"string"},"column_name":"Country","function_family":"Group By","display_as_column":false,"id":48479,"sorting":"Unsorted","function_type":""}],"y_axis":[{"name":"Total Profit","table_name":"Sales","is_nested":false,"field":{"db_name":"org1_SalesRecords","tbl_name":"Sales","field_name":"total_profit","field_type":"double"},"column_name":"Total Profit","function_family":"Aggregation","display_as_column":false,"id":6814,"sorting":"Unsorted","function_type":"Sum"}],"legend_optional":[]},"filters":{},"tab_items":[{"key":"general","name":"General","setting_items":[{"name":"Title","key":"title","options":[],"default_value":"Untitled Chart","inner_setting_items":[],"type":"InputConfigComponent","value":"copy to here","highchart_key":"title"},{"name":"Subtitle","key":"subtitle","options":[],"default_value":"","inner_setting_items":[],"type":"InputConfigComponent","value":"","highchart_key":"subtitle"},{"name":"Background Color","key":"background","options":[],"default_value":"#333645","inner_setting_items":[],"type":"ColorInputComponent","value":"#333645","highchart_key":"background"},{"name":"Text Color","key":"text_color","options":[],"default_value":"#fff","inner_setting_items":[],"type":"ColorInputComponent","value":"#fff","highchart_key":"textColor"},{"name":"Show legend","key":"enable_legend","options":[],"default_value":true,"inner_setting_items":[],"type":"ToggleSettingComponent","value":true,"highchart_key":"legend.enabled"}]},{"key":"axis","name":"Axis","setting_items":[{"name":"Horizontal Title","key":"horizontal_title","options":[],"default_value":"","inner_setting_items":[],"type":"InputConfigComponent","value":"Country","highchart_key":"xAxis.title.text"},{"name":"Show labels","key":"enable_legend","options":[],"default_value":true,"inner_setting_items":[],"type":"ToggleSettingComponent","value":true,"highchart_key":"xAxis.labels.enabled"},{"name":"Vertical Title","key":"vertical_title","options":[],"default_value":"","inner_setting_items":[],"type":"InputConfigComponent","value":"Total Profit","highchart_key":"yAxis[0].title.text"},{"name":"Allow decimals","key":"allow_decimal","options":[],"default_value":false,"inner_setting_items":[],"type":"ToggleSettingComponent","value":false,"highchart_key":"yAxis[0].allowDecimals"},{"name":"Vertical Opposite","key":"allow_decimal","options":[],"default_value":false,"inner_setting_items":[],"type":"ToggleSettingComponent","value":false,"highchart_key":"yAxis[0].opposite"}]},{"key":"series","name":"Series","setting_items":[{"name":"Show labels","key":"show_labels","options":[],"default_value":false,"inner_setting_items":[],"type":"ToggleSettingComponent","value":false,"highchart_key":"plotOptions.series.dataLabels.enabled"},{"name":"Show Legend Name","key":"show_labels","options":[],"default_value":false,"inner_setting_items":[],"type":"ToggleSettingComponent","value":false,"highchart_key":"plotOptions.series.label.enabled"},{"name":"Comparison Color","key":"comparison_color","options":[],"default_value":"rgb(158, 159, 163)","inner_setting_items":[],"type":"ColorInputComponent","value":"rgb(158, 159, 163)","highchart_key":"comparisonColor"},{"name":"Display \"Total Profit\" as","key":"legend_0","options":[{"display_name":"Line","id":"line"},{"display_name":"Column","id":"column"},{"display_name":"Bar","id":"bar"},{"display_name":"Area","id":"area"}],"default_value":"line","type":"SelectConfigComponent","value":"line","highchart_key":"seriesTypes.0"}]},{"key":"gridlines_ticks","name":"Gridlines & Ticks","setting_items":[{"name":"Alternate Grid Color","key":"alternate_grid_color","options":[],"default_value":"#00000000","inner_setting_items":[],"type":"ColorInputComponent","value":"#00000000","highchart_key":"yAxis[0].alternateGridColor"},{"type":"none","options":[],"inner_setting_items":[]},{"name":"Line Color","key":"line_color","options":[],"default_value":"#FFFFFF19","inner_setting_items":[],"type":"ColorInputComponent","value":"#FFFFFF19","highchart_key":"yAxis[0].lineColor"},{"name":"Line With","key":"line_width","options":[],"default_value":"0.5","inner_setting_items":[],"type":"InputConfigComponent","value":"0.5","highchart_key":"yAxis[0].lineWidth"},{"name":"Grid Line Color","key":"grid_line_color","options":[],"default_value":"#FFFFFF19","inner_setting_items":[],"type":"ColorInputComponent","value":"#FFFFFF19","highchart_key":"yAxis[0].gridLineColor"},{"name":"Grid Line With","key":"grid_line_width","options":[],"default_value":"0.5","inner_setting_items":[],"type":"InputConfigComponent","value":"0.5","highchart_key":"yAxis[0].gridLineWidth"},{"name":"Grid Line Dash","key":"grid_line_style","options":[{"display_name":"Solid","id":"Solid"},{"display_name":"ShortDash","id":"ShortDash"},{"display_name":"ShortDot","id":"ShortDot"},{"display_name":"ShortDashDot","id":"ShortDashDot"},{"display_name":"ShortDashDotDot","id":"ShortDashDotDot"},{"display_name":"Dot","id":"Dot"},{"display_name":"Dash","id":"Dash"},{"display_name":"LongDash","id":"LongDash"}],"default_value":"Solid","inner_setting_items":[],"type":"SelectConfigComponent","value":"Solid","highchart_key":"yAxis[0].gridLineDashStyle"}]}],"current_chart_type":"line"}}]"""

    val updatedJson = json.replaceAll(""""field_type"""", """"class_name":"table_field","field_type"""")

    val widgets = Serializer.fromJson[Array[Widget]](updatedJson)
    widgets.foreach(println)

  }

  test("FlattenPivotTableSetting to JSON") {
    val query: ChartSetting = new FlattenPivotTableSetting(
      columns = Array(
        TableColumn("name", GroupBy(TableField("test", "123", "name", "String")))
      ),
      rows = Array(
        TableColumn("id", GroupBy(TableField("order_id", "123", "id", "UInt32")))
      ),
      values = Array(
        TableColumn("id", Sum(TableField("total_id", "123", "id", "UInt32")))
      ),
      sorts = Array(
        OrderBy(function = GroupBy(TableField("order_id", "123", "id", "UInt32")), order = Order.DESC)
      )
    )

    val queryAsString = Serializer.toJson(query)
  }

  test("JSON to FlattenPivotTableSetting") {
    val json =
      """{"class_name":"flatten_pivot_table_chart_setting","rows":[{"name":"id","function":{"class_name":"group","field":{"class_name":"table_field","db_name":"order_id","tbl_name":"123","field_name":"id","field_type":"UInt32"},"scalar_function":null},"is_horizontal_view":false,"is_calc_group_total":false,"is_calc_min_max":false,"formatter_key":null}],"columns":[{"name":"name","function":{"class_name":"group","field":{"class_name":"table_field","db_name":"test","tbl_name":"123","field_name":"name","field_type":"String"},"scalar_function":null},"is_horizontal_view":false,"is_calc_group_total":false,"is_calc_min_max":false,"formatter_key":null}],"values":[{"name":"id","function":{"class_name":"sum","field":{"class_name":"table_field","db_name":"total_id","tbl_name":"123","field_name":"id","field_type":"UInt32"},"scalar_function":null},"is_horizontal_view":false,"is_calc_group_total":false,"is_calc_min_max":false,"formatter_key":null}],"formatters":[],"filters":[],"sorts":[{"class_name":"order_by","function":{"class_name":"group","field":{"class_name":"table_field","db_name":"order_id","tbl_name":"123","field_name":"id","field_type":"UInt32"},"scalar_function":null},"order":"DESC","num_elems_shown":null}],"aggregate_conditions":[],"views":[],"join_conditions":[],"options":{}}"""
    val querySetting = Serializer.fromJson[ChartSetting](json)

    assert(querySetting.isInstanceOf[FlattenPivotTableSetting])
    val pivotSetting = querySetting.asInstanceOf[FlattenPivotTableSetting]
    assertResult(pivotSetting.columns)(Array(TableColumn("name", GroupBy(TableField("test", "123", "name", "String")))))
    assertResult(pivotSetting.rows)(Array(TableColumn("id", GroupBy(TableField("order_id", "123", "id", "UInt32")))))
    assertResult(pivotSetting.values)(Array(TableColumn("id", Sum(TableField("total_id", "123", "id", "UInt32")))))
    assertResult(pivotSetting.sorts)(
      Array(OrderBy(function = GroupBy(TableField("order_id", "123", "id", "UInt32")), order = Order.DESC))
    )
  }

  test("test serializer") {
    val value = true
    val json = Serializer.toJson(value)
    println(json)
  }

  test("test regex") {
    val dbName = "db_name"
    val tblName = "tbl_name"
    val fromClauseRegex = raw"""(?i)[^\w\d]+(from\s+`?${dbName}`?\.`?${tblName}`?\b)""".r

    val sqls = Seq(
      s"select *from $dbName.$tblName",
      s"select * from(select count(*)from $dbName.$tblName)",
      s"select * FROM $dbName.$tblName",
      s"select * frOm `$dbName.$tblName` where 1= 1 ",
      s"select *     from `$dbName`.`$tblName`\t    where 1= 1 ",
      s"""
         |select * 
         |from $dbName.$tblName""".stripMargin,
      s"""
         |select *
         |from `$dbName`.$tblName
         |""".stripMargin,
      s"""
         |select * 
         |
         |
         |FroM $dbName.`$tblName`
         |
         |
         |
         |where id = 1213
         |""".stripMargin,
      s"""
         |select * 
         |
         |
         |from other_db.`$tblName`
         |
         |
         |
         |where id = 1213
         |""".stripMargin
    )

    sqls.foreach(sql => {
      fromClauseRegex.findFirstMatchIn(sql) match {
        case Some(value) => println(value.group(1))
        case None        => println("not found")
      }
    })

  }

  test("test widget with dynamic function column") {
    val chart = Chart(
      1,
      "sale2021",
      "data sale",
      NumberChartSetting(
        TableColumn(
          "profit",
          Sum(TableField("db", "tbl", "profit", "double")),
          dynamicFunctionId = Some(1)
        )
      )
    )

    val json = Serializer.toJson(chart)
    assert(json.contains("dynamic_function_id"))
    assert(json.contains("is_dynamic_function"))

    val chartFromJson = Serializer.fromJson[Chart](json)
    val chartFromJsonJson = Serializer.toJson(chartFromJson)
    assert(json == chartFromJsonJson)
  }

  test("test serialize dashboard with all_query_views field") {
    val newDashboard = Dashboard(
      id = 0,
      name = s"mock dashboard",
      creatorId = "root",
      ownerId = "root",
      setting = None,
      mainDateFilter = None,
      widgets = Some(
        Array(
          Chart(
            id = 1,
            name = "chart",
            description = "",
            setting = SeriesChartSetting(
              xAxis = TableColumn("Country", GroupBy(field = TableField("db_name", "table_name", "Country", "String"))),
              yAxis = Array(
                TableColumn("UnitCost", Count(field = TableField("db_name", "table_name", "UnitCost", "UInt32")))
              ),
              legend = None,
              breakdown = None
            )
          )
        )
      )
    )

    assert(Serializer.toJson(newDashboard).contains("all_query_views"))
  }

  test("test copy with replacements") {
    val originalDashboard = Dashboard(
      id = 0,
      name = s"mock dashboard",
      creatorId = "root",
      ownerId = "root",
      setting = None,
      mainDateFilter = None,
      widgets = Some(
        Array(
          Chart(
            id = 1,
            name = "chart",
            description = "",
            setting = SeriesChartSetting(
              xAxis = TableColumn("Country", GroupBy(field = TableField("sales", "orders", "Country", "String"))),
              yAxis = Array(
                TableColumn("UnitCost", Count(field = TableField("sales", "orders", "UnitCost", "UInt32")))
              ),
              legend = None,
              breakdown = None
            )
          )
        )
      )
    )

    val newDashboard = originalDashboard.copyWithReplacements(Map("sales" -> "org2_sales"))

    val newDashboardJson = Serializer.toJson(newDashboard)
    assert(newDashboardJson.contains(""""db_name":"org2_sales""""))
    assert(!newDashboardJson.contains(""""db_name":"sales""""))

  }

}
