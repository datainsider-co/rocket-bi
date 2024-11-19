package co.datainsider.bi.domain.chart

import co.datainsider.bi.domain.query.{
  AggregateCondition,
  Condition,
  Field,
  FieldRelatedFunction,
  Function,
  JoinCondition,
  ObjectQueryBuilder,
  Or,
  OrderBy,
  Query,
  SqlQuery,
  SqlView
}
import co.datainsider.bi.domain.request.{CompareRequest, FilterRequest}
import co.datainsider.bi.domain.{GeoArea, Order}
import com.fasterxml.jackson.annotation.JsonSubTypes.Type
import com.fasterxml.jackson.annotation.{JsonSubTypes, JsonTypeInfo}

@JsonTypeInfo(
  use = JsonTypeInfo.Id.NAME,
  include = JsonTypeInfo.As.PROPERTY,
  property = "class_name"
)
@JsonSubTypes(
  Array(
    new Type(value = classOf[PieChartSetting], name = "pie_chart_setting"),
    new Type(value = classOf[FunnelChartSetting], name = "funnel_chart_setting"),
    new Type(value = classOf[PyramidChartSetting], name = "pyramid_chart_setting"),
    new Type(value = classOf[SeriesChartSetting], name = "series_chart_setting"),
    new Type(value = classOf[ScatterChartSetting], name = "scatter_chart_setting"),
    new Type(value = classOf[BubbleChartSetting], name = "bubble_chart_setting"),
    new Type(value = classOf[HeatMapChartSetting], name = "heat_map_chart_setting"),
    new Type(value = classOf[TableChartSetting], name = "table_chart_setting"),
    new Type(value = classOf[GroupTableChartSetting], name = "group_table_chart_setting"),
    new Type(value = classOf[NumberChartSetting], name = "number_chart_setting"),
    new Type(value = classOf[GaugeChartSetting], name = "gauge_chart_setting"),
    new Type(value = classOf[DrilldownChartSetting], name = "drilldown_chart_setting"),
    new Type(value = classOf[TreeMapChartSetting], name = "tree_map_chart_setting"),
    new Type(value = classOf[WordCloudChartSetting], name = "word_cloud_chart_setting"),
    new Type(value = classOf[HistogramChartSetting], name = "histogram_chart_setting"),
    new Type(value = classOf[DropdownFilterChartSetting], name = "dropdown_filter_chart_setting"),
    new Type(value = classOf[TabFilterChartSetting], name = "tab_filter_chart_setting"),
    new Type(value = classOf[TabControlChartSetting], name = "tab_control_chart_setting"),
    new Type(value = classOf[InputControlChartSetting], name = "input_control_chart_setting"),
    new Type(value = classOf[PivotTableSetting], name = "pivot_table_chart_setting"),
    new Type(value = classOf[FlattenPivotTableSetting], name = "flatten_pivot_table_chart_setting"),
    new Type(value = classOf[MapChartSetting], name = "map_chart_setting"),
    new Type(value = classOf[RawQuerySetting], name = "raw_query_setting"),
    new Type(value = classOf[ParliamentChartSetting], name = "parliament_chart_setting"),
    new Type(value = classOf[SpiderWebChartSetting], name = "spider_web_chart_setting"),
    new Type(value = classOf[BellCurveChartSetting], name = "bell_curve_chart_setting"),
    new Type(value = classOf[SankeyChartSetting], name = "sankey_chart_setting"),
    new Type(value = classOf[DonutChartSetting], name = "donut_chart_setting"),
    new Type(value = classOf[BulletChartSetting], name = "bullet_chart_setting"),
    new Type(value = classOf[GenericChartSetting], name = "generic_chart_setting")
  )
)
abstract class ChartSetting {
  val filters: Array[Condition]
  val sorts: Array[OrderBy]
  val sqlViews: Array[SqlView]
  val options: Map[String, Any]

  def toTableColumns: Array[TableColumn]
  def toQuery: Query
  def customCopy(options: Map[String, Any]): ChartSetting

  def getDynamicFunctionIds: Seq[Long] = {
    toTableColumns.filter(_.dynamicFunctionId.isDefined).map(_.dynamicFunctionId.get)
  }
}

trait FilterSetting {
  val filterRequest: Option[FilterRequest]
}

case class PieChartSetting(
    legend: TableColumn,
    value: TableColumn,
    filters: Array[Condition] = Array.empty,
    sorts: Array[OrderBy] = Array.empty,
    sqlViews: Array[SqlView] = Array.empty,
    options: Map[String, Any] = Map.empty
) extends ChartSetting {
  override def toTableColumns: Array[TableColumn] = Array(legend, value)

  override def toQuery: Query = {
    val builder = new ObjectQueryBuilder
    builder.addFunction(legend.function)
    builder.addFunction(value.function)
    builder.addCondition(Or(filters))
    builder.addOrders(sorts)
    builder.addViews(sqlViews)
    builder.build()
  }

  override def customCopy(options: Map[String, Any]): PieChartSetting = this.copy(options = options)
}

