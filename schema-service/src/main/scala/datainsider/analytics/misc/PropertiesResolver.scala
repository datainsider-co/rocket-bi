package datainsider.analytics.misc

import com.twitter.util.Future
import datainsider.analytics.controller.http.request.BatchTrackingRequest
import datainsider.analytics.domain.{AnalyticsConfig, EventColumnIds, EventData, TrackingColumnConfig}
import datainsider.analytics.domain.commands.TrackingEvent
import datainsider.analytics.service.generator.{EventIdGenerator, TrackingIdGenerator}
import datainsider.ingestion.util.Implicits.ImplicitString

@deprecated("old tracking mechanism")
object PropertiesResolver {

  /**
    * @param trackingId id of this track action
    * @param eventId id of that event
    * @param event string that specify type of event
    * @param properties  properties of event object (event fields that contain info of a event)
    * @param detailProperties properties of event itself (event detail can be dynamic, depends on usage)
    */
  case class Result(
      trackingId: String,
      eventId: String,
      event: String,
      properties: Map[String, Any],
      detailProperties: Map[String, Any]
  ) {

    def toEventData(): EventData = {
      EventData(
        event,
        properties,
        detailProperties
      )
    }
  }
}

@deprecated("old tracking mechanism")
trait PropertiesResolver {

  def buildEventProperties(orgId: Long, event: TrackingEvent): Future[PropertiesResolver.Result]

  def buildListEventProps(orgId: Long, events: Seq[TrackingEvent]): Future[Seq[PropertiesResolver.Result]]

  def buildProfileProperties(orgId: Long, properties: Map[String, Any]): Future[(String, Map[String, Any])]
}

@deprecated("no longer used")
case class TrackingPropertyResolver(
    config: AnalyticsConfig,
    trackingColumnConfig: TrackingColumnConfig,
    eventDetailPropertyBuilders: Map[String, PropertiesBuilder],
    eventIdGenerator: EventIdGenerator,
    trackingIdGenerator: TrackingIdGenerator
) extends PropertiesResolver {
  private val columnNameSet = trackingColumnConfig.sharedEventColumns.map(_.name).toSet

  /**
    * eventProperties is defined by ingestion system (get from config)
    * eventDetailProperties is built based on properties user want to track
    * @param event
    * @return
    */
  override def buildEventProperties(orgId: Long, event: TrackingEvent): Future[PropertiesResolver.Result] = {
    for {
      (trackingId, eventId, trackingProperties) <- enhanceTrackingProperties(orgId, event)
      eventProperties = buildEventProperties(event.name, trackingId, eventId, trackingProperties)
      eventDetailProperties = buildEventDetailProperties(event.name, trackingId, eventId, trackingProperties)
    } yield {
      PropertiesResolver.Result(
        trackingId,
        eventId,
        event.name,
        eventProperties,
        eventDetailProperties
      )
    }
  }

  override def buildListEventProps(orgId: Long, events: Seq[TrackingEvent]): Future[Seq[PropertiesResolver.Result]] = {
    Future.traverseSequentially(events)(event => buildEventProperties(orgId, event))
  }

  override def buildProfileProperties(
      orgId: Long,
      properties: Map[String, Any]
  ): Future[(String, Map[String, Any])] = {
    import scala.jdk.CollectionConverters.mapAsScalaMapConverter

    val normalizedProperties = ColumnDetector.normalizeProperties(properties)

    extractTrackingId(orgId, normalizedProperties).map(trackingId => {
      val map = new java.util.HashMap[String, Any]()
      normalizedProperties.foreach({
        case (k, v) =>
          map.put(k, v)
      })

      map.put(EventColumnIds.TRACKING_ID, trackingId)
      (trackingId, map.asScala.toMap)
    })
  }

  /**
    * generate an id (eventId) for this event
    * detect track_id in properties or create a new track id if track_id properties is not found
    * @param request
    * @return
    */
  private def enhanceTrackingProperties(
      orgId: Long,
      request: TrackingEvent
  ): Future[(String, String, Map[String, Any])] = {
    import scala.jdk.CollectionConverters.mapAsScalaMapConverter

    val eventName: String = request.name
    val properties = ColumnDetector.normalizeProperties(request.properties)

    for {
      eventId <- eventIdGenerator.generateEventId(orgId)
      trackingId <- extractTrackingId(orgId, properties)
    } yield {
      val map = new java.util.HashMap[String, Any]()
      properties.foreach {
        case (k, v) => map.put(k, v)
      }
      map.put(EventColumnIds.EVENT_ID, eventId)
      map.put(EventColumnIds.EVENT_NAME, eventName)
      map.put(EventColumnIds.EVENT_DISPLAY_NAME, eventName.asPrettyDisplayName)
      map.put(EventColumnIds.TRACKING_ID, trackingId)
      map.putIfAbsent(EventColumnIds.USER_ID, "")
      map.putIfAbsent(EventColumnIds.START_TIME, 0L)
      map.putIfAbsent(EventColumnIds.DURATION, 0)
      map.putIfAbsent(EventColumnIds.TIME, System.currentTimeMillis())
      map.put(EventColumnIds.TIME_MS, map.get(EventColumnIds.TIME))
      (trackingId, eventId, map.asScala.toMap)
    }

  }

  private def extractTrackingId(organizationId: Long, properties: Map[String, Any]): Future[String] = {
    properties.get(EventColumnIds.TRACKING_ID).filter(_ != null) match {
      case Some(trackingId) => Future.value(trackingId.toString)
      case _                => trackingIdGenerator.generateTrackingId(organizationId)
    }
  }

  private def buildEventProperties(
      event: String,
      trackingId: String,
      eventId: String,
      properties: Map[String, Any]
  ): Map[String, Any] = {
    val eventProperties = properties.filter(entry => columnNameSet.contains(entry._1))

    eventProperties ++ Map(
      EventColumnIds.IS_SYSTEM_EVENT -> config.isSystemEvent(event)
    )
  }

  private def buildEventDetailProperties(
      event: String,
      trackingId: String,
      eventId: String,
      properties: Map[String, Any]
  ): Map[String, Any] = {
    val builder = eventDetailPropertyBuilders.getOrElse(event, DefaultEventBuilder(trackingColumnConfig))
    builder.build(eventId, properties)
  }

}
