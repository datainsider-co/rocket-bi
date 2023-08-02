package co.datainsider.bi.domain.response

import co.datainsider.bi.domain.CompareMode.CompareMode
import co.datainsider.bi.domain.Ids.Geocode
import com.fasterxml.jackson.annotation.JsonSubTypes.Type
import com.fasterxml.jackson.annotation.{JsonSubTypes, JsonTypeInfo}
import com.fasterxml.jackson.databind.JsonNode
import education.x.commons.Serializer
import org.apache.commons.lang3.SerializationUtils

import scala.collection.immutable.HashMap

@JsonTypeInfo(
  use = JsonTypeInfo.Id.NAME,
  include = JsonTypeInfo.As.PROPERTY,
  property = "class_name"
)
@JsonSubTypes(
  Array(
    new Type(value = classOf[TableResponse], name = "table_chart_response_old"),
    new Type(value = classOf[JsonTableResponse], name = "json_table_response"),
    new Type(value = classOf[IndexedTableResponse], name = "indexed_table_response"),
    new Type(value = classOf[ScatterLikeResponse], name = "scatter_like_response"),
    new Type(value = classOf[SeriesOneResponse], name = "series_one_response"),
    new Type(value = classOf[SeriesTwoResponse], name = "series_two_response"),
    new Type(value = classOf[DrilldownResponse], name = "drilldown_response"),
    new Type(value = classOf[TreeMapResponse], name = "tree_map_response"),
    new Type(value = classOf[VizTableResponse], name = "viz_table_response"),
    new Type(value = classOf[WordCloudResponse], name = "word_cloud_response"),
    new Type(value = classOf[MapResponse], name = "map_response"),
    new Type(value = classOf[GenericChartResponse], name = "generic_chart_response")
  )
)
@SerialVersionUID(20220524L)
abstract class ChartResponse {
  val lastQueryTime: Long
  val lastProcessingTime: Long

  def setTime(queryTime: Long, processTime: Long): ChartResponse
}

object ChartResponse {
  implicit object ChartResponseSerializer extends Serializer[ChartResponse] {
    override def fromByte(bytes: Array[Byte]): ChartResponse = {
      SerializationUtils.deserialize(bytes).asInstanceOf[ChartResponse]
    }

    override def toByte(value: ChartResponse): Array[Byte] = {
      SerializationUtils.serialize(value.asInstanceOf[Serializable])
    }
  }
}

case class TableResponse(
    headers: Array[String],
    records: Array[Array[Object]],
    compareResult: Option[BaseCompareResult] = None,
    lastQueryTime: Long = 0,
    lastProcessingTime: Long = 0
) extends ChartResponse {
  def setTime(lastQueryTime: Long, lastProcessingTime: Long): TableResponse = {
    this.copy(lastQueryTime = lastQueryTime, lastProcessingTime = lastProcessingTime)
  }
}

case class JsonTableResponse(
    headers: JsonNode,
    records: JsonNode,
    total: Long,
    minMaxValues: Seq[MinMaxPair] = Seq.empty,
    lastQueryTime: Long = 0,
    lastProcessingTime: Long = 0
) extends ChartResponse {
  def setTime(lastQueryTime: Long, lastProcessingTime: Long): JsonTableResponse = {
    this.copy(lastQueryTime = lastQueryTime, lastProcessingTime = lastProcessingTime)
  }
}

case class IndexedTableResponse(
    xAxis: Array[String],
    yAxis: Array[String],
    data: Array[Array[Object]],
    lastQueryTime: Long = 0,
    lastProcessingTime: Long = 0
) extends ChartResponse {
  def setTime(lastQueryTime: Long, lastProcessingTime: Long): IndexedTableResponse = {
    this.copy(lastQueryTime = lastQueryTime, lastProcessingTime = lastProcessingTime)
  }
}

case class ScatterLikeResponse(
    seriesNames: Array[String],
    data: Array[Array[Array[Object]]],
    lastQueryTime: Long = 0,
    lastProcessingTime: Long = 0
) extends ChartResponse {
  def setTime(lastQueryTime: Long, lastProcessingTime: Long): ScatterLikeResponse = {
    this.copy(lastQueryTime = lastQueryTime, lastProcessingTime = lastProcessingTime)
  }
}

/** *
  *
  * @param name name of series
  * @param data data by series (length of data == length of xAxis)
  * @param stack column & bar chart only, every other chart is None
  */