case class FunnelChartSetting(
    legend: TableColumn,
    value: TableColumn,
    filters: Array[Condition] = Array.empty,
    sorts: Array[OrderBy] = Array.empty,
    sqlViews: Array[SqlView] = Array.empty,
    options: Map[String, Any] = Map.empty
) extends ChartSetting {
  override def toTableColumns: Array[TableColumn] = Array(legend, value)

  override def toQuery: Query = {
    val builder = new ObjectQueryBuilder
    builder.addFunction(legend.function)
    builder.addFunction(value.function)
    builder.addCondition(Or(filters))
    builder.addViews(sqlViews)
    if (sorts.length == 0) builder.addOrder(OrderBy(value.function, Order.DESC))
    else builder.addOrders(sorts)
    builder.build()
  }

  override def customCopy(options: Map[String, Any]): FunnelChartSetting = this.copy(options = options)
}

case class PyramidChartSetting(
    legend: TableColumn,
    value: TableColumn,
    filters: Array[Condition] = Array.empty,
    sorts: Array[OrderBy] = Array.empty,
    sqlViews: Array[SqlView] = Array.empty,
    options: Map[String, Any] = Map.empty
) extends ChartSetting {
  override def toTableColumns: Array[TableColumn] = Array(legend, value)

  override def toQuery: Query = {
    val builder = new ObjectQueryBuilder
    builder.addFunction(legend.function)
    builder.addFunction(value.function)
    builder.addCondition(Or(filters))
    builder.addViews(sqlViews)
    if (sorts.length == 0) builder.addOrder(OrderBy(value.function, Order.DESC))
    else builder.addOrders(sorts)
    builder.build()
  }

  override def customCopy(options: Map[String, Any]): PyramidChartSetting = this.copy(options = options)
}

case class SeriesChartSetting(
    xAxis: TableColumn,
    yAxis: Array[TableColumn],
    legend: Option[TableColumn] = None,
    breakdown: Option[TableColumn] = None,
    filters: Array[Condition] = Array.empty,
    sorts: Array[OrderBy] = Array.empty,
    sqlViews: Array[SqlView] = Array.empty,
    options: Map[String, Any] = Map.empty,
    seriesTypes: Option[Map[Int, String]] = None
) extends ChartSetting {
  override def toTableColumns: Array[TableColumn] = {
    legend match {
      case Some(l) => Array(xAxis.copy(isCalcGroupTotal = false), l.copy(isHorizontalView = true)) ++ breakdown ++ yAxis
      case None =>
        breakdown match {
          case Some(b) => Array(xAxis.copy(isCalcGroupTotal = false), b.copy(isHorizontalView = true)) ++ yAxis
          case None    => Array(xAxis) ++ yAxis
        }
    }
  }

  override def toQuery: Query = {
    val builder = new ObjectQueryBuilder
    builder.addFunction(xAxis.function)
    legend match {
      case Some(x) =>
        builder.addFunction(x.function)
        builder.addFunctions((yAxis ++ breakdown).map(_.function))
      case None =>
        breakdown match {
          case Some(b) =>
            builder.addFunction(b.function)
          case None =>
        }
        builder.addFunctions(yAxis.map(_.function))
    }
    builder.addCondition(Or(filters))
    builder.addOrders(sorts)
    builder.addViews(sqlViews)
    builder.build()
  }

  override def customCopy(options: Map[String, Any]): SeriesChartSetting = this.copy(options = options)
}

case class ScatterChartSetting(
    xAxis: TableColumn,
    yAxis: TableColumn,
    legend: Option[TableColumn] = None,
    filters: Array[Condition] = Array.empty,
    sorts: Array[OrderBy] = Array.empty,
    sqlViews: Array[SqlView] = Array.empty,
    options: Map[String, Any] = Map.empty
) extends ChartSetting {
  override def toTableColumns: Array[TableColumn] = {
    legend match {
      case Some(l) => Array(l, xAxis, yAxis)
      case None    => Array(xAxis, yAxis)
    }
  }

  override def toQuery: Query = {
    val builder = new ObjectQueryBuilder
    legend match {
      case Some(x) => builder.addFunction(x.function)
      case None    =>
    }
    builder.addFunction(xAxis.function)
    builder.addFunction(yAxis.function)
    builder.addCondition(Or(filters))
    builder.addOrders(sorts)
    builder.addViews(sqlViews)
    builder.build()
  }

  override def customCopy(options: Map[String, Any]): ScatterChartSetting = this.copy(options = options)
}

