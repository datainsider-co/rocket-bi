package datainsider.analytics.misc

import datainsider.analytics.domain.{EventColumnIds, TrackingColumnConfig}

trait PropertiesBuilder {
  def build(eventId: String, source: Map[String, Any]): Map[String, Any]
}

case class DefaultEventBuilder(trackingColumnConfig: TrackingColumnConfig) extends PropertiesBuilder {

  override def build(eventId: String, source: Map[String, Any]): Map[String, Any] = {
    val builder = EventPropertiesBuilder(
      Seq(
        SystemEnhancement(trackingColumnConfig),
        QueryParamInfoEnhancement(source),
        ReferrerParamInfoEnhancement(source)
      )
    )
    builder.build(eventId, source) ++ Map(
      EventColumnIds.EVENT_ID -> eventId,
      EventColumnIds.TIME -> source.getOrElse(EventColumnIds.TIME, System.currentTimeMillis())
    )
  }
}

case class SessionEventBuilder(trackingColumnConfig: TrackingColumnConfig) extends PropertiesBuilder {

  override def build(eventId: String, source: Map[String, Any]): Map[String, Any] = {
    val builder = EventPropertiesBuilder(
      Seq(
        SystemEnhancement(trackingColumnConfig),
        DurationEnhancement(source),
        QueryParamInfoEnhancement(source),
        ReferrerParamInfoEnhancement(source)
      )
    )
    builder.build(eventId, source) ++ Map(
      EventColumnIds.EVENT_ID -> eventId,
      EventColumnIds.SESSION_ID -> source.getOrElse(EventColumnIds.SESSION_ID, ""),
      EventColumnIds.TIME -> source.getOrElse(EventColumnIds.TIME, System.currentTimeMillis())
    )
  }
}

case class PageViewEventBuilder(trackingColumnConfig: TrackingColumnConfig) extends PropertiesBuilder {

  override def build(eventId: String, source: Map[String, Any]): Map[String, Any] = {
    val builder = EventPropertiesBuilder(
      Seq(
        SystemEnhancement(trackingColumnConfig),
        DurationEnhancement(source),
        ScreenEnhancement(source),
        QueryParamInfoEnhancement(source),
        ReferrerParamInfoEnhancement(source)
      )
    )
    builder.build(eventId, source) ++ Map(
      EventColumnIds.EVENT_ID -> eventId,
      EventColumnIds.TIME -> source.getOrElse(EventColumnIds.TIME, System.currentTimeMillis())
    )
  }
}

private[this] case class EventPropertiesBuilder(enhancements: Seq[PropertiesEnhancement]) extends PropertiesBuilder {

  override def build(eventId: String, source: Map[String, Any]): Map[String, Any] = {
    enhancements.foldLeft(source)((enhancedResult, enhancer) => {
      enhancer.enhance(enhancedResult)
    })
  }
}