case class SeriesOneItem(name: String, data: Array[Object], stack: Option[String] = None)
case class SeriesOneResponse(
    series: Array[SeriesOneItem],
    xAxis: Option[Array[String]] = None,
    yAxis: Option[Array[Object]] = None,
    compareResponses: Option[HashMap[CompareMode, SeriesOneResponse]] = None,
    lastQueryTime: Long = 0,
    lastProcessingTime: Long = 0
) extends ChartResponse {
  def setTime(lastQueryTime: Long, lastProcessingTime: Long): SeriesOneResponse = {
    this.copy(lastQueryTime = lastQueryTime, lastProcessingTime = lastProcessingTime)
  }
}

case class SeriesTwoItem(name: String, data: Array[Array[Object]])
case class SeriesTwoResponse(
    series: Array[SeriesTwoItem],
    xAxis: Option[Array[Object]] = None,
    yAxis: Option[Array[Object]] = None,
    total: Option[Double] = None,
    lastQueryTime: Long = 0,
    lastProcessingTime: Long = 0
) extends ChartResponse {
  def setTime(lastQueryTime: Long, lastProcessingTime: Long): SeriesTwoResponse = {
    this.copy(lastQueryTime = lastQueryTime, lastProcessingTime = lastProcessingTime)
  }
}

case class DrilldownValue(name: String, y: Object, drilldown: String)
case class DrilldownItem(name: String, id: String, data: Array[DrilldownValue])
case class DrilldownResponse(
    name: String,
    series: Array[DrilldownValue],
    drilldown: Array[DrilldownItem],
    lastQueryTime: Long = 0,
    lastProcessingTime: Long = 0
) extends ChartResponse {
  def setTime(lastQueryTime: Long, lastProcessingTime: Long): DrilldownResponse = {
    this.copy(lastQueryTime = lastQueryTime, lastProcessingTime = lastProcessingTime)
  }
}

case class TreeMapItem(id: String, name: String, value: Object, colorValue: Object, parent: String)
case class TreeMapResponse(
    name: String,
    data: Array[TreeMapItem],
    groupNames: Array[String],
    lastQueryTime: Long = 0,
    lastProcessingTime: Long = 0
) extends ChartResponse {
  def setTime(lastQueryTime: Long, lastProcessingTime: Long): TreeMapResponse = {
    this.copy(lastQueryTime = lastQueryTime, lastProcessingTime = lastProcessingTime)
  }
}

case class VizTableResponse(
    headers: Array[String],
    records: Array[Array[Object]],
    total: Long,
    lastQueryTime: Long = 0,
    lastProcessingTime: Long = 0
) extends ChartResponse {
  def setTime(lastQueryTime: Long, lastProcessingTime: Long): VizTableResponse = {
    this.copy(lastQueryTime = lastQueryTime, lastProcessingTime = lastProcessingTime)
  }
}

case class GenericChartResponse(
    headers: Array[String],
    records: Array[Array[Object]],
    lastQueryTime: Long = 0,
    lastProcessingTime: Long = 0
) extends ChartResponse {
  def setTime(lastQueryTime: Long, lastProcessingTime: Long): GenericChartResponse = {
    this.copy(lastQueryTime = lastQueryTime, lastProcessingTime = lastProcessingTime)
  }
}

case class WordCloudItem(name: String, weight: Object)
case class WordCloudResponse(
    name: String,
    data: Array[WordCloudItem],
    lastQueryTime: Long = 0,
    lastProcessingTime: Long = 0
) extends ChartResponse {
  def setTime(lastQueryTime: Long, lastProcessingTime: Long): WordCloudResponse = {
    this.copy(lastQueryTime = lastQueryTime, lastProcessingTime = lastProcessingTime)
  }
}

case class MapItem(code: Geocode, name: String, value: Object)
case class MapResponse(
    data: Seq[MapItem],
    unknownData: Array[MapItem],
    lastQueryTime: Long = 0,
    lastProcessingTime: Long = 0
) extends ChartResponse {
  def setTime(queryTime: Long, processTime: Long): MapResponse = {
    this.copy(lastQueryTime = queryTime, lastProcessingTime = processTime)
  }
}

case class MinMaxPair(valueName: String, min: Double, max: Double)

// Result of compare between 2 query response
abstract class CompareResponse

case class ValuesTable(records: Array[Array[Object]]) extends CompareResponse

case class DifferenceTable(diff: Array[Array[Object]]) extends CompareResponse

case class PercentageDifferenceTable(percentageDiff: Array[Array[Object]]) extends CompareResponse

case class BaseCompareResult(
    valuesTable: Option[ValuesTable],
    diffTable: Option[DifferenceTable] = None,
    percentageDiffTable: Option[PercentageDifferenceTable] = None
)