case class BubbleChartSetting(
    xAxis: TableColumn,
    yAxis: TableColumn,
    value: TableColumn,
    legend: Option[TableColumn] = None,
    filters: Array[Condition] = Array.empty,
    sorts: Array[OrderBy] = Array.empty,
    sqlViews: Array[SqlView] = Array.empty,
    options: Map[String, Any] = Map.empty
) extends ChartSetting {
  override def toTableColumns: Array[TableColumn] = {
    legend match {
      case Some(l) => Array(l, xAxis, yAxis, value)
      case None    => Array(xAxis, yAxis, value)
    }
  }

  override def toQuery: Query = {
    val builder = new ObjectQueryBuilder
    legend match {
      case Some(x) => builder.addFunction(x.function)
      case None    =>
    }
    builder.addFunction(xAxis.function)
    builder.addFunction(yAxis.function)
    builder.addFunction(value.function)
    builder.addCondition(Or(filters))
    builder.addOrders(sorts)
    builder.addViews(sqlViews)
    builder.build()
  }

  override def customCopy(options: Map[String, Any]): BubbleChartSetting = this.copy(options = options)
}

case class HeatMapChartSetting(
    xAxis: TableColumn,
    yAxis: TableColumn,
    value: TableColumn,
    filters: Array[Condition] = Array.empty,
    sorts: Array[OrderBy] = Array.empty,
    sqlViews: Array[SqlView] = Array.empty,
    options: Map[String, Any] = Map.empty
) extends ChartSetting {
  override def toTableColumns: Array[TableColumn] =
    Array(yAxis.copy(isCalcGroupTotal = false), xAxis.copy(isHorizontalView = true), value)

  override def toQuery: Query = {
    val builder = new ObjectQueryBuilder
    builder.addFunction(yAxis.function)
    builder.addFunction(xAxis.function)
    builder.addFunction(value.function)
    builder.addCondition(Or(filters))
    builder.addOrders(sorts)
    builder.addViews(sqlViews)
    builder.build()
  }

  override def customCopy(options: Map[String, Any]): HeatMapChartSetting = this.copy(options = options)
}

case class TableChartSetting(
    columns: Array[TableColumn],
    formatters: Array[TableColumn] = Array.empty,
    filters: Array[Condition] = Array.empty,
    sorts: Array[OrderBy] = Array.empty,
    sqlViews: Array[SqlView] = Array.empty,
    options: Map[String, Any] = Map.empty
) extends ChartSetting {
  override def toTableColumns: Array[TableColumn] =
    columns.map(c => c.copy(isCalcGroupTotal = false))

  override def toQuery: Query = {
    val builder = new ObjectQueryBuilder
    builder.addFunctions(columns.map(_.function))
    builder.addCondition(Or(filters))
    builder.addOrders(sorts)
    builder.addViews(sqlViews)
    builder.build()
  }

  override def customCopy(options: Map[String, Any]): TableChartSetting = this.copy(options = options)
}

case class GroupTableChartSetting(
    columns: Array[TableColumn],
    formatters: Array[TableColumn] = Array.empty,
    filters: Array[Condition] = Array.empty,
    sorts: Array[OrderBy] = Array.empty,
    sqlViews: Array[SqlView] = Array.empty,
    options: Map[String, Any] = Map.empty
) extends ChartSetting {
  override def toTableColumns: Array[TableColumn] = {
    // hotfix: col name of table must not be duplicate
    columns.zipWithIndex.foreach {
      case (col, i) =>
        if (columns.map(_.name).count(_ == col.name) > 1) {
          columns(i) = col.copy(name = col.name + s" ${i}")
        }
    }

    columns.map(c => c.copy(isCalcGroupTotal = true)) ++ formatters.map(c => c.copy(isCalcGroupTotal = false))
  }

  override def toQuery: Query = {
    val builder = new ObjectQueryBuilder
    builder.addFunctions(columns.map(_.function) ++ formatters.map(_.function))
    builder.addCondition(Or(filters))
    builder.addOrders(sorts)
    builder.addViews(sqlViews)
    builder.build()
  }

  override def customCopy(options: Map[String, Any]): GroupTableChartSetting = this.copy(options = options)
}

case class NumberChartSetting(
    value: TableColumn,
    filters: Array[Condition] = Array.empty,
    sorts: Array[OrderBy] = Array.empty,
    sqlViews: Array[SqlView] = Array.empty,
    compareRequest: Option[CompareRequest] = None,
    filterRequest: Option[FilterRequest] = None,
    options: Map[String, Any] = Map.empty
) extends ChartSetting {
  override def toTableColumns: Array[TableColumn] = Array(value)

  override def toQuery: Query = {
    val builder = new ObjectQueryBuilder
    builder.addFunction(value.function)
    builder.addCondition(Or(filters))
    builder.addOrders(sorts)
    builder.addViews(sqlViews)
    builder.build()
  }

  override def customCopy(options: Map[String, Any]): NumberChartSetting = this.copy(options = options)
}

