package datainsider.analytics.misc

import datainsider.analytics.domain.{EventColumnIds, TrackingColumnConfig}
import datainsider.client.util.JsonParser

trait PropertiesEnhancement {
  def enhance(source: Map[String, Any]): Map[String, Any]
}

trait QueryParamLike {
  def getQueryParam(properties: Map[String, Any], k: String): Map[String, Any] = {
    properties
      .get(k)
      .map(v => JsonParser.fromJson[Map[String, Any]](v.toString))
      .getOrElse(Map.empty)
  }
}

case class SystemEnhancement(trackingColumnConfig: TrackingColumnConfig) extends PropertiesEnhancement {

  override def enhance(properties: Map[String, Any]): Map[String, Any] = {
    properties.filterNot(entry => trackingColumnConfig.eventColumnNameSet.contains(entry._1))
  }
}

case class QueryParamInfoEnhancement(source: Map[String, Any]) extends PropertiesEnhancement with QueryParamLike {

  override def enhance(properties: Map[String, Any]): Map[String, Any] = {
    val queryProperties = getQueryParam(properties, EventColumnIds.QUERY_PARAMS)
    if (queryProperties.nonEmpty) {
      properties ++ Map(EventColumnIds.ENHANCED_QUERY_PARAM_INFO -> queryProperties)
    } else {
      properties
    }
  }
}

case class ReferrerParamInfoEnhancement(source: Map[String, Any]) extends PropertiesEnhancement with QueryParamLike {

  override def enhance(properties: Map[String, Any]): Map[String, Any] = {
    val queryProperties = getQueryParam(properties, EventColumnIds.REFERRER_QUERY_PARAMS)

    if (queryProperties.nonEmpty) {
      properties ++ Map(EventColumnIds.ENHANCED_REFERRER_QUERY_PARAM_INFO -> queryProperties)
    } else {
      properties
    }
  }
}

case class DurationEnhancement(source: Map[String, Any]) extends PropertiesEnhancement {

  override def enhance(properties: Map[String, Any]): Map[String, Any] = {
    properties ++ Map(
      EventColumnIds.START_TIME -> source.getOrElse(EventColumnIds.START_TIME, 0L),
      EventColumnIds.DURATION -> source.getOrElse(EventColumnIds.DURATION, 0L),
      EventColumnIds.TIME -> source.getOrElse(EventColumnIds.TIME, System.currentTimeMillis())
    )
  }
}

case class ScreenEnhancement(source: Map[String, Any]) extends PropertiesEnhancement {

  override def enhance(properties: Map[String, Any]): Map[String, Any] = {
    properties ++ Map(
      "screen_name" -> source.getOrElse(EventColumnIds.SCREEN_NAME, "")
    )
  }
}