case class GaugeChartSetting(
    value: TableColumn,
    filters: Array[Condition] = Array.empty,
    sorts: Array[OrderBy] = Array.empty,
    sqlViews: Array[SqlView] = Array.empty,
    options: Map[String, Any] = Map.empty
) extends ChartSetting {
  override def toTableColumns: Array[TableColumn] = Array(value)

  override def toQuery: Query = {
    val builder = new ObjectQueryBuilder
    builder.addFunction(value.function)
    builder.addCondition(Or(filters))
    builder.addOrders(sorts)
    builder.addViews(sqlViews)
    builder.build()
  }

  override def customCopy(options: Map[String, Any]): GaugeChartSetting = this.copy(options = options)
}

case class DrilldownChartSetting(
    legends: Array[TableColumn],
    value: TableColumn,
    seriesTypes: Option[Map[Int, String]] = None,
    filters: Array[Condition] = Array.empty,
    sorts: Array[OrderBy] = Array.empty,
    sqlViews: Array[SqlView] = Array.empty,
    options: Map[String, Any] = Map.empty
) extends ChartSetting {
  override def toTableColumns: Array[TableColumn] = legends.map(l => l.copy(isCalcGroupTotal = true)) :+ value

  override def toQuery: Query = {
    val builder = new ObjectQueryBuilder
    builder.addFunctions(legends.map(_.function))
    builder.addFunction(value.function)
    builder.addCondition(Or(filters))
    builder.addOrders(sorts)
    builder.addViews(sqlViews)
    builder.build()
  }

  override def customCopy(options: Map[String, Any]): DrilldownChartSetting = this.copy(options = options)
}

case class TreeMapChartSetting(
    legends: Array[TableColumn],
    value: TableColumn,
    filters: Array[Condition] = Array.empty,
    sorts: Array[OrderBy] = Array.empty,
    sqlViews: Array[SqlView] = Array.empty,
    options: Map[String, Any] = Map.empty
) extends ChartSetting {
  override def toTableColumns: Array[TableColumn] = legends.map(l => l.copy(isCalcGroupTotal = true)) :+ value

  override def toQuery: Query = {
    val builder = new ObjectQueryBuilder
    builder.addFunctions(legends.map(_.function))
    builder.addFunction(value.function)
    builder.addCondition(Or(filters))
    builder.addOrders(sorts)
    builder.addViews(sqlViews)
    builder.build()
  }

  override def customCopy(options: Map[String, Any]): TreeMapChartSetting = this.copy(options = options)
}

case class WordCloudChartSetting(
    legend: TableColumn,
    value: TableColumn,
    filters: Array[Condition] = Array.empty,
    sorts: Array[OrderBy] = Array.empty,
    sqlViews: Array[SqlView] = Array.empty,
    options: Map[String, Any] = Map.empty
) extends ChartSetting {
  override def toTableColumns: Array[TableColumn] = Array(legend, value)

  override def toQuery: Query = {
    val builder = new ObjectQueryBuilder
    builder.addFunction(legend.function)
    builder.addFunction(value.function)
    builder.addCondition(Or(filters))
    builder.addOrders(sorts)
    builder.addViews(sqlViews)
    builder.build()
  }

  override def customCopy(options: Map[String, Any]): WordCloudChartSetting = this.copy(options = options)
}

case class HistogramChartSetting(
    binsNumber: Int = 5,
    value: TableColumn,
    filters: Array[Condition] = Array.empty,
    sorts: Array[OrderBy] = Array.empty,
    sqlViews: Array[SqlView] = Array.empty,
    options: Map[String, Any] = Map.empty
) extends ChartSetting {
  override def toTableColumns: Array[TableColumn] = Array(value)

  override def toQuery: Query = {
    val builder = new ObjectQueryBuilder
    builder.addFunction(value.function)
    builder.addCondition(Or(filters))
    builder.addOrders(sorts)
    builder.addViews(sqlViews)
    builder.build()
  }

  override def customCopy(options: Map[String, Any]): HistogramChartSetting = this.copy(options = options)
}

@deprecated("use TabControlChartSetting instead")
case class DropdownFilterChartSetting(
    value: TableColumn,
    label: Option[TableColumn] = None,
    filters: Array[Condition] = Array.empty,
    sorts: Array[OrderBy] = Array.empty,
    sqlViews: Array[SqlView] = Array.empty,
    filterRequest: Option[FilterRequest] = None,
    options: Map[String, Any] = Map.empty
) extends ChartSetting
    with FilterSetting
    with DrillThroughSetting {
  override def toTableColumns: Array[TableColumn] =
    if (label.isDefined) Array(label.get, value) else Array(value, value)

  override def toQuery: Query = {
    val builder = new ObjectQueryBuilder
    if (label.isDefined) builder.addFunction(label.get.function) else builder.addFunction(value.function)
    builder.addFunction(value.function)
    builder.addCondition(Or(filters))
    builder.addOrders(sorts)
    builder.addViews(sqlViews)
    builder.build()
  }

  override def customCopy(options: Map[String, Any]): DropdownFilterChartSetting = this.copy(options = options)

  override def getDrillThroughFields(): Seq[Field] = {
    value.function match {
      case function: FieldRelatedFunction => Seq(function.field)
      case _                              => Seq.empty
    }
  }
}

@deprecated("use TabControlChartSetting instead")
case class TabFilterChartSetting(
    value: TableColumn,
    label: Option[TableColumn] = None,
    filters: Array[Condition] = Array.empty,
    sorts: Array[OrderBy] = Array.empty,
    sqlViews: Array[SqlView] = Array.empty,
    filterRequest: Option[FilterRequest] = None,
    options: Map[String, Any] = Map.empty
) extends ChartSetting
    with FilterSetting
    with DrillThroughSetting {
  override def toTableColumns: Array[TableColumn] =
    if (label.isDefined) Array(label.get, value) else Array(value, value)

  override def toQuery: Query = {
    val builder = new ObjectQueryBuilder
    if (label.isDefined) builder.addFunction(label.get.function) else builder.addFunction(value.function)
    builder.addFunction(value.function)
    builder.addCondition(Or(filters))
    builder.addOrders(sorts)
    builder.addViews(sqlViews)
    builder.build()
  }

  override def customCopy(options: Map[String, Any]): TabFilterChartSetting = this.copy(options = options)

  override def getDrillThroughFields(): Seq[Field] = {
    value.function match {
      case function: FieldRelatedFunction => Seq(function.field)
      case _                              => Seq.empty
    }
  }
}

case class TabControlChartSetting(
    values: Array[TableColumn],
    label: Option[TableColumn] = None,
    filters: Array[Condition] = Array.empty,
    sorts: Array[OrderBy] = Array.empty,
    sqlViews: Array[SqlView] = Array.empty,
    filterRequest: Option[FilterRequest] = None,
    options: Map[String, Any] = Map.empty
) extends ChartSetting
    with FilterSetting
    with DrillThroughSetting {

  override def toTableColumns: Array[TableColumn] = Array(getLabelColumn, getValueColumn)

  override def toQuery: Query = {
    val func1 = getLabelColumn.function.asInstanceOf[FieldRelatedFunction].customCopy(Some("val1"))
    val func2 = getLabelColumn.function.asInstanceOf[FieldRelatedFunction].customCopy(Some("val2"))
    val builder = new ObjectQueryBuilder
    builder.addFunctions(Array(func1, func2))
    builder.addCondition(Or(filters))
    builder.addOrders(sorts)
    builder.addViews(sqlViews)
    builder.build()
  }

  override def customCopy(options: Map[String, Any]): TabControlChartSetting = this.copy(options = options)

  override def getDrillThroughFields(): Seq[Field] = {
    getValueColumn.function match {
      case function: FieldRelatedFunction => Seq(function.field)
      case _                              => Seq.empty
    }
  }

  private def getValueColumn: TableColumn = {
    require(values.nonEmpty, "tab control's values can not be empty")
    values.head
  }

  private def getLabelColumn: TableColumn = {
    label.getOrElse(getValueColumn)
  }

}

case class InputControlChartSetting(
    values: Array[TableColumn],
    filters: Array[Condition] = Array.empty,
    sorts: Array[OrderBy] = Array.empty,
    sqlViews: Array[SqlView] = Array.empty,
    filterRequest: Option[FilterRequest] = None,
    options: Map[String, Any] = Map.empty
) extends ChartSetting
    with FilterSetting
    with DrillThroughSetting {

  override def toTableColumns: Array[TableColumn] = values

  override def toQuery: Query = {
    val builder = new ObjectQueryBuilder
    builder.addFunctions(values.map(_.function))
    builder.addCondition(Or(filters))
    builder.addOrders(sorts)
    builder.addViews(sqlViews)
    builder.build()
  }

  override def customCopy(options: Map[String, Any]): InputControlChartSetting = this.copy(options = options)

  override def getDrillThroughFields(): Seq[Field] = {
    val firstColumn: Option[TableColumn] = values.headOption
    if (firstColumn.isDefined) {
      firstColumn.get.function match {
        case function: FieldRelatedFunction => Seq(function.field)
        case _                              => Seq.empty
      }
    } else {
      Seq.empty
    }
  }
}

case class MapChartSetting(
    location: TableColumn,
    value: TableColumn,
    geoArea: GeoArea,
    normalizedNameMap: String = "{}",
    filters: Array[Condition] = Array.empty,
    sorts: Array[OrderBy] = Array.empty,
    sqlViews: Array[SqlView] = Array.empty,
    options: Map[String, Any] = Map.empty
) extends ChartSetting {
  override def toTableColumns: Array[TableColumn] = Array(location, value)

  override def toQuery: Query = {
    val builder = new ObjectQueryBuilder
    builder.addFunction(location.function)
    builder.addFunction(value.function)
    builder.addCondition(Or(filters))
    builder.addOrders(sorts)
    builder.addViews(sqlViews)
    builder.build()
  }

  override def customCopy(options: Map[String, Any]): MapChartSetting = this.copy(options = options)
}

case class PivotTableSetting(
    rows: Array[TableColumn],
    columns: Array[TableColumn],
    values: Array[TableColumn],
    formatters: Array[TableColumn] = Array.empty,
    filters: Array[Condition] = Array.empty,
    sorts: Array[OrderBy] = Array.empty,
    aggregateConditions: Array[AggregateCondition] = Array.empty,
    views: Array[SqlView] = Array.empty,
    joinConditions: Array[JoinCondition] = Array.empty,
    sqlViews: Array[SqlView] = Array.empty,
    options: Map[String, Any] = Map.empty
) extends ChartSetting {
  override def toTableColumns: Array[TableColumn] = {
    values.zipWithIndex.foreach {
      case (col, i) =>
        if (values.map(_.name).count(_ == col.name) > 1) {
          values(i) = col.copy(name = col.name + s" ${i}")
        }
    }

    rows.map(c => c.copy(isCalcGroupTotal = true)) ++
      columns.map(c => c.copy(isHorizontalView = true)) ++
      values ++
      formatters
  }

  override def toQuery: Query = {
    val builder = new ObjectQueryBuilder
    builder.addFunctions(rows.map(_.function))
    builder.addFunctions(columns.map(_.function))
    builder.addFunctions(values.map(_.function))
    builder.addFunctions(formatters.map(_.function))
    builder.addCondition(Or(filters))
    builder.addOrders(sorts)
    builder.addViews(views)
    builder.addJoinConditions(joinConditions)
    builder.addAggregateConditions(aggregateConditions)
    builder.addViews(sqlViews)
    builder.build()
  }

  def toHorizontalTableColumns: Array[TableColumn] = {
    columns.map(c => c.copy(isCalcGroupTotal = false)) ++ values.map(v => v.copy(isCalcMinMax = false)) ++ formatters
      .map(v => v.copy(isCalcMinMax = false))
  } // TODO: currently only calculate total of each column, if change this then also need to fix processPivotTableHeader

  def toHorizontalTotalQuery: Query = {
    val builder = new ObjectQueryBuilder
    builder.addFunctions(columns.map(_.function))
    builder.addFunctions(values.map(_.function))
    builder.addFunctions(formatters.map(_.function))
    builder.addCondition(Or(filters))
    builder.addOrders(sorts)
    builder.addViews(views)
    builder.addJoinConditions(joinConditions)
    builder.addAggregateConditions(aggregateConditions)
    builder.addViews(sqlViews)
    builder.build()
  }

  def toGrandTotalTableColumns: Array[TableColumn] = {
    values ++ formatters
  }

  def toGrandTotalQuery: Query = {
    val builder = new ObjectQueryBuilder
    builder.addFunctions(values.map(_.function))
    builder.addFunctions(formatters.map(_.function))
    builder.addCondition(Or(filters))
    builder.addViews(sqlViews)
    builder.build()
  }

  override def customCopy(options: Map[String, Any]): PivotTableSetting = this.copy(options = options)
}

case class FlattenPivotTableSetting(
    rows: Array[TableColumn],
    columns: Array[TableColumn],
    values: Array[TableColumn],
    formatters: Array[TableColumn] = Array.empty,
    filters: Array[Condition] = Array.empty,
    sorts: Array[OrderBy] = Array.empty,
    aggregateConditions: Array[AggregateCondition] = Array.empty,
    views: Array[SqlView] = Array.empty,
    joinConditions: Array[JoinCondition] = Array.empty,
    sqlViews: Array[SqlView] = Array.empty,
    options: Map[String, Any] = Map.empty
) extends ChartSetting {
  override def toTableColumns: Array[TableColumn] = {
    rows.map(c => c.copy(isCalcGroupTotal = false)) ++
      columns.map(c => c.copy(isHorizontalView = true)) ++
      values ++
      formatters
  }

  override def toQuery: Query = {
    val builder = new ObjectQueryBuilder
    builder.addFunctions(rows.map(_.function))
    builder.addFunctions(columns.map(_.function))
    builder.addFunctions(values.map(_.function))
    builder.addFunctions(formatters.map(_.function))
    builder.addCondition(Or(filters))
    builder.addOrders(sorts)
    builder.addViews(views)
    builder.addJoinConditions(joinConditions)
    builder.addAggregateConditions(aggregateConditions)
    builder.addViews(sqlViews)
    builder.build()
  }

  def toHorizontalTableColumns: Array[TableColumn] = {
    columns.map(c => c.copy(isCalcGroupTotal = false)) ++ values.map(v => v.copy(isCalcMinMax = false)) ++ formatters
      .map(v => v.copy(isCalcMinMax = false))
  } // TODO: currently only calculate total of each column, if change this then also need to fix processPivotTableHeader

  def toHorizontalTotalQuery: Query = {
    val builder = new ObjectQueryBuilder
    builder.addFunctions(columns.map(_.function))
    builder.addFunctions(values.map(_.function))
    builder.addFunctions(formatters.map(_.function))
    builder.addCondition(Or(filters))
    builder.addOrders(sorts)
    builder.addViews(views)
    builder.addJoinConditions(joinConditions)
    builder.addAggregateConditions(aggregateConditions)
    builder.addViews(sqlViews)
    builder.build()
  }

  def toGrandTotalTableColumns: Array[TableColumn] = {
    values ++ formatters
  }

  def toGrandTotalQuery: Query = {
    val builder = new ObjectQueryBuilder
    builder.addFunctions(values.map(_.function))
    builder.addFunctions(formatters.map(_.function))
    builder.addCondition(Or(filters))
    builder.addViews(sqlViews)
    builder.build()
  }

  override def customCopy(options: Map[String, Any]): FlattenPivotTableSetting = this.copy(options = options)
}

case class RawQuerySetting(
    sql: String,
    filters: Array[Condition] = Array.empty,
    sorts: Array[OrderBy] = Array.empty,
    sqlViews: Array[SqlView] = Array.empty,
    options: Map[String, Any] = Map.empty
) extends ChartSetting {

  override def toQuery: Query = SqlQuery(sql)

  override def toTableColumns: Array[TableColumn] = Array.empty

  override def customCopy(options: Map[String, Any]): RawQuerySetting = this.copy(options = options)
}

case class DonutChartSetting(
    legend: TableColumn,
    value: TableColumn,
    filters: Array[Condition] = Array.empty,
    sorts: Array[OrderBy] = Array.empty,
    sqlViews: Array[SqlView] = Array.empty,
    options: Map[String, Any] = Map.empty
) extends ChartSetting {
  override def toTableColumns: Array[TableColumn] = Array(legend, value)

  override def toQuery: Query = {
    val builder = new ObjectQueryBuilder
    builder.addFunction(legend.function)
    builder.addFunction(value.function)
    builder.addCondition(Or(filters))
    builder.addOrders(sorts)
    builder.addViews(sqlViews)
    builder.build()
  }

  override def customCopy(options: Map[String, Any]): DonutChartSetting = this.copy(options = options)
}

case class ParliamentChartSetting(
    legend: TableColumn,
    value: TableColumn,
    filters: Array[Condition] = Array.empty,
    sorts: Array[OrderBy] = Array.empty,
    sqlViews: Array[SqlView] = Array.empty,
    options: Map[String, Any] = Map.empty
) extends ChartSetting {
  override def toTableColumns: Array[TableColumn] = Array(legend, value)

  override def toQuery: Query = {
    val builder = new ObjectQueryBuilder
    builder.addFunction(legend.function)
    builder.addFunction(value.function)
    builder.addCondition(Or(filters))
    builder.addOrders(sorts)
    builder.addViews(sqlViews)
    builder.build()
  }

  override def customCopy(options: Map[String, Any]): ParliamentChartSetting = this.copy(options = options)
}

case class SpiderWebChartSetting(
    legend: TableColumn,
    values: Array[TableColumn],
    filters: Array[Condition] = Array.empty,
    sorts: Array[OrderBy] = Array.empty,
    sqlViews: Array[SqlView] = Array.empty,
    options: Map[String, Any] = Map.empty
) extends ChartSetting {
  override def toTableColumns: Array[TableColumn] = Array(legend) ++ values

  override def toQuery: Query = {
    val builder = new ObjectQueryBuilder
    builder.addFunction(legend.function)
    builder.addFunctions(values.map(_.function))
    builder.addCondition(Or(filters))
    builder.addOrders(sorts)
    builder.addViews(sqlViews)
    builder.build()
  }

  override def customCopy(options: Map[String, Any]): SpiderWebChartSetting = this.copy(options = options)
}

case class BellCurveChartSetting(
    value: TableColumn,
    filters: Array[Condition] = Array.empty,
    sorts: Array[OrderBy] = Array.empty,
    sqlViews: Array[SqlView] = Array.empty,
    options: Map[String, Any] = Map.empty
) extends ChartSetting {
  override def toTableColumns: Array[TableColumn] = Array(value)

  override def toQuery: Query = {
    val builder = new ObjectQueryBuilder
    builder.addFunction(value.function)
    builder.addCondition(Or(filters))
//    builder.addOrders(sorts) Bell curve ko co sort -> according to Hao
    builder.addViews(sqlViews)
    builder.build()
  }

  override def customCopy(options: Map[String, Any]): BellCurveChartSetting = this.copy(options = options)
}

case class SankeyChartSetting(
    source: TableColumn,
    destination: TableColumn,
    weight: TableColumn,
    breakdowns: Array[TableColumn] = Array.empty,
    filters: Array[Condition] = Array.empty,
    sorts: Array[OrderBy] = Array.empty,
    sqlViews: Array[SqlView] = Array.empty,
    options: Map[String, Any] = Map.empty
) extends ChartSetting {
  override def toTableColumns: Array[TableColumn] = {
    if (breakdowns.nonEmpty) {
      Array(
        source.copy(isCalcGroupTotal = false, isHorizontalView = false),
        breakdowns(0), // currently only support first element
        destination.copy(isHorizontalView = false),
        weight
      )
    } else {
      Array(
        source.copy(isCalcGroupTotal = false, isHorizontalView = false),
        destination.copy(isHorizontalView = false),
        weight
      )
    }
  }

  // sankey la truong hop dac biet, ko build 1 query tu dau dc
  @deprecated("use buildSankeyQuery instead")
  override def toQuery: Query = {
    /*val builder = new ObjectQueryBuilder
    builder.addFunction(source.function)
    builder.addFunctions(breakdown.map(_.function))
    builder.addFunction(destination.function)
    builder.addFunction(weight.function)
    builder.addCondition(Or(filters))
    builder.addOrders(sorts)
    builder.build()*/
    SqlQuery("")
  }

  def buildSankeyQuery(sourceCol: TableColumn, destinationCol: TableColumn): Query = {
    val builder = new ObjectQueryBuilder
    builder.addFunction(sourceCol.function)
    builder.addFunction(destinationCol.function)
    builder.addFunction(weight.function)
    builder.addCondition(Or(filters))
    builder.addOrders(sorts)
    builder.addViews(sqlViews)
    builder.build()
  }

  override def customCopy(options: Map[String, Any]): SankeyChartSetting = this.copy(options = options)
}

case class BulletChartSetting(
    values: Array[TableColumn],
    breakdown: Option[TableColumn] = None,
    filters: Array[Condition] = Array.empty,
    sorts: Array[OrderBy] = Array.empty,
    sqlViews: Array[SqlView] = Array.empty,
    options: Map[String, Any] = Map.empty
) extends ChartSetting {
  override def toTableColumns: Array[TableColumn] = breakdown.toArray ++ values

  override def toQuery: Query = {
    val builder = new ObjectQueryBuilder
    if (breakdown.isDefined) {
      builder.addFunction(breakdown.get.function)
    }
    builder.addFunctions(values.map(_.function))
    builder.addCondition(Or(filters))
    builder.addOrders(sorts)
    builder.addViews(sqlViews)
    builder.build()
  }

  override def customCopy(options: Map[String, Any]): BulletChartSetting = this.copy(options = options)
}

case class GenericChartSetting(
    columns: Array[TableColumn],
    filters: Array[Condition] = Array.empty,
    sorts: Array[OrderBy] = Array.empty,
    sqlViews: Array[SqlView] = Array.empty,
    filterRequest: Option[FilterRequest] = None,
    options: Map[String, Any] = Map.empty
) extends ChartSetting
    with FilterSetting {

  override def toTableColumns: Array[TableColumn] =
    columns.map(c => c.copy(isCalcGroupTotal = false, isCalcMinMax = false, isHorizontalView = false))

  override def toQuery: Query = {
    val builder = new ObjectQueryBuilder
    builder.addFunctions(columns.map(_.function))
    builder.addCondition(Or(filters))
    builder.addOrders(sorts)
    builder.addViews(sqlViews)
    builder.build()
  }

  override def customCopy(options: Map[String, Any]): GenericChartSetting = this.copy(options = options)
}

case class TableColumn(
    name: String,
    function: Function,
    isHorizontalView: Boolean = false,
    isCalcGroupTotal: Boolean = false,
    isCalcMinMax: Boolean = false,
    formatterKey: Option[String] = None,
    isDynamicFunction: Boolean = false,
    dynamicFunctionId: Option[Long] = None,
    isFlatten: Boolean = false
)
